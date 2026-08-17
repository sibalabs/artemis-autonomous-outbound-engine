import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Use Case — Artemis Outbound Sales Engine",
  description:
    "Market intelligence pipeline generating targeted accounts, sales strategy, and 3-touch outreach playbooks.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

const TECH_STACK = [
  "Multi-Agent Orchestration",
  "Web Scraping",
  "LLM Playbook Generation",
  "Next.js",
] as const;

export default function UseCasePage() {
  return (
    <div className="min-h-screen bg-[#011D1C] text-slate-100">
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#011D1C]">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
          <Link
            href="/"
            className="text-sm font-bold tracking-tight text-white sm:text-base"
          >
            Artemis
          </Link>

          <div className="flex items-center gap-6">
            <div className="hidden items-center gap-6 md:flex">
              <span className="text-sm font-medium text-white">Use Case</span>
              <Link
                href="/architecture"
                className="text-sm text-slate-300 transition-colors hover:text-white"
              >
                Architecture
              </Link>
              <Link
                href="/#platform"
                className="text-sm text-slate-300 transition-colors hover:text-white"
              >
                Live Demo
              </Link>
            </div>
            <Link
              href="https://www.upwork.com/freelancers/~01c74e810b92cb4ef5"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#011D1C] transition-colors hover:bg-slate-200"
            >
              Hire the AI Architect
            </Link>
          </div>
        </div>
      </nav>

      <main className="px-4 pt-24 pb-20">
        <div className="mx-auto max-w-3xl">
          <header className="mb-16">
            <p className="mb-4 text-sm tracking-widest text-emerald-400 uppercase">
              Use Case
            </p>
            <h1 className="mb-4 text-3xl font-bold text-white md:text-5xl">
              Artemis — Outbound Sales Engine
            </h1>
            <p className="text-lg text-slate-300 md:text-xl">
              Market intelligence pipeline generating targeted accounts, sales
              strategy, and 3-touch outreach playbooks.
            </p>
          </header>

          <section className="mb-14 border-t border-white/10 pt-10">
            <h2 className="mb-4 text-xl font-semibold text-white md:text-2xl">
              The Business Problem
            </h2>
            <p className="text-base leading-relaxed text-slate-300 md:text-lg">
              B2B sales teams burn valuable revenue-generating time manually
              scraping leads and sending generic cold emails. This
              &apos;spray and pray&apos; approach results in domain burn,
              flagged spam, high customer acquisition costs (CAC), and zero
              account-based personalization.
            </p>
          </section>

          <section className="mb-14 border-t border-white/10 pt-10">
            <h2 className="mb-4 text-xl font-semibold text-white md:text-2xl">
              Measurable ROI &amp; Impact
            </h2>
            <p className="text-base leading-relaxed text-slate-300 md:text-lg">
              Generates highly targeted, hyper-personalized accounts daily.
              Shifts outbound strategy from generic spam to deep market
              intelligence, significantly increasing open rates and saving sales
              teams 20+ hours a week in manual prospecting.
            </p>
          </section>

          <section className="mb-14 border-t border-white/10 pt-10">
            <h2 className="mb-4 text-xl font-semibold text-white md:text-2xl">
              Technical Execution Summary
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {TECH_STACK.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0f3433] px-4 py-3 text-sm font-medium text-slate-200"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-14 border-t border-white/10 pt-10">
            <h2 className="mb-4 text-xl font-semibold text-white md:text-2xl">
              Team Enablement &amp; Mentorship
            </h2>
            <p className="text-base leading-relaxed text-slate-300 md:text-lg">
              As a Lead AI Architect, my engagement does not end at deployment. I
              actively mentor internal engineering teams on Zero-Trust AI
              perimeters, multi-agent orchestration, and prompt
              security—ensuring your developers can securely scale the
              architecture long after the initial build.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#023433] px-6 py-8 sm:px-8">
            <p className="mb-4 text-sm font-semibold tracking-wide text-emerald-400 uppercase">
              Ready to Build
            </p>
            <p className="mb-6 text-base text-slate-300">
              See the live engine in action, or reach out to discuss deploying a
              similar outbound intelligence system for your team.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/#platform"
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-bold text-[#011D1C] transition-colors hover:bg-slate-200"
              >
                View Live Demo
              </Link>
              <Link
                href="https://www.upwork.com/freelancers/~01c74e810b92cb4ef5"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-6 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
              >
                Hire the AI Architect
              </Link>
            </div>
          </section>

          <div className="mt-10">
            <Link
              href="/"
              className="text-sm text-slate-300 transition-colors hover:text-white"
            >
              ← Back to Artemis
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
