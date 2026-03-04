import React from "react";
import type { AppData, ExecutionSplitMetrics } from "../types";
import { computeExecutionSplit } from "../../../lib/war-room/operational-metrics";

function imbalanceText(band: ExecutionSplitMetrics["imbalanceBand"]): string {
  if (band === "fragile-middle") return "Fragile middle detected. Rebalance to strong hedge or strong edge.";
  if (band === "affairs-heavy") return "Defense dominates. Push one convex option to avoid stagnation.";
  if (band === "interests-heavy") return "Offense dominates. Reinforce no-ruin obligations.";
  return "Affairs and Interests are within operational balance.";
}

export function ExecutionSplitPanel({ data }: { data: AppData }) {
  const split = React.useMemo(() => computeExecutionSplit(data), [data]);

  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Execution Split</div>
      <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-100 mb-3">Affairs vs Interests</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
          <div className="text-[10px] uppercase tracking-widest text-blue-300 mb-1">Affairs (Defense)</div>
          <div className="text-lg font-semibold text-blue-200">{split.affairsScore}</div>
          <div className="mt-2 h-2 rounded-full bg-zinc-900/70 border border-white/10 overflow-hidden">
            <div className="h-full bg-blue-400/80" style={{ width: `${split.affairsCompletionPct}%` }} />
          </div>
          <div className="mt-1 text-[11px] text-zinc-300">
            completion {split.affairsCompletionPct}% | fragility reduction {split.fragilityReductionProxy}% | open {split.affairsOpenCount}
          </div>
          <div className="mt-2 text-[11px] text-zinc-400">If neglected: no-ruin posture degrades and losses compound.</div>
        </div>

        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          <div className="text-[10px] uppercase tracking-widest text-emerald-300 mb-1">Interests (Offense)</div>
          <div className="text-lg font-semibold text-emerald-200">{split.interestsScore}</div>
          <div className="mt-2 h-2 rounded-full bg-zinc-900/70 border border-white/10 overflow-hidden">
            <div className="h-full bg-emerald-400/80" style={{ width: `${split.interestsExecutionPct}%` }} />
          </div>
          <div className="mt-1 text-[11px] text-zinc-300">
            execution {split.interestsExecutionPct}% | convexity mass {split.convexityMass} | active {split.interestsActiveCount}
          </div>
          <div className="mt-2 text-[11px] text-zinc-400">If neglected: optionality decays and upside asymmetry disappears.</div>
        </div>
      </div>

      <div className="mt-3 text-[11px] text-zinc-400">{imbalanceText(split.imbalanceBand)}</div>
    </section>
  );
}
