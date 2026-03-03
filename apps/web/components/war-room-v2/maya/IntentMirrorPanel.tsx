import React from "react";
import type { AppData, MayaFlowSnapshot } from "../types";
import { buildIntentMirrorSnapshot } from "../../../lib/war-room/intent-mirror-metrics";

function badgeClass(band: "critical" | "watch" | "stable" | "unmapped"): string {
  if (band === "critical") return "border-red-400/40 bg-red-500/10 text-red-300";
  if (band === "watch") return "border-amber-400/40 bg-amber-500/10 text-amber-300";
  if (band === "stable") return "border-emerald-400/35 bg-emerald-500/10 text-emerald-300";
  return "border-white/10 bg-zinc-900/40 text-zinc-500";
}

export function IntentMirrorPanel({ data, mayaSnapshot }: { data: AppData; mayaSnapshot: MayaFlowSnapshot }) {
  const snapshot = React.useMemo(() => buildIntentMirrorSnapshot(data, mayaSnapshot), [data, mayaSnapshot]);
  const noRuinTone =
    snapshot.noRuinState === "AT_RISK"
      ? "border-red-400/45 bg-red-500/10 text-red-300"
      : "border-emerald-400/35 bg-emerald-500/10 text-emerald-300";

  return (
    <section className="glass rounded-xl border border-white/10 p-4 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-zinc-100">Intent Mirror</div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">Read-only</div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <span className="rounded-full border border-white/10 bg-zinc-900/50 px-2 py-1 text-[10px] uppercase tracking-widest text-zinc-300">
          {snapshot.condition}
        </span>
        <span className="rounded-full border border-white/10 bg-zinc-900/50 px-2 py-1 text-[10px] uppercase tracking-widest text-zinc-300">
          Signal: {snapshot.signal}
        </span>
        <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-widest ${noRuinTone}`}>
          No-ruin: {snapshot.noRuinState}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
        {snapshot.principalLadder.map((level) => (
          <div key={level.levelKey} className={`rounded border px-2 py-1.5 ${badgeClass(level.band)}`}>
            <div className="text-[10px] uppercase tracking-widest">{level.label}</div>
            <div className="mt-0.5 text-xs font-semibold">
              {level.score === null ? "unmapped" : `${level.score}`}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="rounded border border-white/10 bg-zinc-900/40 px-2.5 py-2 text-xs text-zinc-300">
          Barbell: {snapshot.barbellState}
        </div>
        <div className="rounded border border-white/10 bg-zinc-900/40 px-2.5 py-2 text-xs text-emerald-300">
          Convex share: {snapshot.convexSharePct}%
        </div>
        <div className="rounded border border-white/10 bg-zinc-900/40 px-2.5 py-2 text-xs text-amber-300">
          Cave share: {snapshot.caveSharePct}%
        </div>
      </div>

      <div className="mt-3 rounded border border-white/10 bg-zinc-900/40 px-2.5 py-2">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">Directive</div>
        <div className="text-sm font-medium text-zinc-100 mt-1">{snapshot.directive}</div>
      </div>
    </section>
  );
}
