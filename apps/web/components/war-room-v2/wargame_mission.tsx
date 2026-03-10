import React, { useMemo } from "react";
import { Affair, Interest, MissionGraphDto } from "./types";

interface WarGameMissionProps {
  missionId?: string;
  missionGraph?: MissionGraphDto;
  affairs: Affair[];
  interests: Interest[];
}

export function WarGameMission({ missionId, missionGraph, affairs, interests }: WarGameMissionProps) {
  const missionNodes = useMemo(
    () => (missionGraph?.nodes ?? []).filter((node) => node.missionId === missionId && node.refType !== "MISSION"),
    [missionGraph?.nodes, missionId]
  );
  const nodeIds = new Set(missionNodes.map((node) => node.id));
  const dependencies = (missionGraph?.dependencies ?? []).filter((dep) => nodeIds.has(dep.missionNodeId) && nodeIds.has(dep.dependsOnNodeId));
  const affairCount = missionNodes.filter((node) => node.refType === "AFFAIR").length;
  const interestCount = missionNodes.filter((node) => node.refType === "INTEREST").length;
  const linkedAffairs = affairs.filter((affair) => missionNodes.some((node) => node.refType === "AFFAIR" && node.refId === affair.id));
  const linkedInterests = interests.filter((interest) => missionNodes.some((node) => node.refType === "INTEREST" && node.refId === interest.id));
  const recommendedOrder = [
    ...[...affairs].sort((left, right) => Number(right.stakes ?? 0) * Number(right.risk ?? 0) - Number(left.stakes ?? 0) * Number(left.risk ?? 0)).map((affair) => ({
      id: affair.id,
      kind: "Affair",
      title: affair.title
    })),
    ...[...interests].sort((left, right) => Number(right.convexity ?? 0) - Number(left.convexity ?? 0)).map((interest) => ({
      id: interest.id,
      kind: "Interest",
      title: interest.title
    }))
  ].slice(0, 6);

  return (
    <section className="glass p-5 rounded-xl border border-white/10 mb-6">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Mission WarGame Protocol</h3>
        <span className="text-[10px] font-mono text-zinc-500 uppercase">Mode: Mission</span>
      </div>
      <div className="text-lg font-semibold mb-3">{missionId ?? "mission-global"}</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Mission Nodes</div>
          <div className="text-zinc-200">{missionNodes.length}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Dependencies</div>
          <div className="text-zinc-200">{dependencies.length}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Affairs / Interests Nodes</div>
          <div className="text-zinc-200">
            {affairCount} / {interestCount}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Linked Entities</div>
          <div className="text-zinc-200">
            {linkedAffairs.length + linkedInterests.length}
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-white/10 bg-zinc-900/40 p-3">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Default Mission Ordering</div>
        <div className="space-y-2 text-xs">
          {recommendedOrder.length ? (
            recommendedOrder.map((item, index) => (
              <div key={item.id} className="rounded border border-white/10 bg-zinc-950/30 px-3 py-2 text-zinc-200">
                {index + 1}. {item.kind}: {item.title}
              </div>
            ))
          ) : (
            <div className="text-zinc-400">Mission should prioritize Affairs before Interests once state-of-affairs records exist.</div>
          )}
        </div>
      </div>
    </section>
  );
}

