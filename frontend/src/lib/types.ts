/** Agent pipeline status — mirrors future CrewAI/Supabase agent run state. */
export type AgentStatus = "STANDBY" | "ACTIVE" | "COMPLETE";

export type AgentId = "leadIntelligence" | "salesStrategist" | "conversionWriter";

export type AgentStateMap = Record<AgentId, AgentStatus>;

/** Demo output panel phases. */
export type DemoPhase = "idle" | "terminal" | "document" | "blocked";

/** API / mock response when the silent bouncer drops a malicious payload. */
export interface BlockedThreatResponse {
  status: "blocked";
  threat_type: "prompt_injection_attempt";
}

export interface IntakeFormData {
  companyUrl: string;
  executiveRole: string;
  valueProposition: string;
}

export interface TerminalLine {
  id: string;
  text: string;
}

export interface OutreachPlaybook {
  subjectLine: string;
  emailOneBody: string;
  linkedInNote: string;
  emailTwoBody: string;
  companyName: string;
  executiveRole: string;
  valueProposition: string;
}

export interface RunOutreachEngineParams {
  form: IntakeFormData;
  onPhaseChange: (phase: DemoPhase) => void;
  onTerminalLine: (line: string) => void;
  onAgentStatusChange: (agents: AgentStateMap) => void;
  onPlaybookReady: (playbook: OutreachPlaybook) => void;
}

export const INITIAL_AGENT_STATE: AgentStateMap = {
  leadIntelligence: "STANDBY",
  salesStrategist: "STANDBY",
  conversionWriter: "STANDBY",
};
