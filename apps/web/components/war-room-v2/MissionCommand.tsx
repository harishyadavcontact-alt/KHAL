import React, { useMemo } from "react";
import { AppData, Domain, WarGameMode } from "./types";

export const MissionCommand = ({
  data,
  onDomainClick: _onDomainClick,
  onWarGame
}: {
  data: AppData;
  onDomainClick: (d: Domain) => void;
  onWarGame: (mode: WarGameMode, targetId?: string) => void;
}) => {
  const missionState = useMemo(() => {
    const lineageRisks = data.lineageRisks ?? [];
    const openRisks = lineageRisks.filter((risk) => risk.status !== "RESOLVED");
    const sortedOpenRisks = [...openRisks].sort((a, b) => (b.fragilityScore ?? 0) - (a.fragilityScore ?? 0));
    const absorbingBarriers = sortedOpenRisks.filter((risk) => (risk.fragilityScore ?? 0) >= 120 || risk.status === "OPEN");

    const affairs = data.affairs ?? [];
    const interests = data.interests ?? [];

    const unresolvedAffairs = affairs.filter((affair) => {
      const hasObjectives = (affair.plan?.objectives ?? []).length > 0;
      const hasCraft = Boolean(affair.means?.craftId);
      const hasDomain = Boolean(affair.domainId);
      return !(hasObjectives && hasCraft && hasDomain);
    });

    const missionTiers = sortedOpenRisks.slice(0, 12).map((risk, index) => {
      const linkedAffairs = affairs.filter((affair) => affair.domainId === risk.domainId || affair.context?.associatedDomains?.includes(risk.domainId));
      const linkedInterests = interests.filter((interest) => interest.domainId === risk.domainId);
      const serialAffairs = linkedAffairs
        .filter((affair) => (affair.status ?? "").toLowerCase() !== "done")
        .slice(0, 3)
        .map((affair) => affair.title);
      const parallelInterests = linkedInterests.slice(0, 3).map((interest) => interest.title);
      return {
        tier: index + 1,
        risk,
        serialAffairs,
        parallelInterests,
        stream: linkedAffairs.length >= linkedInterests.length ? ("hedge" as const) : ("edge" as const)
      };
    });

    const hedgeCount = affairs.length;
    const edgeCount = interests.length;
    const convexityBalance = Number((edgeCount / Math.max(1, hedgeCount + edgeCount)).toFixed(2));

    return {
      openRisks,
      absorbingBarriers,
      unresolvedAffairs,
      missionTiers,
      hedgeCount,
      edgeCount,
      convexityBalance
    };
  }, [data.affairs, data.interests, data.lineageRisks]);

  return (
    <div className="max-w-7xl mx-auto px-3 py-5">
      <section className="glass p-4 rounded-xl border border-red-500/20 mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Mission Doctrine</div>
            <h2 className="text-lg font-bold text-red-300">Mission removes fragility first.</h2>
            <p className="text-xs text-zinc-300 mt-1">
              Mission Command prioritizes absorbing barriers and serial obligations before optionality expansion.
            </p>
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
              <div className="text-base font-bold text-blue-300">{missionState.hedgeCount}</div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-900/60 border border-white/5">
              <div className="text-[10px] uppercase text-zinc-500">Interests (Edge)</div>
              <div className="text-base font-bold text-emerald-300">{missionState.edgeCount}</div>
            </div>
          </div>
        </div>

        {missionState.unresolvedAffairs.length > 0 && (
          <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-200">
            {missionState.unresolvedAffairs.length} affairs still missing mission fields (domain + means + objectives).
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Serial Lane</div>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {missionState.missionTiers.slice(0, 6).map((tier) => (
                <div key={`${tier.risk.id}-serial`} className="p-2 rounded-lg bg-zinc-950/60 border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold">Tier {tier.tier}: {tier.risk.title}</div>
                    <span className="text-[10px] font-mono text-red-300">F:{tier.risk.fragilityScore}</span>
                  </div>
                  <div className="text-[10px] uppercase text-zinc-500 mt-1">Obligations</div>
                  <div className="text-xs text-zinc-300">{tier.serialAffairs.join(" | ") || "No linked affairs yet"}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Parallel Lane</div>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {missionState.missionTiers.slice(0, 6).map((tier) => (
                <div key={`${tier.risk.id}-parallel`} className="p-2 rounded-lg bg-zinc-950/60 border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold">Tier {tier.tier}: {tier.risk.title}</div>
                    <span className={tier.stream === "hedge" ? "text-[10px] font-mono text-blue-300" : "text-[10px] font-mono text-emerald-300"}>
                      {tier.stream.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] uppercase text-zinc-500 mt-1">Options</div>
                  <div className="text-xs text-zinc-300">{tier.parallelInterests.join(" | ") || "No linked interests yet"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-zinc-400">
          Convexity balance (edge share): <span className="text-zinc-200 font-semibold">{missionState.convexityBalance}</span>
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
