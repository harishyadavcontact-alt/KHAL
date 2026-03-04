import React, { useEffect, useMemo, useState } from "react";
import { Plus, Zap } from "lucide-react";
import { DecisionModal } from "./DecisionModal";
import {
  BlastRadiusSnapshot,
  DoctrineViolationEvent,
  HedgeCoverageCell,
  OptionalityBudgetState,
  Affair,
  BalanceSegment,
  Domain,
  DoctrineRuleDto,
  DoctrineRulebookDto,
  Interest,
  LineageNodeDto,
  LineageRiskDto,
  MissionGraphDto,
  Task,
  UserProfile,
  VolatilitySourceDto,
  WarGameMode
} from "./types";
import { FragilityRadar } from "./FragilityRadar";
import { TaskKillChain } from "./TaskKillChain";
import { WAR_GAME_MODES, WAR_GAME_STAGES, calculateReadiness } from "./war-game-protocol";
import { WarGameVolatility } from "./wargame_volatility";
import { WarGameDomains } from "./wargame_domains";
import { WarGameAffair } from "./wargame_affair";
import { WarGameInterest } from "./wargame_interest";
import { WarGameMission } from "./wargame_mission";
import { WarGameLineage } from "./wargame_lineage";
import { computeAsymmetrySnapshot, computeBarbellGuardrail, computeFragilistaWatchlist } from "../../lib/war-room/operational-metrics";
import { HeatGrid } from "./charts/HeatGrid";
import { FlowLanes } from "./charts/FlowLanes";
import { StackedBalanceBar } from "./charts/StackedBalanceBar";
import { buildWarGamingVisualSnapshot } from "../../lib/war-room/visual-encodings";
import { DualPathScenario } from "./types";
import { DualPathComparator } from "./DualPathComparator";
import { FragilistaWatchlistPanel } from "./maya/FragilistaWatchlistPanel";
import {
  ConfidenceEvidenceStrip,
  CorrelationRiskCard,
  DependencyBlastRadiusPanel,
  DoctrineViolationFeedPanel,
  HedgeCoverageMatrixPanel,
  OptionalityBudgetPanel
} from "./panels/RobustnessPanels";
import { v03Flags } from "../../lib/war-room/feature-flags";

function modeTargetOptions(mode: WarGameMode, data: {
  sources: VolatilitySourceDto[];
  domains: Domain[];
  affairs: Affair[];
  interests: Interest[];
  lineages: LineageNodeDto[];
  missionGraph?: MissionGraphDto;
}) {
  if (mode === "source") return data.sources.map((item) => ({ id: item.id, label: item.name }));
  if (mode === "domain") return data.domains.map((item) => ({ id: item.id, label: item.name }));
  if (mode === "affair") return data.affairs.map((item) => ({ id: item.id, label: item.title }));
  if (mode === "interest") return data.interests.map((item) => ({ id: item.id, label: item.title }));
  if (mode === "lineage") return data.lineages.map((item) => ({ id: item.id, label: `${item.level} - ${item.name}` }));
  const missionIds = new Set<string>(["mission-global"]);
  for (const node of data.missionGraph?.nodes ?? []) missionIds.add(node.missionId);
  return Array.from(missionIds).map((id) => ({ id, label: id }));
}

function readinessPenaltySegments(penalties: {
  missingPredecessorPenalty: number;
  orkPenalty: number;
  kpiPenalty: number;
  thresholdPenalty: number;
  preparationPenalty: number;
  hedgeEdgePenalty: number;
  fragilityPenalty: number;
  doctrinePenalty: number;
}): BalanceSegment[] {
  const segments: BalanceSegment[] = [
    { id: "order", label: "Order", value: penalties.missingPredecessorPenalty, tone: "watch" },
    { id: "ork", label: "ORK", value: penalties.orkPenalty, tone: "risk" },
    { id: "kpi", label: "KPI", value: penalties.kpiPenalty, tone: "risk" },
    { id: "threshold", label: "Threshold", value: penalties.thresholdPenalty, tone: "watch" },
    { id: "prep", label: "Prep", value: penalties.preparationPenalty, tone: "watch" },
    { id: "barbell", label: "Barbell", value: penalties.hedgeEdgePenalty, tone: "risk" },
    { id: "fragility", label: "Fragility", value: penalties.fragilityPenalty, tone: "risk" },
    { id: "doctrine", label: "Doctrine", value: penalties.doctrinePenalty, tone: "watch" }
  ];
  return segments.filter((segment) => segment.value > 0);
}

