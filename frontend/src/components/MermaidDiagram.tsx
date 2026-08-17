"use client";

import { useEffect, useId, useState } from "react";

let mermaidReady: Promise<typeof import("mermaid")> | null = null;

function loadMermaid() {
  if (!mermaidReady) {
    mermaidReady = import("mermaid").then((mod) => {
      mod.default.initialize({
        startOnLoad: false,
        theme: "dark",
        securityLevel: "loose",
        fontFamily: "inherit",
        themeVariables: {
          darkMode: true,
          background: "transparent",
          primaryColor: "#0f3433",
          primaryTextColor: "#ffffff",
          primaryBorderColor: "#10b981",
          secondaryColor: "#064e3b",
          tertiaryColor: "#011D1C",
          lineColor: "#34d399",
          textColor: "#e2e8f0",
          mainBkg: "#0f3433",
          nodeBorder: "#10b981",
          clusterBkg: "#011D1C",
          clusterBorder: "#334155",
          titleColor: "#e2e8f0",
          actorBkg: "#0f3433",
          actorBorder: "#10b981",
          actorTextColor: "#ffffff",
          signalColor: "#34d399",
          signalTextColor: "#e2e8f0",
          labelBoxBkgColor: "#0f3433",
          labelBoxBorderColor: "#10b981",
          labelTextColor: "#e2e8f0",
          noteBkgColor: "#064e3b",
          noteTextColor: "#ffffff",
          noteBorderColor: "#10b981",
          sequenceNumberColor: "#011D1C",
        },
      });
      return mod;
    });
  }
  return mermaidReady;
}

export default function MermaidDiagram({ chart }: { chart: string }) {
  const reactId = useId().replace(/:/g, "");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderChart() {
      try {
        setError(null);
        setSvg("");
        const mod = await loadMermaid();
        const { svg: rendered } = await mod.default.render(
          `mermaid-${reactId}-${Date.now()}`,
          chart,
        );
        if (!cancelled) setSvg(rendered);
      } catch (err) {
        if (!cancelled) {
          setSvg("");
          setError(
            err instanceof Error ? err.message : "Failed to render diagram",
          );
        }
      }
    }

    void renderChart();
    return () => {
      cancelled = true;
    };
  }, [chart, reactId]);

  if (error) {
    return (
      <p className="text-center text-sm text-red-400" role="alert">
        {error}
      </p>
    );
  }

  if (!svg) {
    return (
      <p className="text-center text-sm text-slate-500" aria-live="polite">
        Rendering diagram…
      </p>
    );
  }

  return (
    <div
      className="w-full overflow-x-auto [&_svg]:mx-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
