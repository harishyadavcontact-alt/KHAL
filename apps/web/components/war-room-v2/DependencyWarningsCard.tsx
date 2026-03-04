import React from "react";
import { WarGameModeEvaluation } from "./types";

export function DependencyWarningsCard({ evaluation }: { evaluation: WarGameModeEvaluation }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-3 mb-4">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Dependency Warnings</div>
      {!evaluation.dependency.missingModes.length && !evaluation.missingRequiredFields.length ? (
        <div className="text-xs text-emerald-300">No dependency or grammar misses in current mode.</div>
      ) : (
        <div className="space-y-2 text-xs">
          {evaluation.dependency.missingModes.length ? (
            <div className="text-amber-300">
              Missing predecessor modes: {evaluation.dependency.missingModes.map((mode) => mode.toUpperCase()).join(", ")}
            </div>
          ) : null}
          {evaluation.missingRequiredFields.length ? (
            <div className="text-red-300">
              Missing required grammar fields: {evaluation.missingRequiredFields.join(", ")}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

