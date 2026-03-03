import React from "react";
import type { AppData } from "../types";
import { computeBarbellGuardrail } from "../../../lib/war-room/operational-metrics";

function statusCopy(status: "hedge-heavy" | "fragile-middle" | "edge-heavy"): string {
  if (status === "hedge-heavy") return "Hedge dominant. Maintain optionality pipeline.";
  if (status === "edge-heavy") return "Edge dominant. Verify no-ruin hedge coverage.";
  return "Fragile middle detected. Rebalance to clear barbell poles.";
}

function statusBadgeClass(fragileMiddle: boolean): string {
  if (fragileMiddle) return "rounded-full border border-red-400/40 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-red-300";
  return "rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-emerald-300";
}

export function BarbellGuardrailPanel({ data }: { data: AppData }) {
  const guardrail = React.useMemo(() => computeBarbellGuardrail(data), [data]);

  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Barbell Guardrail</div>
      <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-100 mb-3">Hedge vs Edge</h3>

      <div className="rounded-lg border border-white/10 bg-zinc-950/60 p-3">
        <div className="h-3 rounded-full overflow-hidden flex border border-white/10">
          <div
            className="bg-emerald-500/70 h-full"
            style={{ width: `${guardrail.hedgePct}%` }}
            title={`Hedge ${guardrail.hedgePct}%`}
          />
          <div
            className="bg-cyan-400/70 h-full"
            style={{ width: `${guardrail.edgePct}%` }}
            title={`Edge ${guardrail.edgePct}%`}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-300">
          <span>Hedge {guardrail.hedgePct}%</span>
          <span>Edge {guardrail.edgePct}%</span>
        </div>
        <div className="mt-1 text-[11px] text-zinc-500">
          active obligations {guardrail.activeObligationCount} | active options {guardrail.activeOptionCount}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={statusBadgeClass(guardrail.fragileMiddle)}>
          {guardrail.fragileMiddle ? "Fragile middle" : "Barbell polarized"}
        </span>
        <span className="text-[11px] text-zinc-400">
          hedge mass {guardrail.hedgeMass} | edge mass {guardrail.edgeMass}
        </span>
      </div>
      <p className="text-[11px] text-zinc-500 mt-2">{statusCopy(guardrail.status)}</p>
    </section>
  );
}
