import React, { useEffect, useMemo, useRef, useState } from "react";
import { AppData, Domain, WarGameMode } from "./types";
import { HeatGrid } from "./charts/HeatGrid";
import { FlowLanes } from "./charts/FlowLanes";
import { StackedBalanceBar } from "./charts/StackedBalanceBar";
import { buildMissionVisualSnapshot } from "../../lib/war-room/visual-encodings";
import { VirtueSpiralPanel } from "./VirtueSpiralPanel";
import { DoNowCopilotCard } from "./DoNowCopilotCard";
import { ProtocolStatusStrip } from "./ProtocolStatusStrip";
import {
  ConfidenceEvidenceStrip,
  MissionBottleneckPanel,
  RecoveryPlaybooksPanel
} from "./panels/RobustnessPanels";
import { v03Flags } from "../../lib/war-room/feature-flags";

export const MissionCommand = ({
  data,
  onDomainClick: _onDomainClick,
  onWarGame,
  onQueueAction
}: {
  data: AppData;
  onDomainClick: (d: Domain) => void;
  onWarGame: (mode: WarGameMode, targetId?: string) => void;
  onQueueAction?: () => Promise<void> | void;
}) => {
  const tierRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeTierIndex, setActiveTierIndex] = useState(0);

  const missionState = useMemo(() => {
    const lineageRisks = data.lineageRisks ?? [];
    const openRisks = lineageRisks.filter((risk) => risk.status !== "RESOLVED");
    const sortedOpenRisks = [...openRisks].sort((a, b) => (b.fragilityScore ?? 0) - (a.fragilityScore ?? 0));
    const absorbingBarriers = sortedOpenRisks.filter((risk) => (risk.fragilityScore ?? 0) >= 120 || risk.status === "OPEN");

    const affairs = data.affairs ?? [];

    const unresolvedAffairs = affairs.filter((affair) => {
      const hasObjectives = (affair.plan?.objectives ?? []).length > 0;
      const hasCraft = Boolean(affair.means?.craftId);
      const hasDomain = Boolean(affair.domainId);
      return !(hasObjectives && hasCraft && hasDomain);
    });

    return {
      openRisks,
      absorbingBarriers,
      unresolvedAffairs
    };
  }, [data.affairs, data.interests, data.lineageRisks]);

  const missionSnapshot = useMemo(() => buildMissionVisualSnapshot(data), [data]);
  const activeTier = missionSnapshot.rows[activeTierIndex] ?? null;

  useEffect(() => {
    setActiveTierIndex(0);
  }, [missionSnapshot.rows.length]);

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;
      const tag = target.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select";
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        const active = document.activeElement as HTMLElement | null;
        if (active?.dataset?.missionTierIndex) {
          event.preventDefault();
          const idx = Number(active.dataset.missionTierIndex);
          const tier = missionSnapshot.rows[idx];
          if (tier) onWarGame("mission", `mission-${tier.domainId}`);
        }
        return;
      }

      if (event.key !== "Tab" || event.ctrlKey || event.altKey || event.metaKey) return;
      if (isEditableTarget(event.target)) return;

      const items = tierRefs.current.filter(Boolean) as HTMLButtonElement[];
      if (!items.length) return;
      event.preventDefault();
      const current = items.findIndex((item) => item === document.activeElement);
      const direction = event.shiftKey ? -1 : 1;
      const next = current === -1 ? (direction > 0 ? 0 : items.length - 1) : (current + direction + items.length) % items.length;
      setActiveTierIndex(next);
      items[next]?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [missionSnapshot.rows, onWarGame]);

  const rowIndexById = useMemo(() => {
    const map = new Map<string, number>();
    missionSnapshot.rows.forEach((row, index) => map.set(row.id, index));
    return map;
  }, [missionSnapshot.rows]);
  const fallbackDecisionAcceleration = useMemo(() => ({
    virtueSpiral: {
      stage: "REDUCE_FRAGILITY" as const,
      score: 0,
      trend: "STABLE" as const,
      nextAction: "No decision telemetry available yet.",
      openFragilityMass: 0,
      convexityMass: 0,
      executionVelocity: 0
    },
    pathComparator: {
      unpreparedScore: 0,
      preparedScore: 0,
      delta: 0,
      ruinRisk: 0,
      survivalOdds: 0,
      timeToImpact: 0,
      resourceBurn: 0,
      criticalNode: "No critical node"
    },
    copilot: {
      promptState: "State telemetry unavailable.",
      suggestedAction: "Create one affair to seed execution.",
      rationale: "Without seeded obligations, the system cannot rank next actions.",
      ctaPayload: {
        title: "Seed first affair from mission copilot",
        sourceType: "PLAN" as const,
        sourceId: "mission-global",
        horizon: "WEEK" as const,
        notes: "Fallback copilot action."
      }
    }
  }), []);
  const decisionAcceleration = data.decisionAcceleration ?? fallbackDecisionAcceleration;

  return (
    <div className="max-w-7xl mx-auto px-3 py-5">
      <ProtocolStatusStrip meta={data.decisionAccelerationMeta} />
      {v03Flags.confidence && <ConfidenceEvidenceStrip confidence={data.confidence} protocolState={data.decisionAccelerationMeta?.protocolState} />}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 mb-5">
        <VirtueSpiralPanel spiral={decisionAcceleration.virtueSpiral} />
        <DoNowCopilotCard
          copilot={decisionAcceleration.copilot}
          onQueued={onQueueAction}
          blocked={data.tripwire?.riskyActionBlocked}
          blockedReason={data.tripwire?.reason}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <MissionBottleneckPanel rows={data.missionBottlenecks} />
        <RecoveryPlaybooksPanel rows={data.recoveryPlaybooks} />
      </div>
      <section className="glass p-4 rounded-xl border border-red-500/20 mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Mission Doctrine</div>
            <h2 className="text-lg font-bold text-red-300">Mission removes fragility first.</h2>
            <p className="text-xs text-zinc-300 mt-1">Absorbing barriers first, then expand optionality.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 min-w-[240px]">
            <div className="p-2 rounded-lg bg-zinc-900/60 border border-white/5">
              <div className="text-[10px] uppercase text-zinc-500">Open Fragilities</div>
              <div className="text-base font-bold">{missionState.openRisks.length}</div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-900/60 border border-white/5">
              <div className="text-[10px] uppercase text-zinc-500">Absorbing Barriers</div>
              <div className="text-base font-bold text-red-400">{missionState.absorbingBarriers.length}</div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-900/60 border border-white/5">
              <div className="text-[10px] uppercase text-zinc-500">Affairs (Hedge)</div>
              <div className="text-base font-bold text-blue-300">{data.affairs.length}</div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-900/60 border border-white/5">
              <div className="text-[10px] uppercase text-zinc-500">Interests (Edge)</div>
              <div className="text-base font-bold text-emerald-300">{data.interests.length}</div>
            </div>
          </div>
        </div>

        {missionState.unresolvedAffairs.length > 0 && (
          <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-200">
            {missionState.unresolvedAffairs.length} affairs still missing mission fields (domain + means + objectives).
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Top Mission Risk HeatGrid</div>
            <HeatGrid
              columns={missionSnapshot.heatColumns}
              rows={missionSnapshot.heatRows}
              cells={missionSnapshot.heatCells}
              activeRowId={activeTier?.id}
              onRowClick={(rowId) => {
                const index = rowIndexById.get(rowId);
                if (index === undefined) return;
                setActiveTierIndex(index);
              }}
              emptyText="No open mission tiers."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-3 mt-3">
          <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Serial vs Parallel Flows</div>
            <FlowLanes
              nodes={missionSnapshot.flowNodes}
              lanes={missionSnapshot.flowLanes}
              links={missionSnapshot.flowLinks}
              activeNodeId={activeTier?.id}
              onNodeClick={(nodeId) => {
                const index = rowIndexById.get(nodeId);
                if (index === undefined) return;
                setActiveTierIndex(index);
              }}
              emptyText="No tier flows to render."
            />
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Tier Focus</div>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {missionSnapshot.rows.slice(0, 12).map((tier, index) => (
                <button
                  key={tier.id}
                  ref={(el) => {
                    tierRefs.current[index] = el;
                  }}
                  data-mission-tier-index={index}
                  onClick={() => {
                    setActiveTierIndex(index);
                    onWarGame("mission", `mission-${tier.domainId}`);
                  }}
                  className={
                    activeTierIndex === index
                      ? "w-full text-left p-2 rounded-lg bg-blue-500/15 border border-blue-500/40"
                      : "w-full text-left p-2 rounded-lg bg-zinc-950/60 border border-white/5 hover:border-blue-500/30"
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold">Tier {tier.tier}: {tier.title}</div>
                    <span className="text-[10px] font-mono text-red-300">F:{tier.fragility}</span>
                  </div>
                  <div className="text-[10px] uppercase text-zinc-500 mt-1">Serial</div>
                  <div className="text-xs text-zinc-300">{tier.serialAffairs.join(" | ") || "No linked affairs yet"}</div>
                  <div className="text-[10px] uppercase text-zinc-500 mt-1">Parallel</div>
                  <div className="text-xs text-zinc-300">{tier.parallelInterests.join(" | ") || "No linked interests yet"}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Convexity Balance</div>
          <StackedBalanceBar segments={missionSnapshot.balanceSegments} />
        </div>

        <div className="mt-3">
          <button
            onClick={() => onWarGame("mission", "mission-global")}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-[11px] font-bold uppercase tracking-widest text-white"
          >
            WarGame Mission
          </button>
        </div>
      </section>
    </div>
  );
};
