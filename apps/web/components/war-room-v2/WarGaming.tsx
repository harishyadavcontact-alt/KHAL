import React, { useEffect, useMemo, useState } from "react";
import { Activity, Plus, Shield, Sword, Zap } from "lucide-react";
import { DecisionModal } from "./DecisionModal";
import {
  Affair,
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

const EXECUTIVE_RISK_REVIEW = [
  {
    id: "imperative",
    title: "1. Strategic Imperative: Survival First",
    body: "Survival is the foundational metric of rationality. Without survival, long-term optimization is void.",
    points: [
      "Knowledge must stay grounded in reality.",
      "Skin in the game over credential certainty.",
      "Treat second-order interactions as first-class."
    ]
  },
  {
    id: "ergodicity",
    title: "2. Ergodicity Gap: Ensemble vs Time",
    body: "Do not apply ensemble averages to path-dependent actors with uncle points.",
    points: ["Ensemble averages are not time-path survival.", "Sequence can terminate the game.", "Ruin breaks expected-value reasoning."]
  },
  {
    id: "ruin",
    title: "3. Ruin Asymmetry",
    body: "Ruin is an absorbing barrier, not a normal downside variable.",
    points: ["No-ruin gate before optimization.", "Tail-magnitude uncertainty dominates precision claims.", "Clip tails before forecasting upside."]
  },
  {
    id: "agency",
    title: "4. Agency Asymmetry",
    body: "Hidden tail transfer creates institutional fragility and learning failure.",
    points: ["Prevent heads-I-win/tails-system-pays behavior.", "Tie decisions to consequence-bearing accountability.", "Avoid metric gaming as strategy."]
  },
  {
    id: "precaution",
    title: "5. Layered Precaution",
    body: "Manage risk across hierarchy layers from self to ecosystem.",
    points: ["Layered survival dominates local optimization.", "Repeated small ruin probabilities compound.", "Courage and prudence align via layer protection."]
  }
] as const;

const FOURTH_QUADRANT_MAP = [
  { id: "q1", quadrant: "Q1", decision: "M0 binary", randomness: "Mediocristan", rule: "Classical stats generally valid." },
  { id: "q2", quadrant: "Q2", decision: "M0 binary", randomness: "Extremistan", rule: "Tail awareness required." },
  { id: "q3", quadrant: "Q3", decision: "M1+ impact", randomness: "Mediocristan", rule: "Conservative stats can work." },
  { id: "q4", quadrant: "Q4", decision: "M1+ impact", randomness: "Extremistan", rule: "Do not optimize on model precision." }
] as const;

const PHRONETIC_RULES = [
  "No-ruin first: absorbing barrier risk dominates expected value.",
  "Prefer redundancy over optimization in fragile systems.",
  "Avoid remote-payoff precision claims in fat tails.",
  "Reject volatility-only stability narratives.",
  "Separate affairs (hedge) and interests (edge) explicitly."
] as const;

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
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

      <div className="glass p-6 rounded-xl border border-white/10 mb-8">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold">Executive Risk Review</h2>
            <p className="text-sm text-zinc-400 mt-1">Reference doctrine for in-decision rigor.</p>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Survival is rationality</div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {EXECUTIVE_RISK_REVIEW.map((section) => (
            <section key={section.id} className="p-4 bg-zinc-900/50 rounded-lg border border-white/5">
              <h3 className="text-sm font-bold text-zinc-100 mb-2">{section.title}</h3>
              <p className="text-xs text-zinc-300 leading-relaxed mb-3">{section.body}</p>
              <ul className="space-y-1">
                {section.points.map((point) => (
                  <li key={point} className="text-xs text-zinc-400">
                    - {point}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-bold mb-4">Fourth Quadrant Map</h3>
          <div className="space-y-2">
            {FOURTH_QUADRANT_MAP.map((row) => (
              <div key={row.id} className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">{row.quadrant}</span>
                  <span className="text-[10px] uppercase text-zinc-500">{row.randomness}</span>
                </div>
                <div className="text-xs text-zinc-300">{row.decision}</div>
                <div className="text-xs text-zinc-400 mt-1">{row.rule}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-bold mb-4">Mathematical Guardrails</h3>
          <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5 mb-3">
            <div className="text-[10px] uppercase text-zinc-500 mb-1">Ruin-first asymmetry</div>
            <div className="text-xs text-zinc-300">No-ruin condition is mandatory before expected-value optimization.</div>
          </div>
          <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5 mb-3">
            <div className="text-[10px] uppercase text-zinc-500 mb-1">Ergodicity test</div>
            <div className="text-xs text-zinc-300">Do not use ensemble averages for path-dependent exposures with uncle points.</div>
          </div>
          <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
            <div className="text-[10px] uppercase text-zinc-500 mb-1">Tail humility</div>
            <div className="text-xs text-zinc-300">Inverse problem and pre-asymptotic error make remote precision claims fragile.</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <FragilityRadar domains={filteredDomains.length ? filteredDomains : domains} affairs={filteredAffairs.length ? filteredAffairs : affairs} />
        <TaskKillChain tasks={filteredTasks.length ? filteredTasks : tasks} />
        <div className="glass p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield className="text-blue-400" />
            Risk Logic Continuum
          </h3>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-zinc-900/50 rounded-lg border border-white/5">
              <div className="text-[10px] uppercase text-zinc-500 mb-1">Affairs = Obligations (Hedge)</div>
              <div className="font-semibold">{hedgeCount} active obligations driving fragility {"->"} robustness</div>
            </div>
            <div className="p-3 bg-zinc-900/50 rounded-lg border border-white/5">
              <div className="text-[10px] uppercase text-zinc-500 mb-1">Interests = Options (Edge)</div>
              <div className="font-semibold">{edgeCount} options driving robustness {"->"} antifragility</div>
            </div>
            <div className="p-3 bg-zinc-900/50 rounded-lg border border-white/5">
              <div className="text-[10px] uppercase text-zinc-500 mb-1">Convexity Bias</div>
              <div className="font-semibold">Antifragile potential {antifragilePotential}</div>
              <div className="text-xs text-zinc-400 mt-1">Goal: positive convexity across domains, lineages, and sources.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-xl border border-white/10 mb-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Sword className="text-emerald-400" />
          Source of Volatility Register
        </h3>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass p-6 rounded-xl">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="text-blue-400" />
            Jensen's Inequality in Deployment
          </h3>
          <p className="text-sm text-zinc-300">Affairs remove fragility and secure survivability; interests add convex options. Volatility should improve upside without violating no-ruin constraints.</p>
        </div>
        <div className="glass p-6 rounded-xl">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="text-amber-400" />
            Short Vol vs Long Vol
          </h3>
          <p className="text-sm text-zinc-300">Hedge obligations absorb short-vol shocks. Edge options harvest long-vol asymmetry. Keep the barbell explicit in each protocol run.</p>
        </div>
      </div>

      <div className="glass p-6 rounded-xl border border-white/10 mt-8">
        <h3 className="text-lg font-bold mb-4">Phronetic Rules (Decision Ops)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {PHRONETIC_RULES.map((rule) => (
            <div key={rule} className="text-xs text-zinc-300 p-2 bg-zinc-900/40 rounded border border-white/5">
              {rule}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
