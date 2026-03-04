import type { DualPathScenario } from "./types";

function failureNodeLabel(ruinRisk: number): string {
  if (ruinRisk >= 70) return "Failure Cascade";
  if (ruinRisk >= 45) return "Pressure Build";
  return "Manageable Drift";
}

function mitigationNodeLabel(survivalOdds: number): string {
  if (survivalOdds >= 70) return "Mitigation Locked";
  if (survivalOdds >= 45) return "Mitigation Active";
  return "Mitigation Weak";
}

export function DualPathComparator({ scenario }: { scenario: DualPathScenario }) {
  const criticalNode = scenario.criticalNode?.trim() || "Critical node";
  const pathAFailure = failureNodeLabel(scenario.ruinRisk);
  const pathBMitigation = mitigationNodeLabel(scenario.survivalOdds);

  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">War Gaming Comparator</div>
          <h3 className="text-sm font-bold text-zinc-100">Path A vs Path B</h3>
        </div>
        <div className={scenario.delta >= 0 ? "text-emerald-300 text-sm font-bold" : "text-red-300 text-sm font-bold"}>
          delta {scenario.delta >= 0 ? "+" : ""}{scenario.delta}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3">
          <div className="text-[10px] uppercase tracking-widest text-red-200 mb-1">Path A | Unprepared</div>
          <div className="text-lg font-semibold text-red-200">{scenario.unpreparedScore}</div>
          <div className="text-xs text-zinc-300 mt-1">Ruin risk {scenario.ruinRisk}%</div>
        </div>
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3">
          <div className="text-[10px] uppercase tracking-widest text-emerald-200 mb-1">Path B | Prepared</div>
          <div className="text-lg font-semibold text-emerald-200">{scenario.preparedScore}</div>
          <div className="text-xs text-zinc-300 mt-1">Survival odds {scenario.survivalOdds}%</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg border border-white/10 bg-zinc-900/60 px-2 py-1.5">
          <div className="text-[10px] uppercase text-zinc-500">Time to impact</div>
          <div className="text-sm font-semibold">{scenario.timeToImpact}d</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-zinc-900/60 px-2 py-1.5">
          <div className="text-[10px] uppercase text-zinc-500">Resource burn</div>
          <div className="text-sm font-semibold">{scenario.resourceBurn}%</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-zinc-900/60 px-2 py-1.5">
          <div className="text-[10px] uppercase text-zinc-500">Critical node</div>
          <div className="text-xs font-semibold line-clamp-2">{scenario.criticalNode}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3">
          <div className="text-[10px] uppercase tracking-widest text-red-200 mb-2">Path A Chain</div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="rounded-md border border-red-500/35 bg-zinc-950/60 px-2 py-1 text-red-200">Unprepared</span>
            <span className="text-red-300/70">{"->"}</span>
            <span className="rounded-md border border-red-500/35 bg-zinc-950/60 px-2 py-1 text-red-100">{pathAFailure}</span>
            <span className="text-red-300/70">{"->"}</span>
            <span className="rounded-md border border-red-500/45 bg-red-500/20 px-2 py-1 font-semibold text-red-100">Ruin</span>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3">
          <div className="text-[10px] uppercase tracking-widest text-emerald-200 mb-2">Path B Chain</div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="rounded-md border border-emerald-500/35 bg-zinc-950/60 px-2 py-1 text-emerald-200">Prepared</span>
            <span className="text-emerald-300/70">{"->"}</span>
            <span className="rounded-md border border-emerald-500/35 bg-zinc-950/60 px-2 py-1 text-emerald-100">{criticalNode}</span>
            <span className="text-emerald-300/70">{"->"}</span>
            <span className="rounded-md border border-emerald-500/35 bg-zinc-950/60 px-2 py-1 text-emerald-100">{pathBMitigation}</span>
            <span className="text-emerald-300/70">{"->"}</span>
            <span className="rounded-md border border-emerald-500/45 bg-emerald-500/20 px-2 py-1 font-semibold text-emerald-100">Survival</span>
          </div>
        </div>
      </div>
    </section>
  );
}
