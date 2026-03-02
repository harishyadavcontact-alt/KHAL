import React, { useMemo } from "react";
import { Target } from "lucide-react";
import { AppData } from "./types";

type NodeDatum = {
  name: string;
  value: number;
  x: number;
  y: number;
  color: string;
};

const NODE_LAYOUT: Array<{ name: string; x: number; y: number; color: string }> = [
  { name: "Allies", x: 50, y: 14, color: "#10b981" },
  { name: "Offense", x: 83, y: 30, color: "#f97316" },
  { name: "Defense", x: 83, y: 70, color: "#3b82f6" },
  { name: "Domains", x: 50, y: 86, color: "#a855f7" },
  { name: "Interests", x: 17, y: 70, color: "#14b8a6" },
  { name: "Affairs", x: 17, y: 30, color: "#eab308" },
  { name: "Enemies", x: 50, y: 50, color: "#ef4444" }
];

export const StrategyCircle = ({
  data,
  onSegmentClick,
  selectedSegment
}: {
  data: AppData;
  onSegmentClick: (segment: string) => void;
  selectedSegment?: string | null;
}) => {
  const nodes = useMemo<NodeDatum[]>(() => {
    const affairs = data.affairs ?? [];
    const interests = data.interests ?? [];
    const allyCount = affairs.reduce((acc, affair) => acc + (affair.strategy?.mapping?.allies?.length ?? 0), 0);
    const enemyCount = affairs.reduce((acc, affair) => acc + (affair.strategy?.mapping?.enemies?.length ?? 0), 0);
    const offenseCount = affairs.filter((affair) => (affair.strategy?.posture ?? "").toLowerCase() === "offense").length;
    const defenseCount = Math.max(0, affairs.length - offenseCount);
    const domainCount = data.domains.length;
    const interestCount = interests.length;
    const affairCount = affairs.length;

    const scoreMap: Record<string, number> = {
      Allies: allyCount,
      Enemies: enemyCount,
      Offense: offenseCount,
      Defense: defenseCount,
      Domains: domainCount,
      Interests: interestCount,
      Affairs: affairCount
    };

    return NODE_LAYOUT.map((node) => ({
      name: node.name,
      value: scoreMap[node.name] ?? 0,
      x: node.x,
      y: node.y,
      color: node.color
    }));
  }, [data]);

  return (
    <div className="glass p-4 rounded-lg h-full border border-white/10">
      <h3 className="text-sm font-bold mb-3 uppercase tracking-widest flex items-center gap-2">
        <Target className="text-blue-400" size={16} />
        Strategic Posture (Affairs + Interests)
      </h3>
      <div className="h-[250px] relative rounded-md border border-white/10 bg-zinc-950/50">
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          <line x1="50" y1="50" x2="50" y2="14" stroke="rgba(255,255,255,0.2)" strokeWidth="0.35" />
          <line x1="50" y1="50" x2="83" y2="30" stroke="rgba(255,255,255,0.2)" strokeWidth="0.35" />
          <line x1="50" y1="50" x2="83" y2="70" stroke="rgba(255,255,255,0.2)" strokeWidth="0.35" />
          <line x1="50" y1="50" x2="50" y2="86" stroke="rgba(255,255,255,0.2)" strokeWidth="0.35" />
          <line x1="50" y1="50" x2="17" y2="70" stroke="rgba(255,255,255,0.2)" strokeWidth="0.35" />
          <line x1="50" y1="50" x2="17" y2="30" stroke="rgba(255,255,255,0.2)" strokeWidth="0.35" />
        </svg>

        {nodes.map((node) => {
          const active = selectedSegment === node.name;
          return (
            <button
              key={node.name}
              onClick={() => onSegmentClick(node.name)}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              className={
                active
                  ? "absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded border text-[10px] font-mono bg-blue-500/20 border-blue-400 text-white"
                  : "absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded border text-[10px] font-mono bg-zinc-900/90 border-white/20 text-zinc-200 hover:border-white/40"
              }
            >
              <span className="uppercase">{node.name}</span>
              <span className="ml-2 font-bold" style={{ color: node.color }}>
                {node.value}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-zinc-400 mt-2">Click a node to open filtered posture data.</p>
    </div>
  );
};
