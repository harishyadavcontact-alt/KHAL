import React, { useMemo, useState } from "react";
import { Map as MapIcon, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { AppData, Domain } from "./types";
import { cn } from "./utils";
import { HUD } from "./HUD";
import { StrategyCircle } from "./StrategyCircle";
import { FragilityRadar } from "./FragilityRadar";
import { TaskKillChain } from "./TaskKillChain";
import { DomainCard } from "./DomainCard";
import { WarGameMode } from "./types";

export const MissionCommand = ({
  data,
  onDomainClick,
  onWarGame
}: {
  data: AppData;
  onDomainClick: (d: Domain) => void;
  onWarGame: (mode: WarGameMode, targetId?: string) => void;
}) => {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  const segmentData = useMemo(() => {
    if (!selectedSegment) return { allies: [] as string[], enemies: [] as string[], affairs: [], interests: [] as AppData["interests"], entities: [] as string[] };
    const affairs = data.affairs.filter((affair) => {
      const lower = selectedSegment.toLowerCase();
      if (lower === "allies") return (affair.strategy?.mapping?.allies?.length ?? 0) > 0;
      if (lower === "enemies") return (affair.strategy?.mapping?.enemies?.length ?? 0) > 0;
      if (lower === "offense") return (affair.strategy?.posture ?? "").toLowerCase() === "offense";
      if (lower === "defense") return (affair.strategy?.posture ?? "").toLowerCase() !== "offense";
      if (lower === "conventional") return (affair.strategy?.positioning ?? "").toLowerCase().includes("conventional");
      if (lower === "unconventional") return !(affair.strategy?.positioning ?? "").toLowerCase().includes("conventional");
      return true;
    });
    const interests = data.interests.filter((interest) => {
      const lower = selectedSegment.toLowerCase();
      if (lower === "covert") return (interest.perspective ?? "").toLowerCase() === "covert";
      if (lower === "overt") return (interest.perspective ?? "").toLowerCase() !== "covert";
      return true;
    });
    const allies = Array.from(new Set(affairs.flatMap((affair) => affair.strategy?.mapping?.allies ?? [])));
    const enemies = Array.from(new Set(affairs.flatMap((affair) => affair.strategy?.mapping?.enemies ?? [])));
    const entities = Array.from(new Set(affairs.flatMap((affair) => affair.entities ?? []).map((entity) => `${entity.name} (${entity.type ?? "entity"})`)));
    return { allies, enemies, affairs, interests, entities };
  }, [data.affairs, data.interests, selectedSegment]);

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
        linkedAffairsCount: linkedAffairs.length,
        linkedInterestsCount: linkedInterests.length,
        serialAffairs,
        parallelInterests,
        stream:
          linkedAffairs.length >= linkedInterests.length
            ? ("hedge" as const)
            : ("edge" as const)
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AnimatePresence>
        {selectedSegment && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSegment(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass w-full max-w-3xl rounded-2xl relative z-10 overflow-hidden">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
                <h2 className="text-xl font-bold uppercase tracking-widest text-sm">{selectedSegment} Intelligence</h2>
                <button onClick={() => setSelectedSegment(null)} className="p-1 hover:bg-white/10 rounded-full">
                  <X size={18} className="text-zinc-500" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-3 rounded-lg bg-zinc-800/60 border border-white/5 text-center">
                    <div className="text-xs text-zinc-500 uppercase">Affairs</div>
                    <div className="text-lg font-bold">{segmentData.affairs.length}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-800/60 border border-white/5 text-center">
                    <div className="text-xs text-zinc-500 uppercase">Interests</div>
                    <div className="text-lg font-bold">{segmentData.interests.length}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-800/60 border border-white/5 text-center">
                    <div className="text-xs text-zinc-500 uppercase">Allies</div>
                    <div className="text-lg font-bold">{segmentData.allies.length}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-800/60 border border-white/5 text-center">
                    <div className="text-xs text-zinc-500 uppercase">Enemies</div>
                    <div className="text-lg font-bold">{segmentData.enemies.length}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-800/60 border border-white/5 text-center">
                    <div className="text-xs text-zinc-500 uppercase">Entities</div>
                    <div className="text-lg font-bold">{segmentData.entities.length}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Affairs</div>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {segmentData.affairs.length === 0 && <div className="text-xs text-zinc-500 italic">No affairs for this segment.</div>}
                      {segmentData.affairs.map((affair) => (
                        <div key={affair.id} className="p-3 bg-zinc-800/50 rounded-lg border border-white/5">
                          <div className="font-semibold text-sm">{affair.title}</div>
                          <div className="text-[10px] text-zinc-500 uppercase">{affair.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Interests</div>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {segmentData.interests.length === 0 && <div className="text-xs text-zinc-500 italic">No interests for this segment.</div>}
                      {segmentData.interests.map((interest) => (
                        <div key={interest.id} className="p-3 bg-zinc-800/50 rounded-lg border border-white/5">
                          <div className="font-semibold text-sm">{interest.title}</div>
                          <div className="text-[10px] text-zinc-500 uppercase">{interest.perspective ?? "macro"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {(segmentData.allies.length > 0 || segmentData.enemies.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <div className="text-xs uppercase tracking-widest text-emerald-300 mb-2">Allies</div>
                      <div className="text-sm text-emerald-100">{segmentData.allies.join(", ") || "N/A"}</div>
                    </div>
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="text-xs uppercase tracking-widest text-red-300 mb-2">Enemies</div>
                      <div className="text-sm text-red-100">{segmentData.enemies.join(", ") || "N/A"}</div>
                    </div>
                  </div>
                )}

                {segmentData.entities.length > 0 && (
                  <div className="p-3 bg-zinc-800/40 border border-white/5 rounded-lg">
                    <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Linked Entities</div>
                    <div className="text-sm text-zinc-200">{segmentData.entities.join(", ")}</div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <HUD user={data.user} />

      <section className="glass p-6 rounded-2xl border border-red-500/20 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Mission Doctrine</div>
            <h2 className="text-2xl font-bold text-red-300">Mission is not destination. Mission is removing fragility now.</h2>
            <p className="text-sm text-zinc-300 mt-2">
              You are not navigating to comfort. You are sitting on constraints. Mission Command exists to identify current absorbing barriers and organize obligations in a hierarchy that restores robustness before pursuing optionality.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 min-w-[280px]">
            <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/5">
              <div className="text-[10px] uppercase text-zinc-500">Open Fragilities</div>
              <div className="text-xl font-bold">{missionState.openRisks.length}</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/5">
              <div className="text-[10px] uppercase text-zinc-500">Absorbing Barriers</div>
              <div className="text-xl font-bold text-red-400">{missionState.absorbingBarriers.length}</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/5">
              <div className="text-[10px] uppercase text-zinc-500">Affairs = Hedge</div>
              <div className="text-xl font-bold text-blue-300">{missionState.hedgeCount}</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/5">
              <div className="text-[10px] uppercase text-zinc-500">Interests = Edge</div>
              <div className="text-xl font-bold text-emerald-300">{missionState.edgeCount}</div>
            </div>
          </div>
        </div>

        {missionState.unresolvedAffairs.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="text-xs font-semibold text-red-300 uppercase tracking-widest mb-1">Hierarchy Incomplete</div>
            <div className="text-sm text-red-200">
              {missionState.unresolvedAffairs.length} affairs are missing structured mission fields (domain + means + objectives). Restructure these before execution.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5">
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Serial Lane (Must Execute in Order)</div>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {missionState.missionTiers.slice(0, 6).map((tier) => (
                <div key={`${tier.risk.id}-serial`} className="p-3 rounded-lg bg-zinc-950/60 border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Tier {tier.tier}: {tier.risk.title}</div>
                    <span className="text-[10px] font-mono text-red-300">F:{tier.risk.fragilityScore}</span>
                  </div>
                  <div className="text-[10px] uppercase text-zinc-500 mt-1">Obligations</div>
                  <div className="text-xs text-zinc-300">{tier.serialAffairs.join(" | ") || "No linked affairs yet"}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5">
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Parallel Lane (Optionality Expansion)</div>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {missionState.missionTiers.slice(0, 6).map((tier) => (
                <div key={`${tier.risk.id}-parallel`} className="p-3 rounded-lg bg-zinc-950/60 border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Tier {tier.tier}: {tier.risk.title}</div>
                    <span className={cn("text-[10px] font-mono", tier.stream === "hedge" ? "text-blue-300" : "text-emerald-300")}>
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
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <StrategyCircle data={data} onSegmentClick={setSelectedSegment} />
        <FragilityRadar domains={data.domains} affairs={data.affairs} />
        <TaskKillChain tasks={data.tasks} />
      </div>

      <section className="glass p-6 rounded-2xl border border-white/10 mb-8">
        <h3 className="text-lg font-bold mb-4">Path-Dependent Mission Hierarchy</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Fragility Zone</div>
            <div className="text-sm mt-1 text-zinc-200">
              High exposure + dependency + irreversibility with low optionality. Serial obligations dominate here.
            </div>
          </div>
          <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Robustness Zone</div>
            <div className="text-sm mt-1 text-zinc-200">
              Affairs remove acute fragility and increase survival bandwidth. Hedge side of the barbell.
            </div>
          </div>
          <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Antifragility Zone</div>
            <div className="text-sm mt-1 text-zinc-200">
              Interests exploit convexity and long volatility after survival constraints are satisfied. Edge side of the barbell.
            </div>
          </div>
        </div>
        <div className="mt-4 text-sm text-zinc-400">
          Convexity balance (edge share): <span className="text-zinc-200 font-semibold">{missionState.convexityBalance}</span>
        </div>
        <div className="mt-4">
          <button
            onClick={() => onWarGame("mission", "mission-global")}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold uppercase tracking-widest text-white"
          >
            WarGame Mission
          </button>
        </div>
      </section>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MapIcon className="text-blue-400" />
          Macro Domains
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.domains.map((domain) => (
          <DomainCard key={domain.id} domain={domain} onClick={() => onDomainClick(domain)} />
        ))}
      </div>
    </div>
  );
};
