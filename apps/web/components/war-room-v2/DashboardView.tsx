import React from "react";
import { AppData, Domain } from "./types";
import { HUD } from "./HUD";
import { StrategyCircle } from "./StrategyCircle";
import { FragilityRadar } from "./FragilityRadar";
import { TaskKillChain } from "./TaskKillChain";
import { FragilityHierarchyView } from "./FragilityHierarchyView";

export function DashboardView({
  data,
  onSegmentClick,
  onOpenDomain
}: {
  data: AppData;
  onSegmentClick: (segment: string | null) => void;
  onOpenDomain: (domain: Domain) => void;
}) {
  return (
    <div className="max-w-7xl mx-auto px-3 py-5">
      <HUD user={data.user} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <StrategyCircle data={data} onSegmentClick={onSegmentClick} />
        <FragilityRadar domains={data.domains} affairs={data.affairs} />
        <TaskKillChain tasks={data.tasks} />
      </div>

      <FragilityHierarchyView data={data} onOpenDomain={onOpenDomain} />
    </div>
  );
}
