"""Sequential CrewAI tasks for Artemis playbook generation."""

from __future__ import annotations

from pydantic import BaseModel, Field
from crewai import Agent, Task

from prompts import render_task_prompt, require_prompt


class PlaybookDraft(BaseModel):
    """Structured final deliverable produced by the conversion writer."""

    subject_line: str = Field(..., description="Primary email subject line.")
    email_one: str = Field(..., description="Opening outreach email body.")
    linkedin_dm: str = Field(
        ...,
        description="Short LinkedIn connection / InMail note.",
    )
    email_two: str = Field(..., description="Follow-up email body.")


def build_artemis_tasks(
    target_url: str,
    target_role: str,
    value_proposition: str,
    lead_intelligence_agent: Agent,
    sales_strategist_agent: Agent,
    conversion_writer_agent: Agent,
) -> tuple[Task, Task, Task]:
    """
    Build the three sequential tasks bound to the specialist agents.

    Prompt bodies live in env vars. Task outputs chain via `context`.
    """
    intake = {
        "target_url": target_url,
        "target_role": target_role,
        "value_proposition": value_proposition,
    }

    discovery_task = Task(
        description=render_task_prompt("ARTEMIS_TASK_DISCOVERY_DESCRIPTION", **intake),
        expected_output=require_prompt("ARTEMIS_TASK_DISCOVERY_EXPECTED_OUTPUT"),
        agent=lead_intelligence_agent,
    )

    analysis_task = Task(
        description=render_task_prompt("ARTEMIS_TASK_ANALYSIS_DESCRIPTION", **intake),
        expected_output=require_prompt("ARTEMIS_TASK_ANALYSIS_EXPECTED_OUTPUT"),
        agent=sales_strategist_agent,
        context=[discovery_task],
    )

    drafting_task = Task(
        description=render_task_prompt("ARTEMIS_TASK_DRAFTING_DESCRIPTION", **intake),
        expected_output=require_prompt("ARTEMIS_TASK_DRAFTING_EXPECTED_OUTPUT"),
        agent=conversion_writer_agent,
        context=[discovery_task, analysis_task],
        output_pydantic=PlaybookDraft,
    )

    return discovery_task, analysis_task, drafting_task
