import React from "react";
import type { AppData } from "../types";
import { computeStakeTriad } from "../../../lib/war-room/operational-metrics";

export function StakesTriadPanel({ data }: { data: AppData }) {
  const triad = React.useMemo(() => computeStakeTriad(data), [data]);

  const rows = [
    {
      key: "life",
      label: "Life",
      score: triad.lifeScore,
      detail: `${triad.openLineageRiskCount} open lineage risks`,
      meterClass: "bg-red-500/80"
    },
    {
      key: "time",
      label: "Time",
      score: triad.timeScore,
      detail: `${triad.overdueTaskCount} overdue, ${triad.nearTermTaskCount} near-term, ${triad.unscheduledTaskCount} unscheduled`,
      meterClass: "bg-amber-400/80"
    },
    {
      key: "soul",
      label: "Soul",
      score: triad.soulScore,
      detail: `schedulability ${triad.schedulabilityCoverage}% | actionability ${triad.actionabilityCoverage}%`,
      meterClass: "bg-cyan-400/80"
    }
  ];

  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Stakes Triad</div>
      <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-100 mb-3">Life | Time | Soul</h3>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.key} className="rounded-lg border border-white/10 bg-zinc-950/50 p-2.5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-zinc-200">{row.label}</span>
              <span className="font-mono text-zinc-300">{row.score}</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div className={`h-full ${row.meterClass}`} style={{ width: `${Math.max(2, row.score)}%` }} />
            </div>
            <div className="text-[11px] text-zinc-500 mt-1.5">{row.detail}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
