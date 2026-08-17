"use client";

import { FormEvent, useCallback, useEffect, useId, useState } from "react";
import GuardrailCooldownModal from "@/components/GuardrailCooldownModal";
import { runOutreachEngine } from "@/lib/outreachEngine";
import {
  GUARDRAIL_TEST_PAYLOAD,
  isCooldownActive,
  startGuardrailCooldown,
} from "@/lib/promptGuard";
import {
  INITIAL_AGENT_STATE,
  type AgentId,
  type AgentStateMap,
  type AgentStatus,
  type DemoPhase,
  type IntakeFormData,
  type OutreachPlaybook,
  type TerminalLine,
} from "@/lib/types";

type OutputTab = "email1" | "linkedin" | "email2" | "strategy";

const PIPELINE_STEPS: {
  id: AgentId;
  step: string;
  title: string;
  description: string;
}[] = [
  {
    id: "leadIntelligence",
    step: "01",
    title: "Lead Intelligence",
    description: "Deep-web discovery of target news",
  },
  {
    id: "salesStrategist",
    step: "02",
    title: "Sales Strategist",
    description: "Strategic analysis of pain points",
  },
  {
    id: "conversionWriter",
    step: "03",
    title: "Conversion Writer",
    description: "Drafting sequence copy",
  },
];

const TABS: { id: OutputTab; label: string }[] = [
  { id: "email1", label: "Email #1 (Initial)" },
  { id: "linkedin", label: "LinkedIn Note" },
  { id: "email2", label: "Email #2 (Follow-up)" },
  { id: "strategy", label: "Strategy Specs" },
];

const NAV_LINKS = [
  { href: "/use-case", label: "Use Case" },
  { href: "/architecture", label: "Architecture" },
  { href: "#platform", label: "Live Demo" },
] as const;

/** Live Upwork profile URL. */
const UPWORK_PROFILE_URL =
  "https://www.upwork.com/freelancers/~01c74e810b92cb4ef5";

const TYPICAL_DELIVERABLES = [
  "CrewAI multi-agent orchestration on FastAPI",
  "Next.js studio UI with live agent pipeline visibility",
  "Supabase-backed playbook logging with vector-ready schema",
  "Counsel-ready 3-touch outreach playbooks (Email → LinkedIn → Follow-up)",
] as const;

const FEATURES = [
  {
    title: "Discover Precision Targets",
    text: "Leverage deep-market intelligence to build your perfect B2B client list.",
    icon: "globe" as const,
  },
  {
    title: "Intelligent Opportunity Analysis",
    text: "Our AI brain analyzes target prospects for quality and suitability, identifying potential red flags.",
    icon: "brain" as const,
  },
  {
    title: "High-Conversion Outreach",
    text: "The Creator agent drafts personalized, targeted outreach sequences optimized for maximum open rates.",
    icon: "document" as const,
  },
] as const;

const EMPTY_FORM: IntakeFormData = {
  companyUrl: "",
  executiveRole: "",
  valueProposition: "",
};

const fieldClassName =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none disabled:opacity-60";

