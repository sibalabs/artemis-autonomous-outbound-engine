import type {
  AgentStateMap,
  IntakeFormData,
  OutreachPlaybook,
  RunOutreachEngineParams,
} from "./types";
import { INITIAL_AGENT_STATE } from "./types";
import { containsPromptInjection } from "./promptGuard";

/**
 * Delay helper — keep async/await so this can later become a real
 * FastAPI/Supabase fetch without changing call sites.
 */
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

/**
 * Seeded playbook for the acmecorp demo path.
 * Swap this builder for a JSON response from FastAPI later.
 */
function buildAcmePlaybook(form: IntakeFormData): OutreachPlaybook {
  const role = form.executiveRole.trim() || "Chief Technology Officer";
  const valueProp =
    form.valueProposition.trim() || "Automated Security Audits";

  return {
    companyName: "Acme Corp",
    executiveRole: role,
    valueProposition: valueProp,
    subjectLine: `Re: Acme's QA capacity gap — ${valueProp} for leaner release cycles`,
    emailOneBody: `Hi {{FirstName}},

I noticed Acme Corp recently reduced QA headcount by roughly 15%. When release velocity stays constant and quality capacity shrinks, regression risk usually shows up first in customer-facing sprints.

We help teams like yours deploy ${valueProp} so engineering leaders protect ship cadence without rebuilding a full QA bench overnight.

Would you be open to a 15-minute conversation next week on how peer CTOs are closing that gap?

Best regards`,
    linkedInNote: `{{FirstName}} — saw the recent QA restructuring at Acme. Curious how you're protecting release quality with a leaner team. We specialize in ${valueProp} for B2B product orgs. Open to connecting?`,
    emailTwoBody: `Hi {{FirstName}},

Following up briefly. After Acme's QA reduction, most ${role}s I speak with are choosing between slower releases and higher defect escape rates.

A short playbook we share with similar teams covers:
1) Where automated coverage recovers the most risk per engineer-hour
2) How ${valueProp} plugs into existing CI without a rip-and-replace
3) A 30-day pilot framing your board can understand

Happy to send the one-pager if useful — no pitch deck required.

Best regards`,
  };
}

/**
 * Mock multi-agent outreach run.
 *
 * Today: setTimeout-driven "seeded reality" for acmecorp URLs.
 * Later: replace the body with `await fetch('/api/outreach', { ... })`
 *        and stream agent status from Supabase Realtime / SSE.
 */
export async function runMockOutreachEngine(
  params: RunOutreachEngineParams,
): Promise<void> {
  const {
    form,
    onPhaseChange,
    onTerminalLine,
    onAgentStatusChange,
    onPlaybookReady,
  } = params;

  // Silent bouncer — same normalized blocklist as FastAPI security.py
  if (
    containsPromptInjection(
      form.companyUrl,
      form.executiveRole,
      form.valueProposition,
    )
  ) {
    onPhaseChange("terminal");
    onTerminalLine("Initializing Artemis AI SDR Orchestrator...");
    await wait(400);
    onTerminalLine("API Gateway: Scanning target parameters...");
    await wait(500);
    onTerminalLine(
      'Level 3 Gateway: BLOCKED — status="blocked" threat_type="prompt_injection_attempt"',
    );
    await wait(300);
    onAgentStatusChange({ ...INITIAL_AGENT_STATE });
    onPhaseChange("blocked");
    return;
  }

  const isAcmeSeed = /acmecorp/i.test(form.companyUrl);
  let agents: AgentStateMap = { ...INITIAL_AGENT_STATE };

  const setAgents = (next: Partial<AgentStateMap>) => {
    agents = { ...agents, ...next };
    onAgentStatusChange(agents);
  };

  onPhaseChange("terminal");
  onTerminalLine("Initializing Artemis AI SDR Orchestrator...");
  setAgents({ leadIntelligence: "ACTIVE" });

  if (!isAcmeSeed) {
    await wait(1200);
    onTerminalLine(
      `Lead Intelligence: Resolving ${form.companyUrl || "target domain"}...`,
    );
    setAgents({ leadIntelligence: "COMPLETE", salesStrategist: "ACTIVE" });

    await wait(1200);
    onTerminalLine(
      "Sales Strategist: Limited public signals found. Building a baseline brief...",
    );
    setAgents({ salesStrategist: "COMPLETE", conversionWriter: "ACTIVE" });

    await wait(1200);
    onTerminalLine("Conversion Writer: Drafting personalized sequence...");
    await wait(800);
    onTerminalLine("Finalizing payload and generating Sales Playbook...");
    await wait(600);

    const companyName = extractCompanyLabel(form.companyUrl);
    const role = form.executiveRole.trim() || "Target Executive";
    const valueProp = form.valueProposition.trim() || "your solution";

    onPlaybookReady({
      companyName,
      executiveRole: role,
      valueProposition: valueProp,
      subjectLine: `Quick idea for ${companyName}'s ${role}`,
      emailOneBody: `Hi {{FirstName}},

I've been researching ${companyName} and how teams in your seat typically evaluate ${valueProp}.

Would you be open to a brief conversation on whether this is a priority this quarter?

Best regards`,
      linkedInNote: `{{FirstName}} — exploring whether ${valueProp} is relevant for ${companyName}. Would value the connection.`,
      emailTwoBody: `Hi {{FirstName}},

Sharing a short follow-up in case the timing is better now. Happy to send a one-page brief on how ${valueProp} maps to ${companyName}'s current priorities.

Best regards`,
    });

    setAgents({ conversionWriter: "COMPLETE" });
    onPhaseChange("document");
    return;
  }

  await wait(1500);
  onTerminalLine(
    "Lead Intelligence: Scraping acmecorp.com for recent press releases...",
  );
  setAgents({ leadIntelligence: "COMPLETE", salesStrategist: "ACTIVE" });

  await wait(1500);
  onTerminalLine(
    "Sales Strategist: Identified core pain point—Acme Corp recently laid off 15% of their QA team.",
  );
  setAgents({ salesStrategist: "COMPLETE", conversionWriter: "ACTIVE" });

  await wait(1500);
  onTerminalLine(
    "Conversion Writer: Cross-referencing value prop. Drafting 3-step sequence...",
  );

  await wait(1000);
  onTerminalLine("Finalizing payload and generating Sales Playbook...");

  await wait(500);
  onPlaybookReady(buildAcmePlaybook(form));
  setAgents({ conversionWriter: "COMPLETE" });
  onPhaseChange("document");
}
