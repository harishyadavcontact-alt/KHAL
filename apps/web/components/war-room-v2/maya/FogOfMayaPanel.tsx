import React from "react";
import type { AppData } from "../types";
import { computeHarmSignalSnapshot } from "../../../lib/war-room/operational-metrics";

function bandClass(band: "stable" | "watch" | "critical"): string {
  if (band === "critical") return "text-red-300 border-red-500/40 bg-red-500/10";
  if (band === "watch") return "text-amber-300 border-amber-500/40 bg-amber-500/10";
  return "text-emerald-300 border-emerald-500/40 bg-emerald-500/10";
}

export function FogOfMayaPanel({ data }: { data: AppData }) {
  const snapshot = React.useMemo(() => computeHarmSignalSnapshot(data), [data]);
  const points = snapshot.series
    .map((point, index) => `${(index / Math.max(1, snapshot.series.length - 1)) * 100},${100 - point.value}`)
    .join(" ");

  return (
    <section className="glass p-4 rounded-xl border border-white/10 mb-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Causal Opacity</div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-100">Fog of Maya / Harm Signal</h3>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest font-semibold ${bandClass(snapshot.signalBand)}`}>
          {snapshot.signalBand}
        </span>
      </div>

      <div className="rounded-lg border border-white/10 bg-zinc-950/60 p-3">
        <div className="h-24 w-full">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <polyline
              points={points}
              fill="none"
              stroke="rgba(148,163,184,0.8)"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {snapshot.series.map((point, index) => {
              const x = (index / Math.max(1, snapshot.series.length - 1)) * 100;
              const y = 100 - point.value;
              return point.spike ? (
                <g key={point.id}>
                  <line x1={x} y1={100} x2={x} y2={y} stroke="rgba(248,113,113,0.9)" strokeWidth="0.8" />
                  <circle cx={x} cy={y} r="1.4" fill="rgba(248,113,113,1)" />
                </g>
              ) : (
                <circle key={point.id} cx={x} cy={y} r="1" fill="rgba(148,163,184,0.75)" />
              );
            })}
          </svg>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
          <div className="rounded border border-white/10 bg-zinc-900/60 px-2 py-1">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Harm</div>
            <div className="font-semibold text-zinc-100">{snapshot.harmLevel}</div>
          </div>
          <div className="rounded border border-white/10 bg-zinc-900/60 px-2 py-1">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Disorder</div>
            <div className="font-semibold text-zinc-100">{snapshot.disorderPressure}</div>
          </div>
          <div className="rounded border border-white/10 bg-zinc-900/60 px-2 py-1">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Open Critical</div>
            <div className="font-semibold text-zinc-100">{snapshot.openCriticalCount}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="rounded border border-white/10 bg-zinc-900/55 px-2.5 py-2">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Problem</div>
          <p className="text-xs text-zinc-300">Causal structure stays opaque under volatility.</p>
        </div>
        <div className="rounded border border-white/10 bg-zinc-900/55 px-2.5 py-2">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Signal</div>
          <p className="text-xs text-zinc-300">Harm level {snapshot.harmLevel} with {snapshot.openCriticalCount} open critical risks.</p>
        </div>
        <div className="rounded border border-white/10 bg-zinc-900/55 px-2.5 py-2">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Default</div>
          <p className="text-xs text-zinc-300">Without protocol, fragility accumulates faster than recovery.</p>
        </div>
      </div>
    </section>
  );
}
