"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  clearGuardrailCooldown,
  formatCooldownClock,
  getCooldownRemainingMs,
  verifyOverridePin,
} from "@/lib/promptGuard";

type GuardrailCooldownModalProps = {
  open: boolean;
  onClose: () => void;
  onUnlocked: () => void;
};

export default function GuardrailCooldownModal({
  open,
  onClose,
  onUnlocked,
}: GuardrailCooldownModalProps) {
  const [remainingMs, setRemainingMs] = useState(0);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const tick = () => {
      const remaining = getCooldownRemainingMs();
      setRemainingMs(remaining);
      if (remaining <= 0) {
        clearGuardrailCooldown();
        onUnlocked();
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [open, onUnlocked]);

  if (!open) return null;

  const handleOverride = (event: FormEvent) => {
    event.preventDefault();
    if (!verifyOverridePin(pin)) {
      setPinError("Invalid architect PIN.");
      return;
    }
    clearGuardrailCooldown();
    setPin("");
    setPinError(null);
    onUnlocked();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guardrail-cooldown-title"
    >
      <div className="w-full max-w-md rounded-xl border border-red-500/40 bg-white p-6 shadow-2xl">
        <p className="mb-2 text-xs font-semibold tracking-widest text-red-600 uppercase">
          Rate Limit · API Credit Protection
        </p>
        <h2
          id="guardrail-cooldown-title"
          className="mb-3 text-xl font-bold text-slate-900"
        >
          Live Demo Cooldown Active
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-slate-600">
          The outreach engine may be run once per session. To prevent API-credit
          abuse, the next generation is locked for{" "}
          <span className="font-semibold text-slate-900">20 minutes</span>.
        </p>

        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center">
          <p className="text-[11px] font-semibold tracking-wide text-red-700 uppercase">
            Time remaining
          </p>
          <p className="mt-1 font-mono text-3xl font-bold text-red-800">
            {formatCooldownClock(remainingMs)}
          </p>
        </div>

        <form onSubmit={handleOverride} className="space-y-3 border-t border-slate-200 pt-5">
          <p className="text-sm font-semibold text-slate-900">
            Admin Override
          </p>
          <p className="text-xs text-slate-500">
            Enter the 4-digit PIN to unlock the engine immediately.
          </p>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
              setPinError(null);
            }}
            placeholder="••••"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-center font-mono text-lg tracking-[0.4em] text-slate-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
            aria-label="Architect override PIN"
          />
          {pinError ? (
            <p className="text-xs text-red-600" role="alert">
              {pinError}
            </p>
          ) : null}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Dismiss
            </button>
            <button
              type="submit"
              className="flex-1 rounded-md bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600"
            >
              Unlock with PIN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
