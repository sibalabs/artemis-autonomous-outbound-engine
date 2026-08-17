import type {
  AgentStateMap,
  IntakeFormData,
  OutreachPlaybook,
  RunOutreachEngineParams,
} from "./types";
import { INITIAL_AGENT_STATE } from "./types";
import { containsPromptInjection } from "./promptGuard";
import { runMockOutreachEngine } from "./mockOutreachEngine";

type ApiPlaybookResponse = {
  subject_line: string;
  email_one: string;
  linkedin_dm: string;
  email_two: string;
};

type ApiBlockedResponse = {
  status: "blocked";
  threat_type: "prompt_injection_attempt";
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractCompanyLabel(url: string): string {
  const cleaned = url
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .trim();

  if (/acmecorp/i.test(cleaned)) return "Acme Corp";

  const host = cleaned.split(".")[0] || "Target Company";
  return host
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getApiBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

function shouldUseMockEngine(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_ENGINE === "true";
}

function mapApiPlaybook(
  form: IntakeFormData,
  data: ApiPlaybookResponse,
): OutreachPlaybook {
  return {
    companyName: extractCompanyLabel(form.companyUrl),
    executiveRole: form.executiveRole.trim() || "Target Executive",
    valueProposition: form.valueProposition.trim() || "your solution",
    subjectLine: data.subject_line,
    emailOneBody: data.email_one,
    linkedInNote: data.linkedin_dm,
    emailTwoBody: data.email_two,
  };
}

/**
 * Drive the stepper while CrewAI runs (backend is synchronous / non-streaming).
 */
function startPipelineProgress(
  onTerminalLine: (line: string) => void,
  onAgentStatusChange: (agents: AgentStateMap) => void,
): () => void {
  let agents: AgentStateMap = {
    ...INITIAL_AGENT_STATE,
    leadIntelligence: "ACTIVE",
  };
  onAgentStatusChange(agents);

  const timers: number[] = [];

  timers.push(
    window.setTimeout(() => {
      onTerminalLine(
        "CrewAI · Lead Intelligence: Deep-web discovery in progress...",
      );
    }, 1500),
  );

  timers.push(
    window.setTimeout(() => {
      agents = {
        ...agents,
        leadIntelligence: "COMPLETE",
        salesStrategist: "ACTIVE",
      };
      onAgentStatusChange(agents);
      onTerminalLine(
        "CrewAI · Sales Strategist: Mapping pain points and angles...",
      );
    }, 12000),
  );

  timers.push(
    window.setTimeout(() => {
      agents = {
        ...agents,
        salesStrategist: "COMPLETE",
        conversionWriter: "ACTIVE",
      };
      onAgentStatusChange(agents);
      onTerminalLine(
        "CrewAI · Conversion Writer: Drafting 3-touch outreach sequence...",
      );
    }, 28000),
  );

  timers.push(
    window.setTimeout(() => {
      onTerminalLine(
        "CrewAI: Still generating — waiting on model completion...",
      );
    }, 45000),
  );

  return () => {
    for (const id of timers) window.clearTimeout(id);
  };
}

async function runLiveOutreachEngine(
  params: RunOutreachEngineParams,
  apiBase: string,
): Promise<void> {
  const {
    form,
    onPhaseChange,
    onTerminalLine,
    onAgentStatusChange,
    onPlaybookReady,
  } = params;

  // Client-side Level 3 gate (same patterns as FastAPI) for instant UX.
  if (
    containsPromptInjection(
      form.companyUrl,
      form.executiveRole,
      form.valueProposition,
    )
  ) {
    onPhaseChange("terminal");
    onTerminalLine("Initializing Artemis AI SDR Orchestrator...");
    await wait(300);
    onTerminalLine("API Gateway: Scanning target parameters (Level 3)...");
    await wait(400);
    onTerminalLine(
      'Level 3 Gateway: BLOCKED — status="blocked" threat_type="prompt_injection_attempt"',
    );
    await wait(200);
    onAgentStatusChange({ ...INITIAL_AGENT_STATE });
    onPhaseChange("blocked");
    return;
  }

  const role = form.executiveRole.trim() || "Chief Technology Officer";
  const valueProp =
    form.valueProposition.trim() || "Automated Security Audits";

  onPhaseChange("terminal");
  onTerminalLine("Initializing Artemis AI SDR Orchestrator...");
  onTerminalLine(`API Gateway: POST ${apiBase}/api/v1/generate-playbook`);
  onTerminalLine("Dispatching sequential CrewAI specialist crew...");

  const stopProgress = startPipelineProgress(
    onTerminalLine,
    onAgentStatusChange,
  );

  try {
    const response = await fetch(`${apiBase}/api/v1/generate-playbook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_url: form.companyUrl.trim(),
        target_role: role,
        value_proposition: valueProp,
      }),
    });

    stopProgress();

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new Error(
        `Artemis API returned a non-JSON response (${response.status}).`,
      );
    }

    if (
      data &&
      typeof data === "object" &&
      "status" in data &&
      (data as ApiBlockedResponse).status === "blocked"
    ) {
      onTerminalLine(
        'Level 3 Gateway: BLOCKED — status="blocked" threat_type="prompt_injection_attempt"',
      );
      onAgentStatusChange({ ...INITIAL_AGENT_STATE });
      onPhaseChange("blocked");
      return;
    }

    if (!response.ok) {
      const detail =
        data &&
        typeof data === "object" &&
        "detail" in data &&
        typeof (data as { detail: unknown }).detail === "string"
          ? (data as { detail: string }).detail
          : `HTTP ${response.status}`;
      throw new Error(detail);
    }

    const playbook = data as ApiPlaybookResponse;
    if (
      !playbook?.subject_line ||
      !playbook?.email_one ||
      !playbook?.linkedin_dm ||
      !playbook?.email_two
    ) {
      throw new Error("Artemis API returned an incomplete playbook payload.");
    }

    onTerminalLine("CrewAI: Playbook generation complete. Hydrating UI...");
    onAgentStatusChange({
      leadIntelligence: "COMPLETE",
      salesStrategist: "COMPLETE",
      conversionWriter: "COMPLETE",
    });
    onPlaybookReady(mapApiPlaybook(form, playbook));
    onPhaseChange("document");
  } catch (error) {
    stopProgress();
    onAgentStatusChange({ ...INITIAL_AGENT_STATE });
    onPhaseChange("idle");
    throw error instanceof Error
      ? error
      : new Error("Failed to reach Artemis CrewAI backend.");
  }
}

/**
 * Live demo entrypoint.
 *
 * Prefer FastAPI + CrewAI when NEXT_PUBLIC_API_URL is set.
 * Set NEXT_PUBLIC_USE_MOCK_ENGINE=true to force the local seeded simulator.
 */
export async function runOutreachEngine(
  params: RunOutreachEngineParams,
): Promise<void> {
  if (shouldUseMockEngine()) {
    return runMockOutreachEngine(params);
  }

  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Start the FastAPI backend and point the frontend at it (e.g. http://localhost:8000).",
    );
  }

  return runLiveOutreachEngine(params, apiBase);
}
