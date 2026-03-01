import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, Zap } from "lucide-react";
import { motion } from "motion/react";
import { Affair, DoctrineRuleDto, DoctrineRulebookDto, Domain, Interest, LineageNodeDto, MissionGraphDto, ProtocolExtrasDto, VolatilitySourceDto, WarGameMode } from "./types";
import { cn } from "./utils";
import { WAR_GAME_STAGES, calculateReadiness, modeToPlanSourceType } from "./war-game-protocol";

const STAGE_COUNT = WAR_GAME_STAGES.length;

type KpiInput = { name: string; target?: string; current?: string; unit?: string };

function modeLabel(mode: WarGameMode): string {
  if (mode === "source") return "Source WarGame";
  if (mode === "domain") return "Domain WarGame";
  if (mode === "affair") return "Affair WarGame";
  if (mode === "interest") return "Interest WarGame";
  if (mode === "mission") return "Mission WarGame";
  return "Lineage WarGame";
}

export const DecisionModal = ({
  isOpen,
  onClose,
  mode,
  targetId,
  domains,
  sources,
  lineages,
  affairs,
  interests,
  missionGraph,
  doctrine,
  onSave
}: {
  isOpen: boolean;
  onClose: () => void;
  mode: WarGameMode;
  targetId?: string;
  domains: Domain[];
  sources: VolatilitySourceDto[];
  lineages: LineageNodeDto[];
  affairs: Affair[];
  interests: Interest[];
  missionGraph?: MissionGraphDto;
  doctrine?: {
    rulebooks: DoctrineRulebookDto[];
    rules: DoctrineRuleDto[];
  };
  onSave: (task: any) => Promise<void> | void;
}) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [objectiveInput, setObjectiveInput] = useState("");
  const [kpiDraft, setKpiDraft] = useState<KpiInput>({ name: "", target: "", current: "", unit: "" });
  const [betDraft, setBetDraft] = useState({ title: "", thesis: "", maxLoss: "", expiry: "" });

  const missionIds = useMemo(() => {
    const ids = new Set<string>();
    for (const node of missionGraph?.nodes ?? []) ids.add(node.missionId);
    ids.add("mission-global");
    return Array.from(ids);
  }, [missionGraph?.nodes]);

  const modeTargets = useMemo(() => {
    if (mode === "source") return sources.map((item) => ({ id: item.id, label: item.name }));
    if (mode === "domain") return domains.map((item) => ({ id: item.id, label: item.name }));
    if (mode === "affair") return affairs.map((item) => ({ id: item.id, label: item.title }));
    if (mode === "interest") return interests.map((item) => ({ id: item.id, label: item.title }));
    if (mode === "mission") return missionIds.map((id) => ({ id, label: id }));
    return lineages.map((item) => ({ id: item.id, label: `${item.level} - ${item.name}` }));
  }, [affairs, domains, interests, lineages, missionIds, mode, sources]);

  const [formData, setFormData] = useState(() => ({
    mode,
    targetId: targetId ?? modeTargets[0]?.id ?? "",
    title: "",
    sourceId: sources[0]?.id ?? "",
    domainId: domains[0]?.id ?? "",
    lineageNodeId: lineages[0]?.id ?? "ln-self",
    actorType: "personal" as "personal" | "private" | "public",
    type: "interest",
    upside: "",
    downside: "",
    cadence: "weekly",
    targetDate: "",
    priority: 50,
    objectives: [] as string[],
    kpis: [] as KpiInput[],
    thresholdNotes: "",
    preparationNotes: "",
    contextNarrative: "",
    fragilityNarrative: "",
    meansText: "",
    endsText: "",
    hedgeText: "",
    edgeText: "",
    riskRewardSummary: "",
    concavity: "neutral" as "concave" | "neutral" | "convex",
    shortVol: false,
    longVol: true,
    exposure: 5,
    dependency: 5,
    irreversibility: 5,
    optionality: 5,
    responseTime: 7,
    riskStatus: "INCOMPLETE" as "OPEN" | "MITIGATING" | "RESOLVED" | "INCOMPLETE",
    riskNotes: "",
    missionSerialRefs: "",
    missionParallelRefs: "",
    missionDependencyNotes: "",
    skinCapitalAtRisk: "",
    skinTimeAtRisk: "",
    skinReputationAtRisk: "",
    skinBreachPenalty: "",
    omissionCadence: "" as "" | "daily" | "weekly" | "monthly",
    omissionReminder: "",
    domainPnlFragilityRemoved: "",
    domainPnlRobustnessGained: "",
    domainPnlOptionalityCreated: "",
    bets: [] as Array<{ title: string; thesis?: string; maxLoss?: string; expiry?: string }>,
    ruleChecks: {} as Record<string, { passed: boolean; note?: string }>,
    policyAcknowledgements: [] as string[],
    noRuinGate: false,
    ergodicityGate: false,
    metricLimitGate: false,
    jensenGate: false,
    barbellGate: false
  }));

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setError(null);
      setSaving(false);
      setObjectiveInput("");
      setKpiDraft({ name: "", target: "", current: "", unit: "" });
      setBetDraft({ title: "", thesis: "", maxLoss: "", expiry: "" });
      return;
    }
    const defaultTarget = targetId ?? modeTargets[0]?.id ?? "";
    setFormData((prev) => ({
      ...prev,
      mode,
      targetId: defaultTarget,
      sourceId: mode === "source" ? defaultTarget : prev.sourceId,
      domainId: mode === "domain" ? defaultTarget : prev.domainId,
      lineageNodeId: mode === "lineage" ? defaultTarget : prev.lineageNodeId
    }));
  }, [isOpen, mode, modeTargets, targetId]);

  const activeDoctrineRules = useMemo(() => {
    const rulebooks = (doctrine?.rulebooks ?? []).filter((item) => item.active);
    const globalIds = new Set(rulebooks.filter((item) => item.scopeType === "GLOBAL" && item.scopeRef === "all").map((item) => item.id));
    const modeIds = new Set(rulebooks.filter((item) => item.scopeType === "MODE" && item.scopeRef === mode).map((item) => item.id));
    return (doctrine?.rules ?? [])
      .filter((rule) => rule.active && (globalIds.has(rule.rulebookId) || modeIds.has(rule.rulebookId)))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [doctrine?.rulebooks, doctrine?.rules, mode]);

  const barrierRules = useMemo(() => activeDoctrineRules.filter((rule) => rule.kind === "BARRIER"), [activeDoctrineRules]);
  const checklistRules = useMemo(() => activeDoctrineRules.filter((rule) => rule.kind !== "BARRIER"), [activeDoctrineRules]);

  useEffect(() => {
    setFormData((prev) => {
      const nextChecks: Record<string, { passed: boolean; note?: string }> = {};
      for (const rule of activeDoctrineRules) {
        nextChecks[rule.id] = prev.ruleChecks[rule.id] ?? { passed: false, note: "" };
      }
      const nextPolicies = prev.policyAcknowledgements.filter((id) => nextChecks[id]);
      return {
        ...prev,
        ruleChecks: nextChecks,
        policyAcknowledgements: nextPolicies
      };
    });
  }, [activeDoctrineRules]);

  const stageCompletion = useMemo(() => {
    const stageA = Boolean(formData.targetId && formData.title.trim());
    const stageB = Boolean(formData.fragilityNarrative.trim() && formData.riskRewardSummary.trim());
    const stageC = Boolean(formData.meansText.trim() && formData.endsText.trim() && formData.hedgeText.trim() && formData.edgeText.trim());
    const stageD = Boolean(formData.preparationNotes.trim() || formData.thresholdNotes.trim() || formData.objectives.length > 0 || formData.kpis.length > 0);
    const stageE = Boolean(formData.noRuinGate && formData.ergodicityGate && formData.metricLimitGate);
    const completed: Array<"A" | "B" | "C" | "D" | "E"> = [];
    if (stageA) completed.push("A");
    if (stageB) completed.push("B");
    if (stageC) completed.push("C");
    if (stageD) completed.push("D");
    if (stageE) completed.push("E");
    return completed;
  }, [formData]);

  const readiness = useMemo(
    () =>
      calculateReadiness({
        mode,
        completedStages: stageCompletion,
        orkCount: formData.objectives.length,
        kpiCount: formData.kpis.length,
        hasThresholds: Boolean(formData.thresholdNotes.trim()),
        hasPreparation: Boolean(formData.preparationNotes.trim()),
        hasHedgeEdge: Boolean(formData.hedgeText.trim() && formData.edgeText.trim()),
        hasFragilityProfile: Boolean(formData.fragilityNarrative.trim() || formData.riskRewardSummary.trim()),
        hasSkinInGame: Boolean(formData.skinCapitalAtRisk.trim() || formData.skinTimeAtRisk.trim() || formData.skinReputationAtRisk.trim() || formData.skinBreachPenalty.trim()),
        hasOmissionCadence: mode !== "affair" || Boolean(formData.omissionCadence),
        hasBetExpiry: mode !== "interest" || formData.bets.some((bet) => Boolean(bet.expiry?.trim())),
        unresolvedHardGateRules: activeDoctrineRules.filter((rule) => rule.severity === "HARD_GATE" && !formData.ruleChecks[rule.id]?.passed).length,
        noRuinGate: formData.noRuinGate,
        ergodicityGate: formData.ergodicityGate,
        metricLimitGate: formData.metricLimitGate
      }),
    [activeDoctrineRules, formData, mode, stageCompletion]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass w-full max-w-4xl rounded-2xl relative z-10 overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="text-amber-400 w-5 h-5" />
            WarGame Protocol: {modeLabel(mode)}
          </h2>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">Decision Chamber: New Scenario</div>
          <div className="text-xs font-mono text-zinc-500">STAGE {step} OF {STAGE_COUNT}</div>
        </div>

        {error && <div className="px-8 pt-4 text-sm text-red-400">{error}</div>}
        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-5 gap-2">
            {WAR_GAME_STAGES.map((stage, idx) => {
              const active = step === idx + 1;
              const done = stageCompletion.includes(stage.id);
              return (
                <div key={stage.id} className={cn("rounded-lg border px-2 py-2 text-[10px]", active ? "border-blue-500/60 bg-blue-500/10" : "border-white/10 bg-zinc-900/40")}>
                  <div className={cn("font-bold uppercase", done ? "text-emerald-300" : "text-zinc-300")}>{stage.id}</div>
                  <div className="text-zinc-400 mt-1">{stage.title}</div>
                </div>
              );
            })}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-zinc-300">Stage A: Context Framing</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Target ({modeLabel(mode)})</label>
                  <select
                    className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm"
                    value={formData.targetId}
                    onChange={(e) => {
                      const nextTargetId = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        targetId: nextTargetId,
                        sourceId: mode === "source" ? nextTargetId : prev.sourceId,
                        domainId: mode === "domain" ? nextTargetId : prev.domainId,
                        lineageNodeId: mode === "lineage" ? nextTargetId : prev.lineageNodeId
                      }));
                    }}
                  >
                    {modeTargets.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Scenario Title</label>
                  <input
                    type="text"
                    placeholder="Define the decision frame"
                    className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Source</label>
                  <select className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm" value={formData.sourceId} onChange={(e) => setFormData((prev) => ({ ...prev, sourceId: e.target.value }))}>
                    {sources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Domain</label>
                  <select className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm" value={formData.domainId} onChange={(e) => setFormData((prev) => ({ ...prev, domainId: e.target.value }))}>
                    {domains.map((domain) => (
                      <option key={domain.id} value={domain.id}>
                        {domain.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Lineage</label>
                  <select className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm" value={formData.lineageNodeId} onChange={(e) => setFormData((prev) => ({ ...prev, lineageNodeId: e.target.value }))}>
                    {lineages.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.level} - {node.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Context Narrative</label>
                <textarea className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm h-20" value={formData.contextNarrative} onChange={(e) => setFormData((prev) => ({ ...prev, contextNarrative: e.target.value }))} />
              </div>
              {mode === "mission" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Serial Lane (Affair IDs)</label>
                    <textarea
                      className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm h-20"
                      placeholder="affair-a, affair-b, affair-c"
                      value={formData.missionSerialRefs}
                      onChange={(e) => setFormData((prev) => ({ ...prev, missionSerialRefs: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Parallel Lane (Interest IDs)</label>
                    <textarea
                      className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm h-20"
                      placeholder="interest-a, interest-b"
                      value={formData.missionParallelRefs}
                      onChange={(e) => setFormData((prev) => ({ ...prev, missionParallelRefs: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Dependency Path Notes</label>
                    <textarea
                      className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm h-16"
                      value={formData.missionDependencyNotes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, missionDependencyNotes: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-zinc-300">Stage B: Fragility and Exposure Structure</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Concavity Profile</label>
                  <select className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm" value={formData.concavity} onChange={(e) => setFormData((prev) => ({ ...prev, concavity: e.target.value as "concave" | "neutral" | "convex" }))}>
                    <option value="concave">concave (short vol)</option>
                    <option value="neutral">neutral</option>
                    <option value="convex">convex (long vol)</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-xs text-zinc-300">
                  <input type="checkbox" checked={formData.shortVol} onChange={(e) => setFormData((prev) => ({ ...prev, shortVol: e.target.checked }))} />
                  Short Vol Exposure
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-300">
                  <input type="checkbox" checked={formData.longVol} onChange={(e) => setFormData((prev) => ({ ...prev, longVol: e.target.checked }))} />
                  Long Vol Exposure
                </label>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {(["exposure", "dependency", "irreversibility", "optionality", "responseTime"] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-[10px] uppercase text-zinc-500 mb-1">{field}</label>
                    <input
                      type="number"
                      min={field === "responseTime" ? 0.1 : 1}
                      max={field === "responseTime" ? 365 : 10}
                      step={field === "responseTime" ? 0.1 : 1}
                      className="w-full bg-zinc-800 border border-white/10 rounded-lg p-2 text-xs"
                      value={formData[field]}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [field]: Number(e.target.value || (field === "responseTime" ? 7 : 5)) }))}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Upside</label>
                  <input className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm" value={formData.upside} onChange={(e) => setFormData((prev) => ({ ...prev, upside: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Downside</label>
                  <input className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm" value={formData.downside} onChange={(e) => setFormData((prev) => ({ ...prev, downside: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Fragility Narrative</label>
                <textarea className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm h-20" value={formData.fragilityNarrative} onChange={(e) => setFormData((prev) => ({ ...prev, fragilityNarrative: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Risk/Reward Summary</label>
                <textarea className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm h-16" value={formData.riskRewardSummary} onChange={(e) => setFormData((prev) => ({ ...prev, riskRewardSummary: e.target.value }))} />
              </div>
              <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Skin In The Game</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="bg-zinc-800 border border-white/10 rounded px-3 py-2 text-xs" placeholder="Capital at risk" value={formData.skinCapitalAtRisk} onChange={(e) => setFormData((prev) => ({ ...prev, skinCapitalAtRisk: e.target.value }))} />
                  <input className="bg-zinc-800 border border-white/10 rounded px-3 py-2 text-xs" placeholder="Time at risk" value={formData.skinTimeAtRisk} onChange={(e) => setFormData((prev) => ({ ...prev, skinTimeAtRisk: e.target.value }))} />
                  <input className="bg-zinc-800 border border-white/10 rounded px-3 py-2 text-xs" placeholder="Reputation at risk" value={formData.skinReputationAtRisk} onChange={(e) => setFormData((prev) => ({ ...prev, skinReputationAtRisk: e.target.value }))} />
                  <input className="bg-zinc-800 border border-white/10 rounded px-3 py-2 text-xs" placeholder="Breach penalty" value={formData.skinBreachPenalty} onChange={(e) => setFormData((prev) => ({ ...prev, skinBreachPenalty: e.target.value }))} />
                </div>
              </div>
              <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Barrier Checklist</div>
                <div className="space-y-2">
                  {barrierRules.length === 0 && <div className="text-xs text-zinc-500">No barrier rules configured for this mode.</div>}
                  {barrierRules.map((rule) => (
                    <div key={rule.id} className={cn("p-2 rounded border", rule.severity === "HARD_GATE" ? "border-red-500/30 bg-red-500/10" : "border-white/10 bg-zinc-800/40")}>
                      <label className="flex items-start gap-2 text-xs text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.ruleChecks[rule.id]?.passed)}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              ruleChecks: {
                                ...prev.ruleChecks,
                                [rule.id]: { ...(prev.ruleChecks[rule.id] ?? {}), passed: e.target.checked }
                              }
                            }))
                          }
                        />
                        <span>{rule.statement}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-zinc-300">Stage C: Means / Ends / Barbell Mapping</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Means</label>
                  <textarea className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm h-20" value={formData.meansText} onChange={(e) => setFormData((prev) => ({ ...prev, meansText: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Ends</label>
                  <textarea className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm h-20" value={formData.endsText} onChange={(e) => setFormData((prev) => ({ ...prev, endsText: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Hedge (Affairs)</label>
                  <textarea className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm h-20" value={formData.hedgeText} onChange={(e) => setFormData((prev) => ({ ...prev, hedgeText: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Edge (Interests)</label>
                  <textarea className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm h-20" value={formData.edgeText} onChange={(e) => setFormData((prev) => ({ ...prev, edgeText: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-xs text-zinc-300">
                  <input type="checkbox" checked={formData.jensenGate} onChange={(e) => setFormData((prev) => ({ ...prev, jensenGate: e.target.checked }))} />
                  Jensen/Convexity check done
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-300">
                  <input type="checkbox" checked={formData.barbellGate} onChange={(e) => setFormData((prev) => ({ ...prev, barbellGate: e.target.checked }))} />
                  Barbell mapping done
                </label>
              </div>
              <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Atomic Rule Checklist</div>
                <div className="space-y-2">
                  {checklistRules.length === 0 && <div className="text-xs text-zinc-500">No doctrine rules configured for this mode.</div>}
                  {checklistRules.map((rule) => (
                    <div key={rule.id} className={cn("p-2 rounded border", rule.severity === "HARD_GATE" ? "border-red-500/30 bg-red-500/10" : "border-white/10 bg-zinc-800/40")}>
                      <label className="flex items-start gap-2 text-xs text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.ruleChecks[rule.id]?.passed)}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              ruleChecks: {
                                ...prev.ruleChecks,
                                [rule.id]: { ...(prev.ruleChecks[rule.id] ?? {}), passed: e.target.checked }
                              },
                              policyAcknowledgements:
                                rule.kind === "POLICY" && e.target.checked
                                  ? Array.from(new Set([...prev.policyAcknowledgements, rule.id]))
                                  : prev.policyAcknowledgements.filter((id) => id !== rule.id)
                            }))
                          }
                        />
                        <div className="space-y-1">
                          <div>{rule.statement}</div>
                          <div className="text-zinc-500">
                            {rule.triggerText ? `Trigger: ${rule.triggerText}. ` : ""}
                            {rule.actionText ? `Action: ${rule.actionText}. ` : ""}
                            {rule.failureCostText ? `Failure cost: ${rule.failureCostText}.` : ""}
                          </div>
                        </div>
                      </label>
                      <input
                        className="mt-2 w-full bg-zinc-900 border border-white/10 rounded px-2 py-1 text-[11px]"
                        placeholder="Optional rule note"
                        value={formData.ruleChecks[rule.id]?.note ?? ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            ruleChecks: {
                              ...prev.ruleChecks,
                              [rule.id]: { ...(prev.ruleChecks[rule.id] ?? {}), note: e.target.value }
                            }
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-zinc-300">Stage D: ORK/KPI/Threshold/Preparation</h4>
              <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                <div className="text-[10px] uppercase text-zinc-500 mb-2">ORKs</div>
                <div className="flex gap-2 mb-2">
                  <input className="flex-1 bg-zinc-800 border border-white/10 rounded px-3 py-2 text-sm" value={objectiveInput} onChange={(e) => setObjectiveInput(e.target.value)} placeholder="Add ORK" />
                  <button
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-xs font-semibold text-white disabled:bg-zinc-700"
                    disabled={!objectiveInput.trim()}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, objectives: [...prev.objectives, objectiveInput.trim()] }));
                      setObjectiveInput("");
                    }}
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1">
                  {formData.objectives.map((objective, index) => (
                    <div key={`${objective}-${index}`} className="flex items-center justify-between text-xs text-zinc-300 bg-zinc-800/60 rounded px-2 py-1">
                      <span>{objective}</span>
                      <button onClick={() => setFormData((prev) => ({ ...prev, objectives: prev.objectives.filter((_, i) => i !== index) }))} className="text-zinc-500 hover:text-zinc-300">
                        x
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                <div className="text-[10px] uppercase text-zinc-500 mb-2">KPIs</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                  <input className="bg-zinc-800 border border-white/10 rounded px-2 py-2 text-xs" placeholder="Name" value={kpiDraft.name ?? ""} onChange={(e) => setKpiDraft((prev) => ({ ...prev, name: e.target.value }))} />
                  <input className="bg-zinc-800 border border-white/10 rounded px-2 py-2 text-xs" placeholder="Target" value={kpiDraft.target ?? ""} onChange={(e) => setKpiDraft((prev) => ({ ...prev, target: e.target.value }))} />
                  <input className="bg-zinc-800 border border-white/10 rounded px-2 py-2 text-xs" placeholder="Current" value={kpiDraft.current ?? ""} onChange={(e) => setKpiDraft((prev) => ({ ...prev, current: e.target.value }))} />
                  <div className="flex gap-2">
                    <input className="flex-1 bg-zinc-800 border border-white/10 rounded px-2 py-2 text-xs" placeholder="Unit" value={kpiDraft.unit ?? ""} onChange={(e) => setKpiDraft((prev) => ({ ...prev, unit: e.target.value }))} />
                    <button
                      className="px-2 py-2 bg-blue-600 hover:bg-blue-500 rounded text-xs font-semibold text-white disabled:bg-zinc-700"
                      disabled={!kpiDraft.name?.trim()}
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, kpis: [...prev.kpis, { ...kpiDraft, name: kpiDraft.name.trim() }] }));
                        setKpiDraft({ name: "", target: "", current: "", unit: "" });
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  {formData.kpis.map((kpi, index) => (
                    <div key={`${kpi.name}-${index}`} className="flex items-center justify-between text-xs text-zinc-300 bg-zinc-800/60 rounded px-2 py-1">
                      <span>
                        {kpi.name} {kpi.current ? `(${kpi.current}` : ""} {kpi.target ? `-> ${kpi.target}` : ""}{kpi.unit ? ` ${kpi.unit}` : ""}{kpi.current ? ")" : ""}
                      </span>
                      <button onClick={() => setFormData((prev) => ({ ...prev, kpis: prev.kpis.filter((_, i) => i !== index) }))} className="text-zinc-500 hover:text-zinc-300">
                        x
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Threshold Notes</label>
                  <textarea className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm h-20" value={formData.thresholdNotes} onChange={(e) => setFormData((prev) => ({ ...prev, thresholdNotes: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Preparation Notes</label>
                  <textarea className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm h-20" value={formData.preparationNotes} onChange={(e) => setFormData((prev) => ({ ...prev, preparationNotes: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                  <div className="text-[10px] uppercase text-zinc-500 mb-2">Omission Cadence</div>
                  <select className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-xs mb-2" value={formData.omissionCadence} onChange={(e) => setFormData((prev) => ({ ...prev, omissionCadence: e.target.value as "" | "daily" | "weekly" | "monthly" }))}>
                    <option value="">select cadence</option>
                    <option value="daily">daily</option>
                    <option value="weekly">weekly</option>
                    <option value="monthly">monthly</option>
                  </select>
                  <input className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-xs" placeholder="Reminder note" value={formData.omissionReminder} onChange={(e) => setFormData((prev) => ({ ...prev, omissionReminder: e.target.value }))} />
                </div>
                <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                  <div className="text-[10px] uppercase text-zinc-500 mb-2">Domain P&L Signal</div>
                  <input className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-xs mb-2" placeholder="Fragility removed" value={formData.domainPnlFragilityRemoved} onChange={(e) => setFormData((prev) => ({ ...prev, domainPnlFragilityRemoved: e.target.value }))} />
                  <input className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-xs mb-2" placeholder="Robustness gained" value={formData.domainPnlRobustnessGained} onChange={(e) => setFormData((prev) => ({ ...prev, domainPnlRobustnessGained: e.target.value }))} />
                  <input className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-xs" placeholder="Optionality created" value={formData.domainPnlOptionalityCreated} onChange={(e) => setFormData((prev) => ({ ...prev, domainPnlOptionalityCreated: e.target.value }))} />
                </div>
              </div>
              {mode === "interest" && (
                <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                  <div className="text-[10px] uppercase text-zinc-500 mb-2">Interest Bets</div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                    <input className="bg-zinc-800 border border-white/10 rounded px-2 py-2 text-xs" placeholder="Bet title" value={betDraft.title} onChange={(e) => setBetDraft((prev) => ({ ...prev, title: e.target.value }))} />
                    <input className="bg-zinc-800 border border-white/10 rounded px-2 py-2 text-xs" placeholder="Thesis" value={betDraft.thesis} onChange={(e) => setBetDraft((prev) => ({ ...prev, thesis: e.target.value }))} />
                    <input className="bg-zinc-800 border border-white/10 rounded px-2 py-2 text-xs" placeholder="Max loss" value={betDraft.maxLoss} onChange={(e) => setBetDraft((prev) => ({ ...prev, maxLoss: e.target.value }))} />
                    <div className="flex gap-2">
                      <input type="date" className="flex-1 bg-zinc-800 border border-white/10 rounded px-2 py-2 text-xs" value={betDraft.expiry} onChange={(e) => setBetDraft((prev) => ({ ...prev, expiry: e.target.value }))} />
                      <button
                        className="px-2 py-2 bg-blue-600 hover:bg-blue-500 rounded text-xs font-semibold text-white disabled:bg-zinc-700"
                        disabled={!betDraft.title.trim()}
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, bets: [...prev.bets, { ...betDraft, title: betDraft.title.trim() }] }));
                          setBetDraft({ title: "", thesis: "", maxLoss: "", expiry: "" });
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {formData.bets.map((bet, index) => (
                      <div key={`${bet.title}-${index}`} className="flex items-center justify-between text-xs text-zinc-300 bg-zinc-800/60 rounded px-2 py-1">
                        <span>
                          {bet.title} {bet.maxLoss ? `| max loss ${bet.maxLoss}` : ""} {bet.expiry ? `| expiry ${bet.expiry}` : ""}
                        </span>
                        <button onClick={() => setFormData((prev) => ({ ...prev, bets: prev.bets.filter((_, i) => i !== index) }))} className="text-zinc-500 hover:text-zinc-300">
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-zinc-300">Stage E: Readiness and Execute</h4>
              <div className={cn("p-4 rounded-xl border", readiness.band === "ready" ? "bg-emerald-500/10 border-emerald-500/30" : readiness.band === "conditional" ? "bg-amber-500/10 border-amber-500/30" : "bg-red-500/10 border-red-500/30")}>
                <div className="text-[10px] uppercase text-zinc-500 mb-1">Readiness Score</div>
                <div className="text-2xl font-bold">{readiness.score}</div>
                <div className="text-xs text-zinc-300 mt-1">Band: {readiness.band.toUpperCase()}</div>
                <div className="text-xs text-zinc-400 mt-1">Penalty total: {readiness.penalties.totalPenalty}</div>
                <div className="text-xs text-zinc-400 mt-1">Doctrine penalty: {readiness.penalties.doctrinePenalty}</div>
                <div className="text-xs text-zinc-400 mt-1">
                  Unresolved hard doctrine rules: {activeDoctrineRules.filter((rule) => rule.severity === "HARD_GATE" && !formData.ruleChecks[rule.id]?.passed).length}
                </div>
              </div>

              <div className="p-4 rounded-xl border bg-zinc-900/50 border-white/10">
                <div className="text-xs font-mono uppercase text-zinc-500 mb-3">Critical Execute Gates</div>
                <div className="space-y-2">
                  <label className="flex items-start gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input type="checkbox" checked={formData.noRuinGate} onChange={(e) => setFormData((prev) => ({ ...prev, noRuinGate: e.target.checked }))} className="mt-0.5" />
                    <span>No-ruin gate satisfied for path-dependent exposure.</span>
                  </label>
                  <label className="flex items-start gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input type="checkbox" checked={formData.ergodicityGate} onChange={(e) => setFormData((prev) => ({ ...prev, ergodicityGate: e.target.checked }))} className="mt-0.5" />
                    <span>Ensemble/time probability mismatch handled (ergodicity check).</span>
                  </label>
                  <label className="flex items-start gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input type="checkbox" checked={formData.metricLimitGate} onChange={(e) => setFormData((prev) => ({ ...prev, metricLimitGate: e.target.checked }))} className="mt-0.5" />
                    <span>Metric-limit gate satisfied (no std-dev-only basis).</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-zinc-900/80 border-t border-white/10 flex justify-between">
          <button onClick={() => (step > 1 ? setStep(step - 1) : onClose())} className="px-6 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-300">
            {step === 1 ? "CANCEL" : "BACK"}
          </button>
          <button
            onClick={async () => {
              if (step < STAGE_COUNT) {
                setStep(step + 1);
                return;
              }
              setSaving(true);
              setError(null);
              try {
                if (!formData.title.trim()) {
                  throw new Error("Title is required.");
                }
                if (readiness.blocked) {
                  throw new Error("Critical gates or hard doctrine rules are incomplete. Execution blocked.");
                }

                const extras: ProtocolExtrasDto = {
                  protocolVersion: "v0.2.6",
                  mode: modeToPlanSourceType(mode),
                  readinessScore: readiness.score,
                  readinessBand: readiness.band,
                  readinessBreakdown: readiness.penalties,
                  gates: {
                    noRuinGate: formData.noRuinGate,
                    ergodicityGate: formData.ergodicityGate,
                    metricLimitGate: formData.metricLimitGate,
                    jensenGate: formData.jensenGate,
                    barbellGate: formData.barbellGate
                  },
                  fragilityProfile: {
                    shape: formData.concavity,
                    shortVol: formData.shortVol,
                    longVol: formData.longVol
                  },
                  meansEndsMap: {
                    means: formData.meansText,
                    ends: formData.endsText,
                    hedge: formData.hedgeText,
                    edge: formData.edgeText
                  },
                  riskRewardSummary: formData.riskRewardSummary,
                  orks: formData.objectives.map((objective) => ({ title: objective })),
                  kpis: formData.kpis,
                  doctrineVersion: "v0.2.6",
                  ruleChecks: Object.entries(formData.ruleChecks).map(([ruleId, value]) => ({
                    ruleId,
                    passed: Boolean(value?.passed),
                    note: value?.note
                  })),
                  policyAcknowledgements: formData.policyAcknowledgements,
                  bets: formData.bets,
                  skinInGame: {
                    capitalAtRisk: formData.skinCapitalAtRisk,
                    timeAtRisk: formData.skinTimeAtRisk,
                    reputationAtRisk: formData.skinReputationAtRisk,
                    breachPenalty: formData.skinBreachPenalty
                  },
                  omissionCadence: {
                    cadence: formData.omissionCadence,
                    reminder: formData.omissionReminder
                  },
                  domainPnLSignal: {
                    fragilityRemoved: formData.domainPnlFragilityRemoved,
                    robustnessGained: formData.domainPnlRobustnessGained,
                    optionalityCreated: formData.domainPnlOptionalityCreated
                  }
                };

                const parseRefs = (value: string) =>
                  value
                    .split(/[,\n]/)
                    .map((item) => item.trim())
                    .filter(Boolean);
                const serialRefs = parseRefs(formData.missionSerialRefs);
                const parallelRefs = parseRefs(formData.missionParallelRefs);
                const missionNodes =
                  mode === "mission"
                    ? [
                        ...serialRefs.map((refId, index) => ({
                          id: `mission-serial-${index + 1}-${refId}`,
                          refType: "AFFAIR",
                          refId,
                          sortOrder: index + 1,
                          dependencyIds: index > 0 ? [`mission-serial-${index}-${serialRefs[index - 1]}`] : []
                        })),
                        ...parallelRefs.map((refId, index) => ({
                          id: `mission-parallel-${index + 1}-${refId}`,
                          refType: "INTEREST",
                          refId,
                          sortOrder: serialRefs.length + index + 1,
                          dependencyIds: []
                        }))
                      ]
                    : [];

                await onSave({
                  ...formData,
                  mode,
                  targetId: formData.targetId,
                  sourceType: modeToPlanSourceType(mode),
                  criteria: formData.objectives.map((objective) => ({ name: "ORK", description: objective })),
                  thresholds: formData.thresholdNotes ? [{ name: "KPI Threshold", value: formData.thresholdNotes }] : [],
                  preparation: formData.preparationNotes ? { notes: formData.preparationNotes } : {},
                  missionHierarchy:
                    mode === "mission"
                      ? {
                          missionId: formData.targetId,
                          dependencyNotes: formData.missionDependencyNotes,
                          nodes: missionNodes
                        }
                      : undefined,
                  extras,
                  readiness
                });
                onClose();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to execute");
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors text-white disabled:bg-zinc-700"
          >
            {step === STAGE_COUNT ? (saving ? "EXECUTING..." : "EXECUTE") : "NEXT"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
