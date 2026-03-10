import React from "react";
import { WarGameMode, WarGameModeEvaluation, WarGameRole } from "./types";

const FLOW_SECTIONS: Array<{ id: string; label: string; description: string; modes: WarGameMode[] }> = [
  {
    id: "state-of-the-art",
    label: "State of the Art",
    description: "Map, diagnose, set ends, and choose admissible means.",
    modes: ["source", "domain", "craft"]
  },
  {
    id: "state-of-affairs",
    label: "State of Affairs",
    description: "Separate obligations from options and prepare action.",
    modes: ["affair", "interest"]
  },
  {
    id: "mission",
    label: "Mission",
    description: "Sequence exposures, lineage, and hierarchy into execution order.",
    modes: ["lineage", "mission"]
  }
];

function modeLabel(mode: WarGameMode) {
  if (mode === "source") return "Source";
  if (mode === "domain") return "Domain";
  if (mode === "affair") return "Affair";
  if (mode === "interest") return "Interest";
  if (mode === "craft") return "Craft";
  if (mode === "lineage") return "Lineage";
  return "Mission";
}

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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {FLOW_SECTIONS.map((section) => {
          const activeSection = section.modes.includes(mode);
          const completedCount = section.modes.filter((item) => Boolean(completedModes[item])).length;
          return (
            <div
              key={section.id}
              className={`rounded-xl border p-3 ${
                activeSection ? "border-blue-400/35 bg-blue-500/8" : "border-white/10 bg-zinc-950/35"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">{section.label}</div>
                  <div className="mt-1 text-xs text-zinc-400">{section.description}</div>
                </div>
                <div className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-widest text-zinc-400">
                  {completedCount}/{section.modes.length}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {section.modes.map((item) => {
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
                      {modeLabel(item)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {evaluation.nextRecommendedMode ? (
        <div className="mt-3 text-[11px] text-zinc-400">
          Next recommended mode: <span className="text-zinc-200 uppercase">{modeLabel(evaluation.nextRecommendedMode)}</span>
        </div>
      ) : null}
    </div>
  );
}
