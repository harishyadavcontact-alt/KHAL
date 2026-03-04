import React from "react";
import { Craft } from "./types";

interface WarGameCraftProps {
  craftId?: string;
  crafts: Craft[];
}

export function WarGameCraft({ craftId, crafts }: WarGameCraftProps) {
  const craft = crafts.find((item) => item.id === craftId);
  const heaps = craft?.heaps ?? [];
  const models = craft?.models ?? [];
  const frameworks = craft?.frameworks ?? [];
  const barbells = craft?.barbellStrategies ?? [];
  const heuristics = craft?.heuristics ?? [];

  return (
    <section className="glass p-5 rounded-xl border border-white/10 mb-6">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Craft WarGame Protocol</h3>
        <span className="text-[10px] font-mono text-zinc-500 uppercase">Mode: Craft</span>
      </div>
      <div className="text-lg font-semibold mb-3">{craft?.name ?? "Select a craft"}</div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs mb-3">
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Heaps</div>
          <div className="text-zinc-200">{heaps.length}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Models</div>
          <div className="text-zinc-200">{models.length}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Frameworks</div>
          <div className="text-zinc-200">{frameworks.length}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Barbell Strategies</div>
          <div className="text-zinc-200">{barbells.length}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Heuristics</div>
          <div className="text-zinc-200">{heuristics.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Path Dependency</div>
          <div className="text-zinc-300">Heap {"->"} Model {"->"} Framework {"->"} Barbell {"->"} Heuristic</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Fit Rationale</div>
          <div className="text-zinc-300">
            {heuristics.length
              ? "Heuristic set present. Validate if means fit selected barbell ends."
              : "No heuristic output yet. Complete craft chain before execution use."}
          </div>
        </div>
      </div>
    </section>
  );
}
