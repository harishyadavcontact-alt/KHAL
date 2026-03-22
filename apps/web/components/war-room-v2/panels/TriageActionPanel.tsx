import React from "react";
import type { TriageEvaluationSnapshot } from "../types";

export function TriageActionPanel({
  triage,
  onApplyAction
}: {
  triage: TriageEvaluationSnapshot | null;
  onApplyAction?: (suggestionId: string) => Promise<void> | void;
}) {
  if (!triage) return null;
  return (
    <section className="rounded-xl border border-white/15 bg-zinc-900/40 p-3 mb-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">Triage</div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-100">Next Actions</h3>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-400">
          readiness {triage.readinessScore} | {triage.blocked ? "blocked" : "ready"}
        </div>
      </div>
      <div className="text-xs text-zinc-300 mb-2">Next: {triage.nextAction}</div>
      {triage.stateOfArt ? (
        <div className="mb-2 rounded border border-sky-400/20 bg-sky-500/5 px-2.5 py-2 text-[11px] text-sky-100">
          state of the art {triage.stateOfArt.dominantQuadrant ? `| ${triage.stateOfArt.dominantQuadrant.toLowerCase()}` : ""} | verdict {triage.stateOfArt.gateVerdict.toLowerCase().replace("_", "-")} | posture {triage.stateOfArt.recommendedPosture}
          <div className="mt-1 text-sky-100/80">
            cadence {triage.stateOfArt.repeatCadence.toLowerCase()} | {triage.stateOfArt.exotericSignal}
          </div>
          <div className="mt-1 text-sky-100/80">
            {triage.stateOfArt.stages.map((stage) => `${stage.id}:${stage.complete ? "ok" : "gap"}`).join(" | ")}
          </div>
          {triage.stateOfArt.signalWarnings.length ? <div className="mt-1 text-amber-100/90">warnings: {triage.stateOfArt.signalWarnings.join(" | ")}</div> : null}
        </div>
      ) : null}
      {triage.lineagePressure ? (
        <div className="mb-2 rounded border border-amber-400/20 bg-amber-500/5 px-2.5 py-2 text-[11px] text-amber-100">
          lineage {triage.lineagePressure.maxLevel.toLowerCase()} | band {triage.lineagePressure.policyBand.toLowerCase()} | posture {triage.lineagePressure.requiredPosture.toLowerCase().replace("_", "-")}
          <div className="mt-1 text-amber-100/80">
            stakes {Math.round(triage.lineagePressure.stakeSignal)} | risk {Math.round(triage.lineagePressure.riskSignal)} | dependency {Math.round(triage.lineagePressure.dependencyWeight)} | irreversibility {Math.round(triage.lineagePressure.irreversibilityWeight)}
          </div>
          <div className="mt-1 text-amber-100/80">
            open risks {triage.lineagePressure.openRiskCount} | weighted exposure {Math.round(triage.lineagePressure.weightedExposure)}
            {triage.lineagePressure.hedgeRequired ? " | hedge required" : ""}
          </div>
        </div>
      ) : null}
      <div className="space-y-2">
        {triage.suggestions.slice(0, 6).map((item) => (
          <div key={item.id} className="rounded border border-white/10 bg-zinc-950/55 px-2.5 py-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-zinc-100">{item.title}</div>
              <div className="text-zinc-500">p{item.priority}</div>
            </div>
            <div className="text-zinc-300 mt-1">{item.reason}</div>
            {item.missingItems.length ? <div className="text-zinc-400 mt-1">Missing: {item.missingItems.join(", ")}</div> : null}
            {item.actionKind && onApplyAction ? (
              <button
                onClick={() => onApplyAction(item.id)}
                className="mt-2 rounded border border-blue-400/35 bg-blue-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-blue-200"
              >
                Apply Fix
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
