"use client";

import { useState } from "react";
import MermaidDiagram from "@/components/MermaidDiagram";

type DiagramTab = "glance" | "system" | "flow";

const TABS: { id: DiagramTab; label: string }[] = [
  { id: "glance", label: "At a glance" },
  { id: "system", label: "System map" },
  { id: "flow", label: "Audit flow" },
];

const DIAGRAMS: Record<DiagramTab, string> = {
  glance: `
graph LR
    classDef default fill:#0f3433,stroke:#10b981,stroke-width:2px,color:#fff;
    A[1. Define Target Profile] --> B[2. AI Scrapes Deep Web]
    B --> C[3. AI Formulates Strategy]
    C --> D[4. AI Drafts Sequence]
    D --> E[5. Counsel-Ready Playbook]
`,
  system: `
graph TD
    classDef frontend fill:#011D1C,stroke:#34d399,stroke-width:2px,color:#fff;
    classDef backend fill:#0f3433,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef agent fill:#064e3b,stroke:#059669,stroke-width:2px,color:#fff;
    classDef db fill:#022c22,stroke:#047857,stroke-width:2px,color:#fff;

    subgraph Client [Client-Side UI]
        A[Next.js App Router]:::frontend
        B[Interactive Playbook UI]:::frontend
    end
    subgraph Orchestration [Backend Architecture]
        C[FastAPI Endpoint]:::backend
        D[CrewAI Orchestrator]:::backend
    end
    subgraph Agents [Specialist Crew]
        E[Lead Intelligence Scraper]:::agent
        F[Sales Strategist]:::agent
        G[Conversion Writer]:::agent
    end
    subgraph Data [Infrastructure Layer]
        H[(Supabase PostgreSQL)]:::db
        I[(pgvector Embeddings)]:::db
    end

    A <--> B
    B -->|Submit Target| C
    C -->|Trigger Task| D
    D -->|Step 1| E
    E -->|Step 2| F
    F -->|Step 3| G
    G -->|Drafted Copy| D
    D -->|Store Logs| H
    E -.->|Search| I
    C -->|Return JSON| B
`,
  flow: `
sequenceDiagram
    autonumber
    participant U as User (Next.js)
    participant API as FastAPI
    participant C as CrewAI
    participant A1 as Scraper Agent
    participant A2 as Strategist Agent
    participant A3 as Writer Agent
    participant DB as Supabase

    U->>API: POST /api/outbound (Target URL)
    API->>C: Initialize Crew Workflow
    C->>A1: Task: Gather target intelligence
    A1->>DB: Query vector DB for past company data
    A1-->>C: Return structured intelligence
    C->>A2: Task: Develop outreach strategy
    A2-->>C: Return strategic angles & pain points
    C->>A3: Task: Draft 3-touch sequence
    A3-->>C: Return finalized copy
    C->>DB: Persist playbook generation log
    C-->>API: Return final playbook JSON
    API-->>U: Update UI with Outbound Playbook
`,
};

const activeTabClass =
  "bg-[#0f3433] text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-md text-sm font-semibold";
const inactiveTabClass =
  "bg-transparent text-slate-400 border border-slate-700 hover:text-slate-200 px-4 py-2 rounded-md text-sm font-medium transition-colors";

export default function ArchitectureDiagrams() {
  const [activeTab, setActiveTab] = useState<DiagramTab>("glance");

  return (
    <div>
      <div
        className="mb-6 flex flex-wrap gap-3"
        role="tablist"
        aria-label="Architecture diagrams"
      >
        {TABS.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.id)}
              className={selected ? activeTabClass : inactiveTabClass}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        className="flex min-h-[600px] w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 p-8"
      >
        <MermaidDiagram chart={DIAGRAMS[activeTab]} />
      </div>
    </div>
  );
}
