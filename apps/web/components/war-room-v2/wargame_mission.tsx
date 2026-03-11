import React, { useMemo } from "react";
import { Affair, Domain, Interest, MissionGraphDto, VolatilitySourceDto } from "./types";
import type { WarGameDoctrineChain } from "../../lib/war-room/bootstrap";
import { buildMissionGuidance } from "../../lib/war-room/mission-guidance";

interface WarGameMissionProps {
  missionId?: string;
  missionGraph?: MissionGraphDto;
  affairs: Affair[];
  interests: Interest[];
  sources?: VolatilitySourceDto[];
  domains?: Domain[];
  responseLogic?: WarGameDoctrineChain[];
}

export function WarGameMission({ missionId, missionGraph, affairs, interests, sources, domains, responseLogic }: WarGameMissionProps) {
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
  const missionGuidance = useMemo(
    () => buildMissionGuidance({ affairs, interests, sources, domains, responseLogic }),
    [affairs, domains, interests, responseLogic, sources]
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
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Default Mission Ordering</div>
        <div className="space-y-2 text-xs">
          {missionGuidance.recommendedOrder.length ? (
            missionGuidance.recommendedOrder.map((item, index) => (
              <div key={item.id} className="rounded border border-white/10 bg-zinc-950/30 px-3 py-2 text-zinc-200">
                <div>
                  {index + 1}. {item.kind}: {item.title}
                </div>
                {item.doctrineRefs.length ? (
                  <div className="mt-1 space-y-1">
                    {item.doctrineRefs.map((ref) => (
                      <div key={`${item.id}-${ref.sourceId}-${ref.domainId}`} className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-200 mr-1">
                        {ref.sourceName} {"->"} {ref.domainName}: {ref.warnings.join(" ")}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="text-zinc-400">Mission should prioritize Affairs before Interests once state-of-affairs records exist.</div>
          )}
        </div>
      </div>
      {missionGuidance.doctrineLinkedRecords.length ? (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="text-[10px] uppercase tracking-widest text-amber-200 mb-2">Mission Doctrine Cautions</div>
          <div className="space-y-2 text-xs text-amber-100">
            {missionGuidance.doctrineLinkedRecords.slice(0, 4).map((item) => (
              <div key={`caution-${item.id}`}>
                {item.kind}: {item.title}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

