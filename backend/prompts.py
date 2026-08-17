"""Load redacted CrewAI prompts from environment variables."""

from __future__ import annotations

import os


class PromptConfigError(RuntimeError):
    """Raised when a required CrewAI prompt env var is missing."""


def require_prompt(key: str) -> str:
    value = os.getenv(key, "").strip()
    if not value:
        raise PromptConfigError(
            f"Missing required CrewAI prompt env var: {key}",
        )
    return value.replace("\\n", "\n")


def render_task_prompt(key: str, **kwargs: str) -> str:
    """Fill runtime intake fields into a stored task template."""
    return require_prompt(key).format(**kwargs)
