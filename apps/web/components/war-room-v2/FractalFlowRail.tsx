import React from "react";
import { WarGameMode, WarGameModeEvaluation, WarGameRole } from "./types";

const FLOW_ORDER: WarGameMode[] = ["source", "domain", "affair", "interest", "craft", "lineage", "mission"];

export function FractalFlowRail({
  mode,
  role,
  onRoleChange,
  onModeSelect,
  evaluation,
  completedModes
}: {
  mode: WarGameMode;
  role: WarGameRole;
  onRoleChange: (next: WarGameRole) => void;
  onModeSelect: (next: WarGameMode) => void;
  evaluation: WarGameModeEvaluation;
  completedModes: Partial<Record<WarGameMode, boolean>>;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-3 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">Fractal Flow Rail</div>
        <div className="flex items-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => onRoleChange("MISSIONARY")}
            className={`rounded px-2 py-1 border ${role === "MISSIONARY" ? "border-blue-400/60 bg-blue-500/15 text-blue-200" : "border-white/10 text-zinc-300 hover:bg-white/5"}`}
          >
            Missionary
          </button>
          <button
            type="button"
            onClick={() => onRoleChange("VISIONARY")}
            className={`rounded px-2 py-1 border ${role === "VISIONARY" ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-200" : "border-white/10 text-zinc-300 hover:bg-white/5"}`}
          >
            Visionary
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {FLOW_ORDER.map((item) => {
          const active = item === mode;
          const completed = Boolean(completedModes[item]);
          return (
            <button
              key={item}
              type="button"
              onClick={() => onModeSelect(item)}
              className={`rounded border px-2.5 py-1 text-[11px] uppercase tracking-widest transition ${
                active
                  ? "border-blue-400/60 bg-blue-500/10 text-blue-200"
                  : completed
                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                    : "border-white/10 text-zinc-300 hover:bg-white/5"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
      {evaluation.nextRecommendedMode ? (
        <div className="mt-3 text-[11px] text-zinc-400">
          Next recommended mode: <span className="text-zinc-200 uppercase">{evaluation.nextRecommendedMode}</span>
        </div>
      ) : null}
    </div>
  );
}

