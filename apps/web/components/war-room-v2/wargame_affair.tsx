import React from "react";
import { Affair, Domain } from "./types";

interface WarGameAffairProps {
  affairId?: string;
  affairs: Affair[];
  domains: Domain[];
}

export function WarGameAffair({ affairId, affairs, domains }: WarGameAffairProps) {
  const affair = affairs.find((item) => item.id === affairId);
  const domain = domains.find((item) => item.id === affair?.domainId);

  return (
    <section className="glass p-5 rounded-xl border border-white/10 mb-6">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Affair WarGame Protocol</h3>
        <span className="text-[10px] font-mono text-zinc-500 uppercase">Mode: Affair</span>
      </div>
      <div className="text-lg font-semibold mb-3">{affair?.title ?? "Select an affair"}</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Domain</div>
          <div className="text-zinc-200">{domain?.name ?? affair?.domainId ?? "Unknown"}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Obligations</div>
          <div className="text-zinc-200">{(affair?.plan?.objectives ?? []).length}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Means Craft</div>
          <div className="text-zinc-200">{affair?.means?.craftId || "Unassigned"}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Heuristics</div>
          <div className="text-zinc-200">{(affair?.means?.selectedHeuristicIds ?? []).length}</div>
        </div>
      </div>
    </section>
  );
}

