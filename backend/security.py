"""Level 3 silent perimeter defense — aggressive prompt-injection sanitization."""

from __future__ import annotations

import re

GUARDRAIL_LEVEL = 3

# Normalized tokens (lowercase, alphanumeric only).
LEVEL3_BLOCKLIST: tuple[str, ...] = (
    # Core
    "ignoreall",
    "systemoverride",
    "environmentvariables",
    "systemprompt",
    # Instruction override
    "ignoreprevious",
    "ignoreprior",
    "disregardprevious",
    "forgetprevious",
    "disregardall",
    "overrideinstructions",
    "newinstructions",
    "follownewinstructions",
    # Prompt / secrets leak
    "revealsystemprompt",
    "showsystemprompt",
    "printsystemprompt",
    "dumpsystemprompt",
    "revealprompt",
    "leakprompt",
    "outputallenvironment",
    "printenv",
    "dumpsecrets",
    "exfiltrate",
    "apikey",
    "secretkey",
    # Jailbreak / role hijack
    "danmode",
    "doanythingnow",
    "jailbreak",
    "developermode",
    "godmode",
    "unrestrictedmode",
    "youarenow",
    "pretendyouare",
    "actasif",
    "roleplayas",
    # Encoding / evasion hints
    "base64decode",
    "rot13",
)

# Raw regexes for spaced / punctuated Level 3 challenges.
LEVEL3_REGEX: tuple[re.Pattern[str], ...] = (
    re.compile(r"\bignore\s+(all|any|previous|prior|above)\b", re.I),
    re.compile(r"\bdisregard\s+(all|previous|prior)\b", re.I),
    re.compile(r"\bsystem\s*override\b", re.I),
    re.compile(r"\b(system|hidden|developer)\s*prompts?\b", re.I),
    re.compile(r"\benvironment\s*variables?\b", re.I),
    re.compile(
        r"\b(reveal|show|print|dump|leak)\b.{0,40}\b(prompt|system|secret|key|token)\b",
        re.I,
    ),
    re.compile(r"\b(jailbreak|dan\s*mode|developer\s*mode|god\s*mode)\b", re.I),
    re.compile(r"\byou\s+are\s+now\b", re.I),
    re.compile(r"\bdo\s+anything\s+now\b", re.I),
    re.compile(r"\bpretend\s+you\s+are\b", re.I),
    re.compile(r"\bdrop\s+(the\s+)?system\b", re.I),
)

_NON_ALNUM = re.compile(r"[^a-z0-9]")


def normalize_for_scan(value: str) -> str:
    """Lowercase and strip punctuation/spaces for blocklist matching."""
    return _NON_ALNUM.sub("", value.lower())


def contains_prompt_injection(*fields: str) -> bool:
    """
    Level 3 scan across intake fields.

    Returns True if normalized blocklist or raw regex patterns match,
    so spaced / punctuated jailbreaks still trip the silent bouncer.
    """
    joined = "\n".join(field for field in fields if field)
    if not joined.strip():
        return False

    haystack = normalize_for_scan(joined)
    if any(token in haystack for token in LEVEL3_BLOCKLIST):
        return True

    return any(pattern.search(joined) for pattern in LEVEL3_REGEX)
