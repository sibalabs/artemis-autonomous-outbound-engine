"""FastAPI entry point for the Artemis outbound engine API."""

from __future__ import annotations

import logging
from typing import Any

from dotenv import load_dotenv

# Load env before CrewAI/agent imports so ANTHROPIC_API_KEY is available.
load_dotenv()

from fastapi import FastAPI, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from crew import run_artemis_crew
from database import log_playbook_generation
from prompts import PromptConfigError
from security import contains_prompt_injection


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Artemis API",
    description="Multi-agent B2B sales automation engine",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PlaybookRequest(BaseModel):
    """Intake payload from the Artemis frontend."""

    target_url: str = Field(
        ...,
        min_length=1,
        description="Target company website URL or domain.",
        examples=["acmecorp.com"],
    )
    target_role: str = Field(
        ...,
        min_length=1,
        description="Executive role to personalize against.",
        examples=["Chief Technology Officer"],
    )
    value_proposition: str = Field(
        ...,
        min_length=1,
        description="Seller value proposition to map to the pain point.",
        examples=["Automated Security Audits"],
    )


class PlaybookResponse(BaseModel):
    """Counsel-ready outreach playbook returned to the client."""

    subject_line: str
    email_one: str
    linkedin_dm: str
    email_two: str


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "artemis"}


@app.post(
    "/api/v1/generate-playbook",
    status_code=status.HTTP_200_OK,
)
async def generate_playbook(
    payload: PlaybookRequest,
) -> PlaybookResponse | dict[str, str]:
    """
    Run the sequential CrewAI specialist crew and return a playbook.

    CrewAI execution is sync/blocking, so it runs in a threadpool to keep
    the event loop responsive.

    Malicious intake is dropped at the gateway before CrewAI initializes.
    """
    target_url = payload.target_url.strip()
    target_role = payload.target_role.strip()
    value_proposition = payload.value_proposition.strip()

    # Silent bouncer — abort before any agent / LLM spend.
    if contains_prompt_injection(target_url, target_role, value_proposition):
        logger.warning(
            "Level 3 prompt injection blocked for url=%s role=%s",
            target_url,
            target_role,
        )
        return {
            "status": "blocked",
            "threat_type": "prompt_injection_attempt",
        }

    try:
        playbook: dict[str, Any] = await run_in_threadpool(
            run_artemis_crew,
            target_url,
            target_role,
            value_proposition,
        )
    except PromptConfigError as exc:
        logger.error("CrewAI prompts are not configured: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Artemis CrewAI prompts are not configured on this server.",
        ) from exc
    except ValueError as exc:
        logger.warning("Playbook generation produced invalid output: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("Artemis crew failed for url=%s", target_url)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate outreach playbook.",
        ) from exc

    response = PlaybookResponse.model_validate(playbook)

    log_playbook_generation(
        target_company_url=target_url,
        target_role=target_role,
        value_proposition=value_proposition,
        generated_playbook=response.model_dump(),
    )

    return response
