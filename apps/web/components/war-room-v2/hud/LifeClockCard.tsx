import React from "react";
import type { AppData } from "../types";
import { computeLifeClockSnapshot } from "../../../lib/war-room/operational-metrics";

function runwayClass(band: "critical" | "watch" | "stable"): string {
  if (band === "critical") return "text-red-300";
  if (band === "watch") return "text-amber-300";
  return "text-emerald-300";
}

export function LifeClockCard({ data }: { data: AppData }) {
  const snapshot = computeLifeClockSnapshot(data);

  return (
    <section className="glass p-4 rounded-xl border border-white/10 h-full">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Life Clock</div>
      <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-100 mb-3">Runway and Time Axis</h3>

      <div className="space-y-2">
        <div className="rounded border border-white/10 bg-zinc-950/60 px-2.5 py-2">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">Age / Expectancy</div>
          <div className="text-sm font-semibold text-zinc-200">
            {snapshot.ageYears}y / {snapshot.lifeExpectancyYears}y
          </div>
        </div>
        <div className="rounded border border-white/10 bg-zinc-950/60 px-2.5 py-2">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">Years Remaining</div>
          <div className="text-sm font-semibold text-zinc-200">{snapshot.yearsRemaining}y</div>
        </div>
        <div className="rounded border border-white/10 bg-zinc-950/60 px-2.5 py-2">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">Nearest Runway</div>
          <div className={`text-sm font-semibold ${runwayClass(snapshot.runwayBand)}`}>{snapshot.runwayDays} days</div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
          <span>Lifetime progress</span>
          <span>{snapshot.progressPct}%</span>
        </div>
        <div className="h-2 rounded border border-white/10 bg-zinc-900 overflow-hidden">
          <div className="h-full bg-emerald-500/70" style={{ width: `${snapshot.progressPct}%` }} />
        </div>
      </div>
    </section>
  );
}