function scopedPathComparator(args: {
  affairs: Affair[];
  interests: Interest[];
  tasks: Task[];
  lineageRisks: LineageRiskDto[];
  fallback?: DualPathScenario;
}): DualPathScenario {
  const { affairs, interests, tasks, lineageRisks, fallback } = args;
  if (!affairs.length && !interests.length && !tasks.length) {
    return fallback ?? {
      unpreparedScore: 0,
      preparedScore: 0,
      delta: 0,
      ruinRisk: 0,
      survivalOdds: 0,
      timeToImpact: 0,
      resourceBurn: 0,
      criticalNode: "No critical node"
    };
  }

  const openAffairs = affairs.filter((affair) => affair.status !== "done");
  const openRiskMass = openAffairs.reduce((sum, affair) => sum + Number(affair.stakes ?? 0) * Number(affair.risk ?? 0), 0);
  const lineageMass = lineageRisks.filter((risk) => risk.status !== "RESOLVED").reduce((sum, risk) => sum + Number(risk.fragilityScore ?? 0), 0);
  const fragilityMass = openRiskMass + lineageMass;
  const optionalityMass = interests.reduce((sum, interest) => sum + Number(interest.convexity ?? 0) * Number(interest.stakes ?? 0), 0);
  const doneTasks = tasks.filter((task) => task.status === "done").length;
  const inProgress = tasks.filter((task) => task.status === "in_progress").length;
  const executionVelocity = tasks.length ? ((doneTasks + inProgress * 0.5) / tasks.length) * 100 : 0;

  const fragilityNorm = Math.max(0, Math.min(100, (fragilityMass / Math.max(1, affairs.length * 100)) * 100));
  const convexityNorm = Math.max(0, Math.min(100, (optionalityMass / Math.max(1, interests.length * 100)) * 100));
  const ruinRisk = Math.max(0, Math.min(100, fragilityNorm * 0.55 + (100 - executionVelocity) * 0.3 + (100 - convexityNorm) * 0.15));
  const survivalOdds = Math.max(0, Math.min(100, 100 - ruinRisk + convexityNorm * 0.2));
  const unpreparedScore = Number(ruinRisk.toFixed(2));
  const preparedScore = Number(Math.max(0, Math.min(100, (100 - ruinRisk) * 0.5 + convexityNorm * 0.25 + executionVelocity * 0.25)).toFixed(2));
  const delta = Number((preparedScore - unpreparedScore).toFixed(2));
  const timeToImpact = tasks.some((task) => task.horizon === "WEEK" && task.status !== "done") ? 7 : 30;
  const resourceBurn = Number(Math.max(0, Math.min(100, 50 + fragilityNorm * 0.4 - executionVelocity * 0.2)).toFixed(2));
  const criticalAffair = [...openAffairs].sort((left, right) => Number((right.stakes ?? 0) * (right.risk ?? 0)) - Number((left.stakes ?? 0) * (left.risk ?? 0)))[0];

  return {
    unpreparedScore,
    preparedScore,
    delta,
    ruinRisk: Number(ruinRisk.toFixed(2)),
    survivalOdds: Number(survivalOdds.toFixed(2)),
    timeToImpact,
    resourceBurn,
    criticalNode: criticalAffair?.title ?? fallback?.criticalNode ?? "No critical node"
  };
}

