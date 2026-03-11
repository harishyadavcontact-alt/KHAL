import React, { useMemo } from "react";
import { Affair, Interest, MissionGraphDto, VolatilitySourceDto } from "./types";
import type { WarGameDoctrineChain } from "../../lib/war-room/bootstrap";
import { buildMissionRecommendedOrder as buildMissionRecommendedOrderFromLib, doctrineGapByDomainReadable } from "../../lib/war-room/mission-ranking";

interface WarGameMissionProps {
  missionId?: string;
  missionGraph?: MissionGraphDto;
  affairs: Affair[];
  interests: Interest[];
  sources?: VolatilitySourceDto[];
  responseLogic?: WarGameDoctrineChain[];
}

export type { MissionRecommendedOrderItem } from "../../lib/war-room/mission-ranking";

export function unresolvedDoctrineGapByDomain(sources: VolatilitySourceDto[] = [], responseLogic: WarGameDoctrineChain[] = []): Map<string, string> {
  return doctrineGapByDomainReadable(sources, responseLogic);
}

export function buildMissionRecommendedOrder(args: {
  affairs: Affair[];
  interests: Interest[];
  doctrineGapByDomain?: Map<string, string>;
}) {
  return buildMissionRecommendedOrderFromLib(args);
}

export function WarGameMission({ missionId, missionGraph, affairs, interests, sources, responseLogic }: WarGameMissionProps) {
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
  const doctrineGapByDomain = useMemo(() => unresolvedDoctrineGapByDomain(sources, responseLogic ?? []), [responseLogic, sources]);
  const recommendedOrder = useMemo(
    () => buildMissionRecommendedOrder({ affairs, interests, doctrineGapByDomain }),
    [affairs, doctrineGapByDomain, interests]
  );

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
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">Default Mission Ordering</div>
          <div className="text-[10px] text-amber-300">Doctrine gap penalties: {recommendedOrder.filter((item) => item.penalizedByDoctrineGap).length}</div>
        </div>
        <div className="space-y-2 text-xs">
          {recommendedOrder.length ? (
            recommendedOrder.map((item, index) => (
              <div key={item.id} className="rounded border border-white/10 bg-zinc-950/30 px-3 py-2 text-zinc-200">
                <div>
                  {index + 1}. {item.kind}: {item.title}
                </div>
                {item.penalizedByDoctrineGap ? (
                  <div className="mt-1 inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-200">
                    penalized due to doctrine gap{item.doctrineGapReason ? ` (${item.doctrineGapReason})` : ""}
                  </div>
                ) : null}
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
