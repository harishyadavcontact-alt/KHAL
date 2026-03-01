import React from "react";
import { LineageNodeDto, LineageRiskDto } from "./types";

interface WarGameLineageProps {
  lineageNodeId?: string;
  lineages: LineageNodeDto[];
  lineageRisks: LineageRiskDto[];
}

export function WarGameLineage({ lineageNodeId, lineages, lineageRisks }: WarGameLineageProps) {
  const node = lineages.find((item) => item.id === lineageNodeId);
  const risks = lineageRisks.filter((risk) => risk.lineageNodeId === lineageNodeId);
  const openRisks = risks.filter((risk) => risk.status !== "RESOLVED");

  return (
    <section className="glass p-5 rounded-xl border border-white/10 mb-6">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Lineage WarGame Protocol</h3>
        <span className="text-[10px] font-mono text-zinc-500 uppercase">Mode: Lineage</span>
      </div>
      <div className="text-lg font-semibold mb-3">{node ? `${node.level} - ${node.name}` : "Select a lineage"}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Risk Rows</div>
          <div className="text-zinc-200">{risks.length}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Open Risk Rows</div>
          <div className="text-zinc-200">{openRisks.length}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Max Fragility Score</div>
          <div className="text-zinc-200">{Math.max(0, ...risks.map((risk) => Number(risk.fragilityScore ?? 0)))}</div>
        </div>
      </div>
    </section>
  );
}

