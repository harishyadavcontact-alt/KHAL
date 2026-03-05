import React from "react";
import type { AppData, SystemAnatomyNode } from "../types";
import { computeSystemAnatomySnapshot } from "../../../lib/war-room/operational-metrics";

function laneClass(lane: SystemAnatomyNode["lane"]): string {
  if (lane === "risk") return "text-red-300";
  if (lane === "robust") return "text-amber-300";
  return "text-emerald-300";
}

export function SystemAnatomyMiniMap({ data }: { data: AppData }) {
  const snapshot = computeSystemAnatomySnapshot(data);
  const nodes = snapshot.nodes.slice(0, 12);
  const nodeIndex = new Map(nodes.map((node, index) => [node.id, index]));
  const positioned = nodes.map((node, index) => {
    const x = 20 + (index % 4) * 26;
    const y = 18 + Math.floor(index / 4) * 26;
    return { ...node, x, y };
  });

  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">System Anatomy</div>
      <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-100 mb-3">Exposure Mini-Map</h3>

      <div className="rounded border border-white/10 bg-zinc-950/70 p-2">
        <svg viewBox="0 0 120 95" className="w-full h-44">
          {snapshot.edges.slice(0, 16).map((edge) => {
            const fromIdx = nodeIndex.get(edge.from);
            const toIdx = nodeIndex.get(edge.to);
            if (fromIdx == null || toIdx == null) return null;
            const from = positioned[fromIdx];
            const to = positioned[toIdx];
            return (
              <line
                key={edge.id}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="rgba(148,163,184,0.45)"
                strokeWidth={0.7}
              />
            );
          })}
          {positioned.map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={snapshot.criticalNodeId === node.id ? 4 : 3}
                fill={node.lane === "risk" ? "rgba(248,113,113,0.9)" : node.lane === "robust" ? "rgba(251,191,36,0.85)" : "rgba(52,211,153,0.85)"}
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-2 space-y-1.5">
        {positioned.slice(0, 4).map((node) => (
          <div key={`legend-${node.id}`} className="flex items-center justify-between text-xs border border-white/10 rounded px-2 py-1 bg-zinc-950/55">
            <span className={laneClass(node.lane)}>{node.label}</span>
            <span className="text-zinc-400">{node.score}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