export const WarGaming = ({
  user,
  domains,
  sources,
  lineages,
  affairs,
  interests,
  tasks,
  lineageRisks,
  missionGraph,
  doctrine,
  initialMode,
  initialTargetId,
  confidence,
  protocolState,
  blastRadius,
  hedgeCoverage,
  violationFeed,
  optionalityBudget,
  onContextChange,
  onAddTask
}: {
  user: UserProfile;
  domains: Domain[];
  sources: VolatilitySourceDto[];
  lineages: LineageNodeDto[];
  affairs: Affair[];
  interests: Interest[];
  tasks: Task[];
  lineageRisks: LineageRiskDto[];
  missionGraph?: MissionGraphDto;
  doctrine?: {
    rulebooks: DoctrineRulebookDto[];
    rules: DoctrineRuleDto[];
  };
  initialMode?: WarGameMode;
  initialTargetId?: string;
  confidence?: { confidence: "HIGH" | "MEDIUM" | "LOW"; evidenceCount: number; recencyMinutes: number };
  protocolState?: "NOMINAL" | "WATCH" | "CRITICAL" | string;
  blastRadius?: BlastRadiusSnapshot;
  hedgeCoverage?: HedgeCoverageCell[];
  violationFeed?: DoctrineViolationEvent[];
  optionalityBudget?: OptionalityBudgetState;
  onContextChange?: (mode: WarGameMode, targetId?: string) => void;
  onAddTask: (task: any) => Promise<void> | void;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [lineageFilter, setLineageFilter] = useState<string>("all");
  const [mode, setMode] = useState<WarGameMode>(initialMode ?? "affair");

  const modeTargets = useMemo(
    () => modeTargetOptions(mode, { sources, domains, affairs, interests, lineages, missionGraph }),
    [affairs, domains, interests, lineages, missionGraph, mode, sources]
  );
  const [modeTargetId, setModeTargetId] = useState<string>(initialTargetId ?? modeTargets[0]?.id ?? "");

  useEffect(() => {
    setMode(initialMode ?? "affair");
  }, [initialMode]);

  useEffect(() => {
    if (initialTargetId) {
      setModeTargetId(initialTargetId);
      return;
    }
    setModeTargetId((prev) => {
      if (prev && modeTargets.some((target) => target.id === prev)) return prev;
      return modeTargets[0]?.id ?? "";
    });
  }, [initialTargetId, modeTargets]);

  useEffect(() => {
    onContextChange?.(mode, modeTargetId);
  }, [mode, modeTargetId, onContextChange]);

  const domainById = new Map(domains.map((domain) => [domain.id, domain]));

  const filteredRisks = useMemo(
    () =>
      lineageRisks.filter((risk) => {
        if (sourceFilter !== "all" && risk.sourceId !== sourceFilter) return false;
        if (domainFilter !== "all" && risk.domainId !== domainFilter) return false;
        if (lineageFilter !== "all" && risk.lineageNodeId !== lineageFilter) return false;
        return true;
      }),
    [domainFilter, lineageFilter, lineageRisks, sourceFilter]
  );

  const riskDomainIds = new Set(filteredRisks.map((risk) => risk.domainId));
  const filteredDomains = domains.filter((domain) => (domainFilter === "all" ? riskDomainIds.size === 0 || riskDomainIds.has(domain.id) : domain.id === domainFilter));
  const filteredAffairs = affairs.filter((affair) => (domainFilter === "all" ? true : affair.domainId === domainFilter));
  const filteredTasks = tasks.filter((task) => (domainFilter === "all" ? true : task.domainId === domainFilter));

  const obligationsCount = filteredAffairs.length;
  const optionsCount = interests.filter((interest) => (domainFilter === "all" ? true : interest.domainId === domainFilter)).length;
  const hedgeCount = obligationsCount;
  const edgeCount = optionsCount;
  const antifragilePotential = Number((optionsCount / Math.max(1, obligationsCount + optionsCount)).toFixed(2));

  const sourceRows = useMemo(
    () =>
      (sources ?? []).map((source) => ({
        ...source,
        riskCount: lineageRisks.filter((risk) => risk.sourceId === source.id).length
      })),
    [lineageRisks, sources]
  );

  const targetReadinessPreview = useMemo(() => {
    const hasHedgeEdge = mode === "domain"
      ? Boolean(domains.find((domain) => domain.id === modeTargetId)?.hedge && domains.find((domain) => domain.id === modeTargetId)?.edge)
      : mode === "affair"
        ? true
        : mode === "interest"
          ? true
          : true;
    const hasFragilityProfile = mode === "domain"
      ? Boolean(domains.find((domain) => domain.id === modeTargetId)?.fragilityText)
      : mode !== "mission";
    return calculateReadiness({
      mode,
      completedStages: ["A", "B", "C"],
      orkCount: mode === "affair" ? affairs.find((affair) => affair.id === modeTargetId)?.plan?.objectives?.length ?? 0 : mode === "interest" ? interests.find((interest) => interest.id === modeTargetId)?.objectives?.length ?? 0 : 0,
      kpiCount: 0,
      hasThresholds: false,
      hasPreparation: false,
      hasHedgeEdge,
      hasFragilityProfile,
      hasSkinInGame: false,
      hasOmissionCadence: mode !== "affair",
      hasBetExpiry: mode !== "interest",
      unresolvedHardGateRules: 0,
      noRuinGate: false,
      ergodicityGate: false,
      metricLimitGate: false
    });
  }, [affairs, domains, interests, mode, modeTargetId]);

  const operationalSnapshot = useMemo(
    () => computeBarbellGuardrail({ affairs, interests, tasks, lineageRisks, domains }),
    [affairs, domains, interests, lineageRisks, tasks]
  );
  const asymmetrySnapshot = useMemo(
    () => computeAsymmetrySnapshot({ affairs, interests, tasks, lineageRisks, domains }),
    [affairs, domains, interests, lineageRisks, tasks]
  );
  const visualSnapshot = useMemo(() => {
    const scopedSources = sourceFilter === "all" ? sources : sources.filter((source) => source.id === sourceFilter);
    const scopedDomains = domainFilter === "all" ? domains : domains.filter((domain) => domain.id === domainFilter);
    const scopedAffairs = domainFilter === "all" ? affairs : affairs.filter((affair) => affair.domainId === domainFilter);
    const scopedInterests = domainFilter === "all" ? interests : interests.filter((interest) => interest.domainId === domainFilter);
    const scopedTasks = domainFilter === "all" ? tasks : tasks.filter((task) => task.domainId === domainFilter);
    return buildWarGamingVisualSnapshot({
      sources: scopedSources,
      domains: scopedDomains,
      affairs: scopedAffairs,
      interests: scopedInterests,
      tasks: scopedTasks,
      lineageRisks: filteredRisks
    });
  }, [affairs, domainFilter, domains, filteredRisks, interests, sourceFilter, sources, tasks]);
  const penaltySegments = useMemo(() => readinessPenaltySegments(targetReadinessPreview.penalties), [targetReadinessPreview.penalties]);
  const dualPath = useMemo(
    () =>
      scopedPathComparator({
        affairs: filteredAffairs.length ? filteredAffairs : affairs,
        interests: interests.filter((interest) => (domainFilter === "all" ? true : interest.domainId === domainFilter)),
        tasks: filteredTasks.length ? filteredTasks : tasks,
        lineageRisks: filteredRisks,
        fallback: undefined
      }),
    [affairs, domainFilter, filteredAffairs, filteredRisks, filteredTasks, interests, tasks]
  );
  const fragilistaItems = useMemo(() => {
    const scopedSources = sourceFilter === "all" ? sources : sources.filter((source) => source.id === sourceFilter);
    const scopedDomains = filteredDomains.length ? filteredDomains : domains;
    const scopedInterests = interests.filter((interest) => (domainFilter === "all" ? true : interest.domainId === domainFilter));
    const scopedData = {
      user,
      strategyMatrix: {
        allies: 0,
        enemies: 0,
        overt: 0,
        covert: 0,
        offense: 0,
        defense: 0,
        conventional: 0,
        unconventional: 0
      },
      laws: [],
      domains: scopedDomains,
      crafts: [],
      interests: scopedInterests,
      affairs: filteredAffairs.length ? filteredAffairs : affairs,
      tasks: filteredTasks.length ? filteredTasks : tasks,
      sources: scopedSources,
      missionGraph: missionGraph ?? { nodes: [], dependencies: [] },
      lineages: { nodes: lineages, entities: [] },
      lineageRisks: filteredRisks,
      doctrine: { rulebooks: [], rules: [], domainPnLLadders: [] }
    };
    return computeFragilistaWatchlist(scopedData, 6);
  }, [affairs, domainFilter, domains, filteredAffairs, filteredDomains, filteredRisks, filteredTasks, interests, lineages, missionGraph, sourceFilter, sources, tasks, user]);
  const concentrationPct = useMemo(() => {
    const active = interests.filter((interest) => (domainFilter === "all" ? true : interest.domainId === domainFilter));
    if (!active.length) return 0;
    const byDomain = new Map<string, number>();
    for (const item of active) {
      byDomain.set(item.domainId, (byDomain.get(item.domainId) ?? 0) + 1);
    }
    const maxBucket = Math.max(...Array.from(byDomain.values()));
    return (maxBucket / active.length) * 100;
  }, [domainFilter, interests]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {v03Flags.confidence && <ConfidenceEvidenceStrip confidence={confidence} protocolState={protocolState} />}
      <DecisionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={mode}
        targetId={modeTargetId}
        domains={domains}
        sources={sources}
        lineages={lineages}
        affairs={affairs}
        interests={interests}
        missionGraph={missionGraph}
        doctrine={doctrine}
        onSave={onAddTask}
      />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Zap className="text-amber-400" />
          War Gaming
        </h1>
        <div className="hidden lg:block text-[10px] uppercase tracking-widest text-zinc-500 font-mono">War Gaming Chamber</div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors text-white">
          <Plus className="w-5 h-5" />
          Start WarGame Protocol
        </button>
      </div>

      <div className="glass p-6 rounded-xl border border-white/10 mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold">WarGame Protocol</h2>
            <p className="text-sm text-zinc-400 mt-1">Mode-specific protocol with shared scoring and gate logic.</p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-2">Strategic Posture (8 Fronts)</p>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">soft order + hard execute gates</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-4">
          <div className="rounded-lg border border-white/10 bg-zinc-900/40 px-3 py-2">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Barbell split</div>
            <div className="text-xs font-semibold text-zinc-200 mt-1">
              hedge {operationalSnapshot.hedgePct}% | edge {operationalSnapshot.edgePct}%
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-zinc-900/40 px-3 py-2">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Guardrail</div>
            <div className="mt-1">
              <span
                className={
                  operationalSnapshot.fragileMiddle
                    ? "rounded-full border border-red-400/40 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-red-300"
                    : "rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-emerald-300"
                }
              >
                {operationalSnapshot.fragileMiddle ? "Fragile middle" : "Barbell polarized"}
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-zinc-900/40 px-3 py-2">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Asymmetry</div>
            <div className="text-xs font-semibold text-zinc-200 mt-1">
              band {asymmetrySnapshot.band} | balance {asymmetrySnapshot.balance}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Protocol Mode</label>
            <select className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm" value={mode} onChange={(event) => setMode(event.target.value as WarGameMode)}>
              {WAR_GAME_MODES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Protocol Target</label>
            <select className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm" value={modeTargetId} onChange={(event) => setModeTargetId(event.target.value)}>
              {modeTargets.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.label}
                </option>
              ))}
            </select>
          </div>
          <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-lg">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Readiness Preview</div>
            <div className="text-2xl font-bold">{targetReadinessPreview.score}</div>
            <div className="text-xs text-zinc-400">{targetReadinessPreview.band.toUpperCase()} - penalty {targetReadinessPreview.penalties.totalPenalty}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {(() => {
            const activeRulebooks = (doctrine?.rulebooks ?? []).filter((rulebook) => rulebook.active);
            const globalRulebookIds = new Set(
              activeRulebooks
                .filter((rulebook) => rulebook.scopeType === "GLOBAL" && rulebook.scopeRef === "all")
                .map((rulebook) => rulebook.id)
            );
            const modeRulebookIds = new Set(
              activeRulebooks
                .filter((rulebook) => rulebook.scopeType === "MODE" && rulebook.scopeRef === mode)
                .map((rulebook) => rulebook.id)
            );
            const globalRules = (doctrine?.rules ?? []).filter((rule) => rule.active && globalRulebookIds.has(rule.rulebookId));
            const modeRules = (doctrine?.rules ?? []).filter((rule) => rule.active && modeRulebookIds.has(rule.rulebookId));
            const hardGates = [...globalRules, ...modeRules].filter((rule) => rule.severity === "HARD_GATE");
            return (
              <>
                <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">Global Rules Active</div>
                  <div className="text-lg font-bold text-zinc-200 mt-1">{globalRules.length}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">Mode Rules Active</div>
                  <div className="text-lg font-bold text-zinc-200 mt-1">{modeRules.length}</div>
                </div>
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-red-300">Hard Gates</div>
                  <div className="text-lg font-bold text-red-300 mt-1">{hardGates.length}</div>
                </div>
              </>
            );
          })()}
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-2">
          {WAR_GAME_STAGES.map((stage) => (
            <div key={stage.id} className="p-2 rounded-lg bg-zinc-900/40 border border-white/10">
              <div className="text-[10px] font-bold text-zinc-300">{stage.id}</div>
              <div className="text-[10px] text-zinc-500 mt-1">{stage.title}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4 mb-8">
        <DualPathComparator scenario={dualPath} />
        <FragilistaWatchlistPanel items={fragilistaItems} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-8">
        {v03Flags.blastRadius && <DependencyBlastRadiusPanel snapshot={blastRadius} />}
        <HedgeCoverageMatrixPanel cells={hedgeCoverage} />
        <DoctrineViolationFeedPanel events={violationFeed} />
      </div>
      <div className="mb-8">
        <CorrelationRiskCard concentrationPct={concentrationPct} />
      </div>

      {mode === "source" && (
        <WarGameVolatility sourceId={modeTargetId} sources={sources} domains={domains} lineages={lineages} lineageRisks={lineageRisks} />
      )}
      {mode === "domain" && <WarGameDomains domainId={modeTargetId} domains={domains} affairs={affairs} interests={interests} lineageRisks={lineageRisks} />}
      {mode === "affair" && <WarGameAffair affairId={modeTargetId} affairs={affairs} domains={domains} />}
      {mode === "interest" && <WarGameInterest interestId={modeTargetId} interests={interests} affairs={affairs} />}
      {mode === "mission" && <WarGameMission missionId={modeTargetId} missionGraph={missionGraph} affairs={affairs} interests={interests} />}
      {mode === "lineage" && <WarGameLineage lineageNodeId={modeTargetId} lineages={lineages} lineageRisks={lineageRisks} />}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm">
          <option value="all">All Sources</option>
          {sourceRows.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>
        <select value={domainFilter} onChange={(event) => setDomainFilter(event.target.value)} className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm">
          <option value="all">All Domains</option>
          {domains.map((domain) => (
            <option key={domain.id} value={domain.id}>
              {domain.name}
            </option>
          ))}
        </select>
        <select value={lineageFilter} onChange={(event) => setLineageFilter(event.target.value)} className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm">
          <option value="all">All Lineages</option>
          {lineages.map((lineage) => (
            <option key={lineage.id} value={lineage.id}>
              {lineage.level} - {lineage.name}
            </option>
          ))}
        </select>
        <div className="glass rounded-lg px-3 py-2 border border-white/10 text-xs">
          <div className="uppercase tracking-widest text-zinc-500">Operator Time Axis</div>
          <div className="font-semibold">{user.name}</div>
          <div className="text-zinc-400">
            {user.birthDate.slice(0, 10)} {"->"} horizon deployment
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="glass p-6 rounded-xl border border-white/10">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-bold">Quadrant HeatGrid</h3>
              <p className="text-xs text-zinc-400 mt-1">Randomness x impact from open risks.</p>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">{filteredRisks.length} open risks</div>
          </div>
          <HeatGrid
            columns={visualSnapshot.quadrantColumns}
            rows={visualSnapshot.quadrantRows}
            cells={visualSnapshot.quadrantCells}
            emptyText="No open risks to map."
          />
        </div>
        <div className="glass p-6 rounded-xl border border-white/10">
          <div className="mb-4">
            <h3 className="text-lg font-bold">Source Volatility Flow</h3>
            <p className="text-xs text-zinc-400 mt-1">Current source lanes into CAVE vs CONVEX.</p>
          </div>
          <FlowLanes
            nodes={visualSnapshot.sourceNodes}
            lanes={visualSnapshot.sourceLanes}
            links={visualSnapshot.sourceLinks}
            height={230}
            emptyText="No source flow available."
          />
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Readiness Penalty Profile</div>
            <StackedBalanceBar segments={penaltySegments.length ? penaltySegments : visualSnapshot.penaltySegments} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <FragilityRadar domains={filteredDomains.length ? filteredDomains : domains} affairs={filteredAffairs.length ? filteredAffairs : affairs} />
        <TaskKillChain tasks={filteredTasks.length ? filteredTasks : tasks} />
        <div className="glass p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-bold mb-4">Risk Logic Continuum</h3>
          <div className="space-y-4 text-sm">
            <StackedBalanceBar
              segments={[
                { id: "hedge", label: `Obligations ${hedgeCount}`, value: hedgeCount, tone: "hedge" },
                { id: "edge", label: `Options ${edgeCount}`, value: edgeCount, tone: "edge" }
              ]}
            />
            <div className="p-3 bg-zinc-900/50 rounded-lg border border-white/5">
              <div className="text-[10px] uppercase text-zinc-500 mb-1">Convexity Bias</div>
              <div className="font-semibold">Antifragile potential {antifragilePotential}</div>
              <div className="text-xs text-zinc-400 mt-1">
                {operationalSnapshot.fragileMiddle ? "Reduce middle concentration." : "Barbell posture is polarized."}
              </div>
            </div>
            <div className="p-3 bg-zinc-900/50 rounded-lg border border-white/5">
              <div className="text-[10px] uppercase text-zinc-500 mb-1">Asymmetry</div>
              <div className="font-semibold">
                {asymmetrySnapshot.band} | balance {asymmetrySnapshot.balance}
              </div>
            </div>
          </div>
        </div>
      </div>

      {v03Flags.optionality && (
        <div className="mb-8">
          <OptionalityBudgetPanel state={optionalityBudget} />
        </div>
      )}

      <div className="glass p-6 rounded-xl border border-white/10 mb-8">
        <h3 className="text-lg font-bold mb-4">Source of Volatility Register</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sourceRows.map((source) => (
            <button
              key={source.id}
              onClick={() => setSourceFilter(source.id)}
              className={`text-left p-3 rounded-lg border transition-colors ${
                sourceFilter === source.id ? "bg-blue-500/15 border-blue-500/40" : "bg-zinc-900/50 border-white/5 hover:border-blue-500/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">{source.name}</div>
                <div className="text-[10px] font-mono text-zinc-500">{source.riskCount} risks</div>
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                {(source.domains ?? [])
                  .map((link) => domainById.get(link.domainId)?.name ?? link.domainId)
                  .slice(0, 3)
                  .join(", ") || "No linked domains"}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
