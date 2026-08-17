"""Supabase client and persistence helpers for Artemis."""

from __future__ import annotations

import logging
import os
from typing import Any

from supabase import Client, create_client

logger = logging.getLogger(__name__)

_supabase_client: Client | None = None


def get_supabase_client() -> Client | None:
    """
    Initialize (once) and return the Supabase client.

    Returns None when credentials are missing so local demos can still run
    without a configured database.
    """
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        logger.warning(
            "SUPABASE_URL / SUPABASE_KEY not set; playbook logging disabled.",
        )
        return None

    _supabase_client = create_client(supabase_url, supabase_key)
    return _supabase_client


def log_playbook_generation(
    target_company_url: str,
    target_role: str,
    value_proposition: str,
    generated_playbook: dict[str, Any],
) -> bool:
    """
    Insert a generated playbook into the `artemis_logs` table.

    Column names match supabase/migrations/20260725000000_create_artemis_schema.sql.

    Returns True on success, False if the database is unreachable or
    misconfigured. Never raises to the caller.
    """
    client = get_supabase_client()
    if client is None:
        return False

    try:
        client.table("artemis_logs").insert(
            {
                "target_company_url": target_company_url,
                "target_role": target_role,
                "value_proposition": value_proposition,
                "generated_playbook": generated_playbook,
            },
        ).execute()
        return True
    except Exception:
        logger.exception(
            "Failed to log playbook generation for target_company_url=%s "
            "target_role=%s",
            target_company_url,
            target_role,
        )
        return False
