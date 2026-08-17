"""CrewAI specialist agents for the Artemis outbound engine (Claude)."""

from __future__ import annotations

from functools import lru_cache

from crewai import Agent, LLM

from llm import get_claude_llm
from prompts import require_prompt


@lru_cache(maxsize=1)
def _claude() -> LLM:
    """Lazy LLM init so dotenv can load before the first agent call."""
    return get_claude_llm()


def build_lead_intelligence_agent() -> Agent:
    return Agent(
        role=require_prompt("ARTEMIS_LEAD_ROLE"),
        goal=require_prompt("ARTEMIS_LEAD_GOAL"),
        backstory=require_prompt("ARTEMIS_LEAD_BACKSTORY"),
        llm=_claude(),
        verbose=True,
        allow_delegation=False,
    )


def build_sales_strategist_agent() -> Agent:
    return Agent(
        role=require_prompt("ARTEMIS_STRATEGIST_ROLE"),
        goal=require_prompt("ARTEMIS_STRATEGIST_GOAL"),
        backstory=require_prompt("ARTEMIS_STRATEGIST_BACKSTORY"),
        llm=_claude(),
        verbose=True,
        allow_delegation=False,
    )


def build_conversion_writer_agent() -> Agent:
    return Agent(
        role=require_prompt("ARTEMIS_WRITER_ROLE"),
        goal=require_prompt("ARTEMIS_WRITER_GOAL"),
        backstory=require_prompt("ARTEMIS_WRITER_BACKSTORY"),
        llm=_claude(),
        verbose=True,
        allow_delegation=False,
    )


def get_agents() -> tuple[Agent, Agent, Agent]:
    """Return the three specialist agents sharing the cached Claude LLM."""
    return (
        build_lead_intelligence_agent(),
        build_sales_strategist_agent(),
        build_conversion_writer_agent(),
    )