function FeatureIcon({ type }: { type: "globe" | "brain" | "document" }) {
  if (type === "globe") {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-emerald-600" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M3.5 12h17M12 3.5c2.5 2.8 3.75 5.5 3.75 8.5S14.5 17.7 12 20.5C9.5 17.7 8.25 15 8.25 12S9.5 6.3 12 3.5Z"
          stroke="currentColor"
          strokeWidth="1.75"
        />
      </svg>
    );
  }

  if (type === "brain") {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-emerald-600" fill="none" aria-hidden>
        <path
          d="M9.5 4.5a3 3 0 0 0-2.8 4.1A3 3 0 0 0 5 11.5c0 1.2.7 2.2 1.7 2.7V16a2.5 2.5 0 0 0 2.5 2.5h1.3M14.5 4.5a3 3 0 0 1 2.8 4.1A3 3 0 0 1 19 11.5c0 1.2-.7 2.2-1.7 2.7V16a2.5 2.5 0 0 1-2.5 2.5h-1.3"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M12 4.5v15M9.5 9h5M9.5 12.5h5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 text-emerald-600" fill="none" aria-hidden>
      <path
        d="M7 3.75h7.5L19 8.25V20.25a.75.75 0 0 1-.75.75H7.75A.75.75 0 0 1 7 20.25V3.75Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 3.75V8.5H19M9 13h6M9 16.5h4.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 18.5 17 20l2.5-3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function StepNode({ status }: { status: AgentStatus }) {
  if (status === "ACTIVE") {
    return (
      <span className="relative flex h-3.5 w-3.5 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
      </span>
    );
  }

  if (status === "COMPLETE") {
    return (
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
        <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" aria-hidden>
          <path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  return (
    <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 bg-slate-200" />
  );
}

function statusLabel(status: AgentStatus): string {
  if (status === "ACTIVE") return "Active";
  if (status === "COMPLETE") return "Complete";
  return "Standby";
}

function CopyButton({ text, disabled }: { text: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  return (
    <button
      type="button"
      disabled={disabled || !text}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {copied ? "Copied" : "Copy to Clipboard"}
    </button>
  );
}

function EmailComposer({
  subject,
  body,
}: {
  subject: string;
  body: string;
}) {
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
          <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            Subject
          </span>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
            {subject}
          </p>
        </div>
        <div className="bg-white px-4 py-4">
          <pre className="font-serif text-sm leading-relaxed whitespace-pre-wrap text-slate-800">
            {body}
          </pre>
        </div>
      </div>
    </div>
  );
}

function PlaybookOutputHub({
  phase,
  isRunning,
  terminalLines,
  playbook,
  activeTab,
  onTabChange,
}: {
  phase: DemoPhase;
  isRunning: boolean;
  terminalLines: TerminalLine[];
  playbook: OutreachPlaybook | null;
  activeTab: OutputTab;
  onTabChange: (tab: OutputTab) => void;
}) {
  const clipboardText = (() => {
    if (!playbook) return "";
    switch (activeTab) {
      case "email1":
        return `Subject: ${playbook.subjectLine}\n\n${playbook.emailOneBody}`;
      case "linkedin":
        return playbook.linkedInNote;
      case "email2":
        return playbook.emailTwoBody;
      case "strategy":
        return [
          `Company: ${playbook.companyName}`,
          `Role: ${playbook.executiveRole}`,
          `Value Proposition: ${playbook.valueProposition}`,
          `Subject: ${playbook.subjectLine}`,
          "",
          "Cadence: 3-Touch Sequence (Email → LinkedIn → Follow-up)",
          "Relevance: High — pain-mapped to recent account signals",
        ].join("\n");
      default:
        return "";
    }
  })();

  return (
    <section
      className={`flex h-full min-h-[420px] flex-col rounded-xl border shadow-sm ${
        phase === "blocked"
          ? "border-red-500 bg-red-50"
          : "border-slate-200 border-l-4 border-l-emerald-500 bg-white"
      }`}
    >
      {phase === "blocked" ? (
        <div className="flex h-full flex-col justify-center rounded-md border border-red-500 bg-red-50 p-6">
          <div className="mb-3 flex items-center gap-3">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 shrink-0 text-red-700"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 3.5 21 19.5H3L12 3.5Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <path
                d="M12 10v4.5M12 17.5h.01"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
            <h2 className="text-base font-bold text-red-800">
              SECURITY PERIMETER DEFENSE ACTIVATED
            <span className="mt-1 block text-[11px] font-semibold tracking-wide text-red-700 uppercase">
              Level 3 Guardrails
            </span>
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-red-800/90">
            Malicious payload detected in target parameters. The request was
            sanitized and dropped at the API Gateway before reaching the Sales
            Strategist agents. No compute credits were consumed.
          </p>
        </div>
      ) : (
        <>
          <header className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Targeted Outreach Playbook
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {playbook
                  ? `${playbook.companyName} · ${playbook.executiveRole}`
                  : "Awaiting pipeline output"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                3-Touch Cadence
              </span>
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                High Relevance
              </span>
            </div>
          </header>

          {phase === "idle" && (
            <div className="flex flex-1 items-center justify-center px-6 py-12">
              <p className="max-w-sm text-center text-sm text-balance text-slate-500">
                Configure a target and run the engine. The playbook tabs will
                populate with counsel-ready copy when the pipeline completes.
              </p>
            </div>
          )}

          {phase === "terminal" && (
            <div
              className="m-4 flex-1 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-sm text-emerald-400"
              role="log"
              aria-live="polite"
              aria-label="Engine terminal output"
            >
              <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                artemis — orchestrator
              </div>
              <ul className="space-y-2">
                {terminalLines.map((line) => (
                  <li key={line.id} className="leading-relaxed">
                    <span className="text-emerald-700 select-none">$ </span>
                    {line.text}
                  </li>
                ))}
                {isRunning ? (
                  <li className="text-emerald-500/70" aria-hidden="true">
                    ▍
                  </li>
                ) : null}
              </ul>
            </div>
          )}

          {phase === "document" && playbook ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 pt-2 sm:px-4">
                <div
                  className="flex min-w-0 flex-1 gap-1 overflow-x-auto pb-2"
                  role="tablist"
                  aria-label="Playbook sections"
                >
                  {TABS.map((tab) => {
                    const selected = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => onTabChange(tab.id)}
                        className={`shrink-0 rounded-md px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                          selected
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                <div className="shrink-0 pb-2 pr-1">
                  <CopyButton text={clipboardText} />
                </div>
              </div>

          <div className="flex-1 px-5 py-5" role="tabpanel">
            {activeTab === "email1" ? (
              <EmailComposer
                subject={playbook.subjectLine}
                body={playbook.emailOneBody}
              />
            ) : null}

            {activeTab === "linkedin" ? (
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="mb-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  Connection note
                </p>
                <p className="font-serif text-sm leading-relaxed text-slate-800">
                  {playbook.linkedInNote}
                </p>
              </div>
            ) : null}

            {activeTab === "email2" ? (
              <EmailComposer
                subject={`Re: ${playbook.subjectLine.replace(/^Re:\s*/i, "")}`}
                body={playbook.emailTwoBody}
              />
            ) : null}

            {activeTab === "strategy" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                      Account
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {playbook.companyName}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                      Buyer
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {playbook.executiveRole}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                    Value proposition mapping
                  </p>
                  <p className="mt-2 font-serif text-sm leading-relaxed text-slate-800">
                    {playbook.valueProposition} is positioned against the
                    account&apos;s most urgent operational gap, then expressed
                    across a three-touch cadence designed for low-friction
                    executive reply.
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    Touch 1 — pain-led email with a concrete observation
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    Touch 2 — short LinkedIn note to reinforce timing
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    Touch 3 — follow-up that advances with a one-pager offer
                  </li>
                </ul>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
        </>
      )}
    </section>
  );
}

export default function Artemis() {
  const formId = useId();
  const [form, setForm] = useState<IntakeFormData>(EMPTY_FORM);
  const [submittedPreview, setSubmittedPreview] =
    useState<IntakeFormData | null>(null);
  const [agents, setAgents] = useState<AgentStateMap>(INITIAL_AGENT_STATE);
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [playbook, setPlaybook] = useState<OutreachPlaybook | null>(null);
  const [activeTab, setActiveTab] = useState<OutputTab>("email1");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownLocked, setCooldownLocked] = useState(false);
  const [cooldownModalOpen, setCooldownModalOpen] = useState(false);

  useEffect(() => {
    setCooldownLocked(isCooldownActive());
  }, []);

  const handleCooldownUnlocked = useCallback(() => {
    setCooldownLocked(false);
    setCooldownModalOpen(false);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);

      if (isCooldownActive()) {
        setCooldownLocked(true);
        setCooldownModalOpen(true);
        return;
      }

      if (!form.companyUrl.trim()) {
        setError("Enter a target company URL to run the engine.");
        return;
      }

      setIsRunning(true);
      setPlaybook(null);
      setTerminalLines([]);
      setAgents({ ...INITIAL_AGENT_STATE });
      setPhase("idle");
      setActiveTab("email1");
      setSubmittedPreview({ ...form });

      let engineStarted = false;
      try {
        engineStarted = true;
        await runOutreachEngine({
          form,
          onPhaseChange: (next) => {
            setPhase(next);
            if (next === "blocked") {
              startGuardrailCooldown();
              setCooldownLocked(true);
              setCooldownModalOpen(true);
            }
          },
          onTerminalLine: (text) =>
            setTerminalLines((prev) => [
              ...prev,
              { id: `${Date.now()}-${prev.length}`, text },
            ]),
          onAgentStatusChange: (next) => setAgents(next),
          onPlaybookReady: (doc) => setPlaybook(doc),
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "The outreach engine failed to complete. Please try again.";
        setError(message);
        setPhase("idle");
        setAgents({ ...INITIAL_AGENT_STATE });
      } finally {
        if (engineStarted && !isCooldownActive()) {
          startGuardrailCooldown();
          setCooldownLocked(true);
        }
        setIsRunning(false);
      }
    },
    [form],
  );

  const scrollToHire = () => {
    document
      .getElementById("hire")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#011D1C] text-slate-100">
      <GuardrailCooldownModal
        open={cooldownModalOpen}
        onClose={() => setCooldownModalOpen(false)}
        onUnlocked={handleCooldownUnlocked}
      />

      {/* Global Nav — transparent over deep teal */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#011D1C]">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
          <a
            href="/"
            className="text-sm font-bold tracking-tight text-white sm:text-base"
          >
            Artemis
          </a>

          <div className="flex items-center gap-6">
            <div className="hidden items-center gap-6 md:flex">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-slate-300 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <a
              href={UPWORK_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#011D1C] transition-colors hover:bg-slate-200"
            >
              Hire the AI Architect
            </a>
          </div>
        </div>
      </nav>

      {/* Split Hero — left copy / right 3D visual */}
      <header className="bg-[#011D1C]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pt-24 pb-16 lg:grid-cols-2">
          <div className="text-left">
            <p className="mb-4 text-sm tracking-widest text-emerald-400 uppercase">
              AUTONOMOUS OUTBOUND ENGINE
            </p>
            <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl">
              Autonomous Pipeline Generation for B2B Sales Teams.
            </h1>
            <p className="mb-8 max-w-lg text-lg text-slate-300">
              Revolutionize your B2B sales development with intelligent,
              integrated workflows for precise targeting and high-conversion.
            </p>
            <div className="flex flex-row items-center gap-4">
              <button
                type="button"
                onClick={scrollToHire}
                className="rounded-lg bg-white px-8 py-3 text-lg font-bold text-[#011D1C] transition-colors hover:bg-slate-200"
              >
                Ready to Build
              </button>
              <a
                href="/architecture"
                className="rounded-lg border border-slate-700 px-6 py-3 font-medium text-slate-300 transition-colors hover:bg-slate-800"
              >
                View System Architecture
              </a>
            </div>
          </div>

          <div className="flex w-full -translate-y-10 justify-center lg:justify-end lg:-translate-y-16">
            <img
              src="/images/artemis-3d-console.png"
              alt="Artemis 3D console graphic showing the autonomous outbound engine"
              className="w-full max-w-2xl object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </header>

      {/* Features — crisp white */}
      <section
        id="features"
        className="bg-white py-24 text-slate-900"
        aria-label="Platform features"
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Built for Precision Outbound
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Three specialist agents work in sequence to discover targets,
              analyze opportunity quality, and draft high-conversion outreach.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
              >
                <div className="mb-4">
                  <FeatureIcon type={feature.icon} />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-base leading-relaxed text-slate-600">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Workspace Injection — light mode */}
      <section
        id="platform"
        className="scroll-mt-20 bg-white px-4 pb-24 text-slate-900 md:px-8"
        aria-label="Live interactive demo"
      >
        <div className="mx-auto w-full max-w-7xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
            Experience the Engine: Live Interactive Demo
          </h2>

          <div
            id="studio-workspace"
            className="scroll-mt-20 grid grid-cols-1 gap-6 lg:grid-cols-12"
            aria-label="Artemis studio workspace"
          >
            {/* Column 1 — Target Setup */}
            <form
              onSubmit={handleSubmit}
              className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3"
              noValidate
            >
              <h3 className="text-sm font-semibold tracking-tight text-slate-900">
                Target Parameters
              </h3>

              <div className="mt-4 flex-1 space-y-4">
                <div>
                  <label
                    htmlFor={`${formId}-url`}
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Target Company URL
                  </label>
                  <input
                    id={`${formId}-url`}
                    type="text"
                    value={form.companyUrl}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        companyUrl: e.target.value,
                      }))
                    }
                    placeholder="e.g., acmecorp.com"
                    disabled={isRunning}
                    className={fieldClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`${formId}-role`}
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Executive Role
                  </label>
                  <input
                    id={`${formId}-role`}
                    type="text"
                    value={form.executiveRole}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        executiveRole: e.target.value,
                      }))
                    }
                    placeholder="e.g., Chief Technology Officer"
                    disabled={isRunning}
                    className={fieldClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`${formId}-value`}
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Value Proposition
                  </label>
                  <textarea
                    id={`${formId}-value`}
                    value={form.valueProposition}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        valueProposition: e.target.value,
                      }))
                    }
                    placeholder="e.g., Automated Security Audits"
                    rows={4}
                    disabled={isRunning}
                    className={`${fieldClassName} resize-y`}
                  />
                </div>
              </div>

              {error ? (
                <p className="mt-3 text-xs text-red-600" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isRunning || cooldownLocked}
                className="mt-5 w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cooldownLocked
                  ? "Engine Locked — Cooldown Active"
                  : isRunning
                    ? "Running Outreach Engine…"
                    : "Run Outreach Engine"}
              </button>

              {cooldownLocked ? (
                <button
                  type="button"
                  onClick={() => setCooldownModalOpen(true)}
                  className="mt-2 w-full text-center text-[11px] font-medium text-red-600 underline-offset-2 hover:underline"
                >
                  View cooldown / enter architect PIN
                </button>
              ) : null}

              <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                Tip:{" "}
                <button
                  type="button"
                  disabled={isRunning || cooldownLocked}
                  onClick={() =>
                    setForm({
                      companyUrl: "acmecorp.com",
                      executiveRole: "Chief Technology Officer",
                      valueProposition: "Automated Security Audits",
                    })
                  }
                  className="font-medium text-emerald-600 underline-offset-2 hover:underline disabled:opacity-60"
                >
                  acmecorp.com
                </button>{" "}
                triggers the seeded demo.
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                Security:{" "}
                <button
                  type="button"
                  disabled={isRunning || cooldownLocked}
                  onClick={() => {
                    if (isCooldownActive()) {
                      setCooldownLocked(true);
                      setCooldownModalOpen(true);
                      return;
                    }
                    setForm((prev) => ({
                      ...prev,
                      companyUrl: prev.companyUrl.trim() || "acmecorp.com",
                      executiveRole:
                        prev.executiveRole.trim() || "Chief Technology Officer",
                      valueProposition: GUARDRAIL_TEST_PAYLOAD,
                    }));
                  }}
                  className="font-medium text-red-600/80 underline-offset-2 hover:text-red-700 hover:underline disabled:opacity-60"
                >
                  [Test API Guardrail]
                </button>
              </p>

              {submittedPreview ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="mb-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                    Target preview
                  </p>
                  <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span className="truncate font-medium text-slate-900">
                      {submittedPreview.companyUrl || "—"}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="truncate text-slate-500">
                      {submittedPreview.executiveRole || "Role TBD"}
                    </span>
                  </div>
                </div>
              ) : null}
            </form>

            {/* Column 2 — Vertical Pipeline */}
            <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
              <h3 className="text-sm font-semibold tracking-tight text-slate-900">
                Agent Pipeline
              </h3>

              <ol className="mt-6 space-y-0">
                {PIPELINE_STEPS.map((step, index) => {
                  const status = agents[step.id];
                  const isLast = index === PIPELINE_STEPS.length - 1;

                  return (
                    <li
                      key={step.id}
                      className="relative flex gap-3 pb-8 last:pb-0"
                    >
                      {!isLast ? (
                        <span
                          className="absolute top-4 bottom-0 left-[6px] border-l-2 border-slate-200"
                          aria-hidden
                        />
                      ) : null}

                      <div className="relative z-10 mt-0.5 flex shrink-0 justify-center">
                        <StepNode status={status} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            <span className="mr-1.5 text-slate-400">
                              {step.step}
                            </span>
                            {step.title}
                          </p>
                          <span
                            className={`text-[10px] font-semibold tracking-wide uppercase ${
                              status === "ACTIVE"
                                ? "text-emerald-600"
                                : status === "COMPLETE"
                                  ? "text-emerald-600"
                                  : "text-slate-400"
                            }`}
                          >
                            {statusLabel(status)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-balance text-slate-600">
                          {step.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </aside>

            {/* Column 3 — Playbook Output */}
            <div className="lg:col-span-6">
              <PlaybookOutputHub
                phase={phase}
                isRunning={isRunning}
                terminalLines={terminalLines}
                playbook={playbook}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Hire CTA */}
      <section
        id="hire"
        className="scroll-mt-20 border-t border-white/10 bg-[#011D1C] px-4 py-24"
        aria-label="Hire the AI Architect"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm tracking-widest text-emerald-400 uppercase">
            Ready to Build
          </p>
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            Hire the AI Architect Behind Artemis
          </h2>
          <p className="mb-10 text-lg text-slate-300">
            Looking to ship a multi-agent system, outbound engine, or custom AI
            workflow for your team? Reach out on Upwork to hire me or message
            me to discuss your project.
          </p>

          <div className="mb-10 rounded-xl border border-white/10 bg-[#023433] px-6 py-8 text-left sm:px-8">
            <p className="mb-4 text-sm font-semibold tracking-wide text-emerald-400 uppercase">
              What Artemis delivers
            </p>
            <ul className="space-y-3">
              {TYPICAL_DELIVERABLES.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-base text-slate-300"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={UPWORK_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-lg font-bold text-[#011D1C] transition-colors hover:bg-slate-200"
            >
              Hire Me on Upwork
            </a>
            <a
              href="/use-case"
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-8 py-3 text-lg font-medium text-slate-300 transition-colors hover:bg-slate-800"
            >
              Use Case
            </a>
          </div>
        </div>
      </section>

      {/* Footer — deep teal */}
      <footer className="border-t border-slate-800 bg-[#011D1C] py-16 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-slate-300">
            Artemis Autonomous Outbound Engine. Architected for Enterprise
            Scale. © 2026 SIBA Labs, LLC
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-xs leading-relaxed text-slate-500">
            DISCLAIMER: This application is a live technical demonstration of
            multi-agent AI orchestration. It actively utilizes the CrewAI
            framework for real-time market intelligence and sales pipeline
            generation. This is a portfolio asset, not a commercial product. All
            generated target analyses, opportunity scoring, and outreach drafts
            are strictly for demonstrative purposes and do not constitute formal
            business advisory or commercial leads.
          </p>
        </div>
      </footer>
    </div>
  );
}
