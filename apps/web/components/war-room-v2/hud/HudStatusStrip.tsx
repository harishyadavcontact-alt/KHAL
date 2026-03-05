import React from "react";
import type { AppData } from "../types";
import { computeHudStatusSnapshot } from "../../../lib/war-room/operational-metrics";

function badgeClass(state: "NOMINAL" | "WATCH" | "CRITICAL"): string {
  if (state === "CRITICAL") return "border-red-500/40 bg-red-500/10 text-red-300";
  if (state === "WATCH") return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
}

export function HudStatusStrip({ data, compact = false }: { data: AppData; compact?: boolean }) {
  const snapshot = computeHudStatusSnapshot(data);

  return (
    <section className={`rounded-xl border border-white/15 bg-zinc-900/45 ${compact ? "p-2.5" : "p-3"} mb-4`}>
      <div className={`grid ${compact ? "grid-cols-2 md:grid-cols-6" : "grid-cols-2 md:grid-cols-7"} gap-2`}>
        <div className={`rounded border px-2 py-1.5 ${badgeClass(snapshot.protocolState)}`}>
          <div className="text-[10px] uppercase tracking-widest opacity-70">Protocol</div>
          <div className="text-xs font-semibold">{snapshot.protocolState}</div>
        </div>
        <div className="rounded border border-white/10 bg-zinc-950/60 px-2 py-1.5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">Volatility</div>
          <div className="text-xs font-semibold uppercase text-zinc-200">{snapshot.volatilityBand}</div>
        </div>
        <div className="rounded border border-white/10 bg-zinc-950/60 px-2 py-1.5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">Confidence</div>
          <div className="text-xs font-semibold text-zinc-200">{snapshot.confidence}</div>
        </div>
        <div className="rounded border border-white/10 bg-zinc-950/60 px-2 py-1.5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">Data Quality</div>
          <div className="text-xs font-semibold text-zinc-200">{snapshot.dataQuality}</div>
        </div>
        <div className="rounded border border-white/10 bg-zinc-950/60 px-2 py-1.5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">Alerts</div>
          <div className="text-xs font-semibold text-zinc-200">{snapshot.activeAlertCount}</div>
        </div>
        <div className="rounded border border-white/10 bg-zinc-950/60 px-2 py-1.5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">Invariant Gaps</div>
          <div className="text-xs font-semibold text-zinc-200">{snapshot.invariantViolationCount}</div>
        </div>
        {!compact && (
          <div className="rounded border border-white/10 bg-zinc-950/60 px-2 py-1.5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Computed</div>
            <div className="text-xs font-semibold text-zinc-200">{snapshot.computedAtIso.slice(11, 19)} UTC</div>
          </div>
        )}
      </div>
    </section>
  );
}
