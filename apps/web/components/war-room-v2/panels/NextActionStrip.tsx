import React from "react";
import type { TriageEvaluationSnapshot } from "../types";

export function NextActionStrip({
  triage,
  onOpen,
  onApplyAction
}: {
  triage: TriageEvaluationSnapshot | null;
  onOpen: (mode: string, targetId: string) => void;
  onApplyAction?: (suggestionId: string) => Promise<void> | void;
}) {
  if (!triage) return null;
  return (
    <section className="glass p-3 rounded-xl border border-white/10 mb-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">Next Actions</div>
          <div className="text-xs text-zinc-300">Top triage: {triage.nextAction}</div>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">r{triage.readinessScore}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {triage.suggestions.slice(0, 3).map((item) => (
          <div key={item.id} className="rounded border border-white/10 bg-zinc-950/55 px-2 py-2 text-xs">
            <div className="font-semibold text-zinc-100">{item.title}</div>
            <div className="text-zinc-400 mt-1 line-clamp-2">{item.reason}</div>
            <div className="mt-2 flex items-center gap-2">
              {item.actionKind && onApplyAction ? (
                <button
                  onClick={() => onApplyAction(item.id)}
                  className="rounded border border-emerald-500/35 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-200"
                >
                  Fix
                </button>
              ) : null}
              <button
                onClick={() => onOpen(item.mode, item.targetId)}
                className="rounded border border-blue-500/35 bg-blue-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-blue-200"
              >
                Open
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

