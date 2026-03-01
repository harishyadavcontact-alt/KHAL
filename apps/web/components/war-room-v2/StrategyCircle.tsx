import React, { useMemo } from "react";
import { Target } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AppData } from "./types";

export const StrategyCircle = ({
  data,
  onSegmentClick
}: {
  data: AppData;
  onSegmentClick: (segment: string) => void;
}) => {
  const segments = useMemo(() => {
    const affairs = data.affairs ?? [];
    const interests = data.interests ?? [];
    const allies = affairs.reduce((acc, affair) => acc + (affair.strategy?.mapping?.allies?.length ?? 0), 0);
    const enemies = affairs.reduce((acc, affair) => acc + (affair.strategy?.mapping?.enemies?.length ?? 0), 0);
    const offenseAffairs = affairs.filter((affair) => (affair.strategy?.posture ?? "").toLowerCase() === "offense").length;
    const defenseAffairs = Math.max(0, affairs.length - offenseAffairs);
    const conventional = affairs.filter((affair) => (affair.strategy?.positioning ?? "").toLowerCase().includes("conventional")).length;
    const unconventional = Math.max(0, affairs.length - conventional);
    const overt = interests.filter((interest) => (interest.perspective ?? "").toLowerCase() !== "covert").length;
    const covert = Math.max(0, interests.length - overt);
    const denomAffairs = Math.max(1, affairs.length);
    const denomInterests = Math.max(1, interests.length);

    return [
      { name: "Allies", value: Math.min(100, allies * 10), color: "#10b981" },
      { name: "Enemies", value: Math.min(100, enemies * 10), color: "#ef4444" },
      { name: "Overt", value: Math.round((overt / denomInterests) * 100), color: "#3b82f6" },
      { name: "Covert", value: Math.round((covert / denomInterests) * 100), color: "#8b5cf6" },
      { name: "Offense", value: Math.round((offenseAffairs / denomAffairs) * 100), color: "#f59e0b" },
      { name: "Defense", value: Math.round((defenseAffairs / denomAffairs) * 100), color: "#6366f1" },
      { name: "Conventional", value: Math.round((conventional / denomAffairs) * 100), color: "#a1a1aa" },
      { name: "Unconventional", value: Math.round((unconventional / denomAffairs) * 100), color: "#d946ef" }
    ];
  }, [data]);

  return (
    <div className="glass p-6 rounded-xl h-full">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
        <Target className="text-blue-400" />
        Strategic Posture (Affairs + Interests)
      </h3>
      <div className="h-[250px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              onClick={(entry) => onSegmentClick(entry.name)}
              className="cursor-pointer"
            >
              {segments.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} itemStyle={{ color: "#fff" }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold">{data.affairs.length + data.interests.length}</div>
            <div className="text-[10px] uppercase text-zinc-500 font-mono">Total fronts</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-[10px] font-mono">
        {segments.map((segment) => (
          <div key={segment.name} className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors" onClick={() => onSegmentClick(segment.name)}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: segment.color }} />
            <span className="text-zinc-400 truncate">{segment.name}:</span>
            <span className="font-bold">{segment.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
