"""Shared Claude (Anthropic) LLM configuration for Artemis CrewAI agents."""

from __future__ import annotations

import os

from crewai import LLM

# Override via ANTHROPIC_MODEL if you want a different Claude SKU.
DEFAULT_CLAUDE_MODEL = "anthropic/claude-sonnet-4-20250514"


def get_claude_llm() -> LLM:
    """
    Return a CrewAI LLM wired to Anthropic Claude.

    Requires ANTHROPIC_API_KEY in the environment (loaded via dotenv in main.py).
    max_tokens is required for Anthropic models.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Add it to backend/.env "
            "(see .env.example).",
        )

    model = os.getenv("ANTHROPIC_MODEL", DEFAULT_CLAUDE_MODEL)
    if not model.startswith("anthropic/"):
        model = f"anthropic/{model}"

    return LLM(
        model=model,
        api_key=api_key,
        max_tokens=4096,
        temperature=0.4,
    )
