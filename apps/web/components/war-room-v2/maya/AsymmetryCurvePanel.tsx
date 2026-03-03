import React from "react";
import type { AppData } from "../types";
import { computeAsymmetrySnapshot } from "../../../lib/war-room/operational-metrics";

function bandLabel(band: "fragile" | "neutral" | "antifragile"): string {
  if (band === "fragile") return "Fragile profile";
  if (band === "antifragile") return "Antifragile profile";
  return "Neutral profile";
}

function bandBadgeClass(band: "fragile" | "neutral" | "antifragile"): string {
  if (band === "fragile") return "rounded-full border border-red-400/40 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-red-300";
  if (band === "antifragile") {
    return "rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-emerald-300";
  }
  return "rounded-full border border-amber-400/35 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-300";
}

export function AsymmetryCurvePanel({ data }: { data: AppData }) {
  const snapshot = React.useMemo(() => computeAsymmetrySnapshot(data), [data]);
  const markerColor =
    snapshot.band === "antifragile" ? "bg-emerald-400" : snapshot.band === "fragile" ? "bg-red-400" : "bg-amber-400";

  return (
    <section className="glass p-4 rounded-xl border border-white/10 h-full">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Asymmetry Position</div>
      <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-100 mb-3">Fragile linear to Convex antifragile</h3>

      <div className="relative rounded-lg border border-white/10 bg-zinc-950/60 p-3 h-[180px] overflow-hidden">
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="mayaCurve" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(239,68,68,0.5)" />
              <stop offset="50%" stopColor="rgba(245,158,11,0.45)" />
              <stop offset="100%" stopColor="rgba(16,185,129,0.6)" />
            </linearGradient>
          </defs>
          <path d="M 6 82 C 32 76, 52 58, 94 20" stroke="url(#mayaCurve)" strokeWidth="2.2" fill="none" />
          <line x1="6" y1="82" x2="94" y2="82" stroke="rgba(255,255,255,0.18)" strokeWidth="0.45" />
        </svg>

        <div
          className={`absolute w-3 h-3 rounded-full border border-white ${markerColor}`}
          style={{ left: `calc(${snapshot.markerX}% - 6px)`, top: `calc(${snapshot.markerY}% - 6px)` }}
        />

        <div className="absolute left-2 bottom-2 text-[10px] uppercase tracking-widest text-zinc-500">Fragile</div>
        <div className="absolute right-2 top-2 text-[10px] uppercase tracking-widest text-zinc-500">Antifragile</div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={bandBadgeClass(snapshot.band)}>{bandLabel(snapshot.band)}</span>
        <span className="text-[11px] text-zinc-400">balance {snapshot.balance}</span>
      </div>
      <p className="text-[11px] text-zinc-500 mt-2">
        convexity mass {snapshot.convexityMass} | fragility mass {snapshot.fragilityMass}
      </p>
    </section>
  );
}
