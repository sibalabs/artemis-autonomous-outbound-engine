import type { Metadata } from "next";
import Link from "next/link";
import ArchitectureDiagrams from "@/components/ArchitectureDiagrams";

export const metadata: Metadata = {
  title: "Architecture — Artemis",
  description:
    "System architecture diagrams for the Artemis autonomous outbound engine.",
};

export default function ArchitecturePage() {
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
              <Link
                href="/use-case"
                className="text-sm text-slate-300 transition-colors hover:text-white"
              >
                Use Case
              </Link>
              <span className="text-sm font-medium text-white">Architecture</span>
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

      <main className="px-4 pt-24 pb-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-2xl">
            <p className="mb-4 text-sm tracking-widest text-emerald-400 uppercase">
              System Design
            </p>
            <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Artemis Architecture
            </h1>
            <p className="text-lg text-slate-300">
              End-to-end flow from target intake through CrewAI orchestration,
              Supabase persistence, and counsel-ready outreach playbook output.
            </p>
          </div>

          <ArchitectureDiagrams />

          <div className="mt-8">
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
