"""Artemis CrewAI orchestration entrypoint."""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from crewai import Crew, Process

from agents import get_agents
from tasks import PlaybookDraft, build_artemis_tasks

logger = logging.getLogger(__name__)


def _extract_json_object(raw: str) -> dict[str, Any] | None:
    """Best-effort parse when the LLM wraps JSON in markdown fences."""
    cleaned = raw.strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, re.DOTALL)
    if fenced:
        cleaned = fenced.group(1)

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        brace = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if not brace:
            return None
        try:
            parsed = json.loads(brace.group(0))
        except json.JSONDecodeError:
            return None

    return parsed if isinstance(parsed, dict) else None


def _normalize_playbook(data: dict[str, Any]) -> dict[str, str]:
    """Validate / coerce crew output into the API playbook shape."""
    draft = PlaybookDraft.model_validate(
        {
            "subject_line": data.get("subject_line", ""),
            "email_one": data.get("email_one") or data.get("email_one_body", ""),
            "linkedin_dm": data.get("linkedin_dm")
            or data.get("linkedin_note", ""),
            "email_two": data.get("email_two") or data.get("email_two_body", ""),
        },
    )
    # Convert agent-safe placeholder to UI mail-merge token.
    normalized = draft.model_dump()
    for key, value in list(normalized.items()):
        if isinstance(value, str):
            normalized[key] = value.replace("[[FirstName]]", "{{FirstName}}")
    return normalized


def run_artemis_crew(
    target_url: str,
    target_role: str,
    value_prop: str,
) -> dict[str, str]:
    """
    Instantiate the sequential specialist crew and return the final playbook.

    Returns a dict with: subject_line, email_one, linkedin_dm, email_two.
    """
    (
        lead_intelligence_agent,
        sales_strategist_agent,
        conversion_writer_agent,
    ) = get_agents()

    discovery_task, analysis_task, drafting_task = build_artemis_tasks(
        target_url=target_url,
        target_role=target_role,
        value_proposition=value_prop,
        lead_intelligence_agent=lead_intelligence_agent,
        sales_strategist_agent=sales_strategist_agent,
        conversion_writer_agent=conversion_writer_agent,
    )

    crew = Crew(
        agents=[
            lead_intelligence_agent,
            sales_strategist_agent,
            conversion_writer_agent,
        ],
        tasks=[discovery_task, analysis_task, drafting_task],
        process=Process.sequential,
        verbose=True,
    )

    result = crew.kickoff(
        inputs={
            "target_url": target_url,
            "target_role": target_role,
            "value_proposition": value_prop,
        },
    )

    # Prefer structured Pydantic / JSON dict from the final task.
    pydantic_out = getattr(result, "pydantic", None)
    if isinstance(pydantic_out, PlaybookDraft):
        return _normalize_playbook(pydantic_out.model_dump())

    json_dict = getattr(result, "json_dict", None)
    if isinstance(json_dict, dict):
        return _normalize_playbook(json_dict)

    raw = getattr(result, "raw", None) or str(result)
    parsed = _extract_json_object(raw)
    if parsed is not None:
        return _normalize_playbook(parsed)

    logger.error("Crew returned unstructured output; raw=%s", raw[:500])
    raise ValueError("Artemis crew did not return a valid playbook JSON payload.")
