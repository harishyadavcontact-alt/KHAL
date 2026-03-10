import React, { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, Briefcase, ChevronRight, Compass, Layers, Shield, Sword, Target } from "lucide-react";
import { AppData, Affair } from "./types";
import { cn } from "./utils";
import {
  AssumptionRegisterPanel,
  DecisionReplayPanel,
  OutcomeAttributionPanel,
  RecoveryPlaybooksPanel
} from "./panels/RobustnessPanels";

interface DecisionChamberProps {
  affair: Affair;
  data: AppData;
  onBack: () => void;
  onSavePlan: (affairId: string, payload: { objectives: string[]; uncertainty?: string; timeHorizon?: string; lineageNodeId?: string; actorType?: "personal" | "private" | "public" }) => Promise<void>;
  onSaveMeans: (affairId: string, payload: { craftId: string; selectedHeuristicIds: string[] }) => Promise<void>;
  onCreateTask: (payload: { title: string; sourceType: string; sourceId: string; notes?: string; horizon?: string }) => Promise<void>;
}

export function DecisionChamber({ affair, data, onBack, onSavePlan, onSaveMeans, onCreateTask }: DecisionChamberProps) {
  const interest = data.interests.find((i) => i.id === affair.interestId);
  const associatedDomains = affair.context?.associatedDomains ?? [];
  const volatilityExposure = affair.context?.volatilityExposure ?? "Unknown";
  const posture = affair.strategy?.posture ?? "defense";
  const positioning = affair.strategy?.positioning ?? "unknown";
  const allies = affair.strategy?.mapping?.allies ?? [];
  const enemies = affair.strategy?.mapping?.enemies ?? [];
  const entities = affair.entities ?? [];
  const inheritedProfile = useMemo(
    () => data.sources?.flatMap((source) => source.mapProfiles ?? []).find((profile) => profile.affairId === affair.id),
    [affair.id, data.sources]
  );
  const inheritedSource = useMemo(
    () => data.sources?.find((source) => source.id === inheritedProfile?.sourceId),
    [data.sources, inheritedProfile?.sourceId]
  );
  const inheritedCraft = useMemo(
    () => data.crafts.find((craft) => craft.id === inheritedProfile?.primaryCraftId),
    [data.crafts, inheritedProfile?.primaryCraftId]
  );

  const [planDraft, setPlanDraft] = useState({
    objectives: affair.plan?.objectives ?? [],
    uncertainty: affair.plan?.uncertainty ?? "Unknown",
    timeHorizon: affair.plan?.timeHorizon ?? "Unknown",
    lineageNodeId: data.lineages?.nodes?.[0]?.id ?? "ln-self",
    actorType: "personal" as "personal" | "private" | "public"
  });

  const [meansDraft, setMeansDraft] = useState({
    craftId: affair.means?.craftId ?? data.crafts[0]?.id ?? "",
    selectedHeuristicIds: affair.means?.selectedHeuristicIds ?? []
  });
  const [objectiveInput, setObjectiveInput] = useState("");
  const [busy, setBusy] = useState<"plan" | "means" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  const craft = data.crafts.find((c) => c.id === meansDraft.craftId);
  const selectedHeuristics = useMemo(
    () => craft?.heuristics.filter((h) => meansDraft.selectedHeuristicIds.includes(h.id)) ?? [],
    [craft, meansDraft.selectedHeuristicIds]
  );
  const suggestedCraft = inheritedCraft ?? craft;
  const suggestedHeuristicOptions = useMemo(
    () => suggestedCraft?.heuristics.slice(0, 4) ?? [],
    [suggestedCraft]
  );
  const craftContext = useMemo(() => {
    if (!craft) {
      return {
        heaps: [] as string[],
        models: [] as string[],
        frameworks: [] as string[],
        barbells: [] as string[],
        traces: new Map<string, string[]>()
      };
    }

    const modelById = new Map(craft.models.map((model) => [model.id, model]));
    const frameworkById = new Map(craft.frameworks.map((framework) => [framework.id, framework]));
    const barbellById = new Map(craft.barbellStrategies.map((barbell) => [barbell.id, barbell]));
    const traces = new Map<string, string[]>();
    const touchedHeaps = new Set<string>();
    const touchedModels = new Set<string>();
    const touchedFrameworks = new Set<string>();
    const touchedBarbells = new Set<string>();

    for (const heuristic of craft.heuristics) {
      const chainLabels: string[] = [];
      for (const barbellId of heuristic.barbellStrategyIds ?? []) {
        const barbell = barbellById.get(barbellId);
        if (!barbell) continue;
        touchedBarbells.add(barbell.id);
        for (const frameworkId of barbell.frameworkIds ?? []) {
          const framework = frameworkById.get(frameworkId);
          if (!framework) continue;
          touchedFrameworks.add(framework.id);
          for (const modelId of framework.modelIds ?? []) {
            const model = modelById.get(modelId);
            if (model) {
              touchedModels.add(model.id);
              for (const heapId of model.heapIds ?? []) touchedHeaps.add(heapId);
              chainLabels.push(`${model.title} -> ${framework.title} -> ${barbell.title}`);
            }
          }
          if ((framework.modelIds ?? []).length === 0) chainLabels.push(`${framework.title} -> ${barbell.title}`);
        }
        if ((barbell.frameworkIds ?? []).length === 0) chainLabels.push(barbell.title);
      }
      traces.set(heuristic.id, Array.from(new Set(chainLabels)).slice(0, 4));
    }

    return {
      heaps: Array.from(touchedHeaps).map((id) => craft.heaps.find((heap) => heap.id === id)?.title).filter(Boolean) as string[],
      models: Array.from(touchedModels).map((id) => modelById.get(id)?.title).filter(Boolean) as string[],
      frameworks: Array.from(touchedFrameworks).map((id) => frameworkById.get(id)?.title).filter(Boolean) as string[],
      barbells: Array.from(touchedBarbells).map((id) => barbellById.get(id)?.title).filter(Boolean) as string[],
      traces
    };
  }, [craft]);

  useEffect(() => {
    if (!inheritedProfile) return;
    setPlanDraft((prev) => {
      const next = { ...prev };
      let changed = false;

      if (next.objectives.length === 0) {
        const seededObjectives = [inheritedProfile.hedgeText, inheritedProfile.stakesText].filter((value): value is string => Boolean(value?.trim()));
        if (seededObjectives.length) {
          next.objectives = seededObjectives;
          changed = true;
        }
      }

      if (!String(next.uncertainty ?? "").trim()) {
        const inheritedUncertainty = inheritedProfile.risksText ?? inheritedProfile.vulnerabilitiesText;
        if (String(inheritedUncertainty ?? "").trim()) {
          next.uncertainty = String(inheritedUncertainty);
          changed = true;
        }
      }

      if (!String(next.timeHorizon ?? "").trim()) {
        next.timeHorizon = "WEEK";
        changed = true;
      }

      return changed ? next : prev;
    });

    setMeansDraft((prev) => {
      if (prev.craftId || !inheritedProfile.primaryCraftId) return prev;
      return { ...prev, craftId: inheritedProfile.primaryCraftId };
    });
  }, [inheritedProfile]);

  const seedPlanFromDoctrine = () => {
    if (!inheritedProfile) return;
    setPlanDraft((prev) => ({
      ...prev,
      objectives: [
        inheritedProfile.hedgeText,
        inheritedProfile.stakesText,
        ...prev.objectives
      ].filter((value, index, array): value is string => Boolean(value?.trim()) && array.indexOf(value) === index),
      uncertainty: prev.uncertainty?.trim() ? prev.uncertainty : inheritedProfile.risksText ?? inheritedProfile.vulnerabilitiesText ?? "",
      timeHorizon: prev.timeHorizon?.trim() ? prev.timeHorizon : "WEEK"
    }));
  };

  const applyCraftSuggestion = () => {
    if (!inheritedProfile?.primaryCraftId) return;
    setMeansDraft((prev) => ({
      craftId: inheritedProfile.primaryCraftId ?? prev.craftId,
      selectedHeuristicIds: prev.selectedHeuristicIds
    }));
  };

  const savePlan = async () => {
    setBusy("plan");
    setError(null);
    try {
      await onSavePlan(affair.id, planDraft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save plan");
    } finally {
      setBusy(null);
    }
  };

  const saveMeans = async () => {
    setBusy("means");
    setError(null);
    try {
      await onSaveMeans(affair.id, meansDraft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save means");
    } finally {
      setBusy(null);
    }
  };

  const createAffairTask = async () => {
    if (!taskTitle.trim()) return;
    setCreatingTask(true);
    setError(null);
    try {
      await onCreateTask({
        title: taskTitle.trim(),
        sourceType: "AFFAIR",
        sourceId: affair.id,
        notes: `Execution task for affair ${affair.title}`,
        horizon: "WEEK"
      });
      setTaskTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create execution task");
    } finally {
      setCreatingTask(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400">
          <ChevronRight className="rotate-180" />
        </button>
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-widest font-mono mb-1">
            <Briefcase size={12} />
            Affair Decision Chamber
          </div>
          <h1 className="text-3xl font-bold">{affair.title}</h1>
        </div>
        <div className="ml-auto flex gap-3">
          <div
            className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
              affair.status === "execution" ? "bg-red-500/10 border-red-500/50 text-red-400" : "bg-blue-500/10 border-blue-500/50 text-blue-400"
            )}
          >
            {affair.status}
          </div>
          <div className="px-3 py-1 bg-zinc-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-400 border border-white/5">
            {affair.perspective}
          </div>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <DecisionReplayPanel events={data.decisionReplay} />
        <OutcomeAttributionPanel data={data} />
        <AssumptionRegisterPanel assumptions={data.assumptions} />
      </div>
      <div className="mb-6">
        <RecoveryPlaybooksPanel rows={data.recoveryPlaybooks} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <section className="glass p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
              <Compass size={16} /> Situation Context
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase mb-1">Associated Domains</div>
                <div className="flex flex-wrap gap-2">
                  {associatedDomains.map((d) => (
                    <span key={d} className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 uppercase font-mono">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase mb-1">Volatility Exposure</div>
                <p className="text-sm text-zinc-300">{volatilityExposure}</p>
              </div>
              {inheritedProfile ? (
                <>
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase mb-1">State of the Art Source</div>
                    <div className="text-sm font-bold text-amber-300">{inheritedSource?.name ?? inheritedProfile.sourceId}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase mb-1">Quadrant</div>
                    <div className="text-sm text-zinc-300">{inheritedProfile.quadrant}</div>
                  </div>
                </>
              ) : null}
              <div>
                <div className="text-[10px] text-zinc-500 uppercase mb-1">Parent Interest</div>
                <div className="text-sm font-bold text-blue-400">{interest?.title}</div>
              </div>
            </div>
          </section>

          <section className="glass p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
              <Target size={16} /> Planning & Preparation
            </h3>
            <div className="space-y-4">
              {inheritedProfile ? (
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">Inherited Preparation Context</div>
                      <div className="text-xs text-zinc-300">Affairs inherit the hedge, fragility posture, and preparation warnings from State of the Art.</div>
                    </div>
                    <button
                      type="button"
                      onClick={seedPlanFromDoctrine}
                      className="rounded border border-white/10 px-2 py-1 text-[10px] text-zinc-200 hover:bg-white/5"
                    >
                      Seed Plan
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">Hedge</div>
                      <div className="mt-1 text-zinc-200">{inheritedProfile.hedgeText ?? "Undefined"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">Fragility Posture</div>
                      <div className="mt-1 text-zinc-200">{inheritedProfile.fragilityPosture ?? "Undefined"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">Risks</div>
                      <div className="mt-1 text-zinc-200">{inheritedProfile.risksText ?? "Undefined"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">Vulnerabilities</div>
                      <div className="mt-1 text-zinc-200">{inheritedProfile.vulnerabilitiesText ?? "Undefined"}</div>
                    </div>
                  </div>
                </div>
              ) : null}
              <div>
                <div className="text-[10px] text-zinc-500 uppercase mb-1">Objectives</div>
                <ul className="text-sm text-zinc-300 space-y-1">
                  {planDraft.objectives.map((objective, index) => (
                    <li key={`${objective}-${index}`} className="flex items-center justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <ArrowRight size={12} className="mt-1 text-blue-500" /> {objective}
                      </div>
                      <button
                        className="text-[10px] px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600"
                        onClick={() =>
                          setPlanDraft((prev) => ({
                            ...prev,
                            objectives: prev.objectives.filter((_, i) => i !== index)
                          }))
                        }
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-2">
                  <input
                    className="flex-1 bg-zinc-900 border border-white/10 rounded px-3 py-2 text-xs"
                    value={objectiveInput}
                    onChange={(e) => setObjectiveInput(e.target.value)}
                    placeholder="Add objective"
                  />
                  <button
                    className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-xs font-semibold disabled:bg-zinc-700"
                    disabled={!objectiveInput.trim()}
                    onClick={() => {
                      setPlanDraft((prev) => ({ ...prev, objectives: [...prev.objectives, objectiveInput.trim()] }));
                      setObjectiveInput("");
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase mb-1">Uncertainty</div>
                  <input
                    className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm text-red-300"
                    value={planDraft.uncertainty ?? ""}
                    onChange={(e) => setPlanDraft((prev) => ({ ...prev, uncertainty: e.target.value }))}
                  />
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase mb-1">Horizon</div>
                  <input
                    className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm text-emerald-300"
                    value={planDraft.timeHorizon ?? ""}
                    onChange={(e) => setPlanDraft((prev) => ({ ...prev, timeHorizon: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase mb-1">Lineage Target</div>
                  <select
                    className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm"
                    value={planDraft.lineageNodeId}
                    onChange={(e) => setPlanDraft((prev) => ({ ...prev, lineageNodeId: e.target.value }))}
                  >
                    {(data.lineages?.nodes ?? []).map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.level} - {node.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase mb-1">Actor Type</div>
                  <select
                    className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm"
                    value={planDraft.actorType}
                    onChange={(e) => setPlanDraft((prev) => ({ ...prev, actorType: e.target.value as "personal" | "private" | "public" }))}
                  >
                    <option value="personal">personal</option>
                    <option value="private">private</option>
                    <option value="public">public</option>
                  </select>
                </div>
              </div>
              <button className="w-full px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm font-semibold disabled:bg-zinc-700" onClick={savePlan} disabled={busy !== null}>
                {busy === "plan" ? "Saving Plan..." : "Save Plan"}
              </button>
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <section className="glass p-6 rounded-2xl border-l-4 border-l-emerald-500">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
              <Layers size={16} /> Means Selection
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-zinc-800/50 rounded-xl border border-white/5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-zinc-500 uppercase">Active Craft</div>
                  {inheritedProfile?.primaryCraftId ? (
                    <button
                      type="button"
                      onClick={applyCraftSuggestion}
                      className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-zinc-200 hover:bg-white/5"
                    >
                      Use Suggested Craft
                    </button>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <select
                    className="flex-1 bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm"
                    value={meansDraft.craftId}
                    onChange={(e) =>
                      setMeansDraft({
                        craftId: e.target.value,
                        selectedHeuristicIds: []
                      })
                    }
                  >
                    {data.crafts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Activity size={20} className="text-emerald-400" />
                  </div>
                </div>
                {inheritedProfile ? (
                  <div className="mt-2 text-[11px] text-zinc-400">
                    Suggested by State of the Art: {inheritedCraft?.name ?? inheritedProfile.primaryCraftId ?? "Unassigned"}
                  </div>
                ) : null}
              </div>

              <div>
                <div className="text-[10px] text-zinc-500 uppercase mb-2">Heuristics</div>
                <div className="max-h-[240px] overflow-y-auto pr-1 custom-scrollbar space-y-2">
                  {(craft?.heuristics ?? []).map((heuristic) => {
                    const active = meansDraft.selectedHeuristicIds.includes(heuristic.id);
                    return (
                      <button
                        key={heuristic.id}
                        className={cn(
                          "w-full text-left p-3 rounded-xl border transition-all",
                          active ? "bg-blue-500/15 border-blue-500/50" : "bg-zinc-900/50 border-white/5 hover:border-blue-500/30"
                        )}
                        onClick={() =>
                          setMeansDraft((prev) => ({
                            ...prev,
                            selectedHeuristicIds: active
                              ? prev.selectedHeuristicIds.filter((id) => id !== heuristic.id)
                              : [...prev.selectedHeuristicIds, heuristic.id]
                          }))
                        }
                      >
                        <div className="font-semibold text-sm">{heuristic.title}</div>
                        <div className="text-xs text-zinc-400 mt-1">{heuristic.content}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-xl">
                  <div className="text-[10px] text-zinc-500 uppercase mb-2">Knowledge Heaps</div>
                  <div className="text-xs text-zinc-300 space-y-1">
                    {craftContext.heaps.length ? craftContext.heaps.slice(0, 4).map((name) => <div key={name}>{name}</div>) : <div className="text-zinc-500">No linked heaps</div>}
                  </div>
                </div>
                <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-xl">
                  <div className="text-[10px] text-zinc-500 uppercase mb-2">Models</div>
                  <div className="text-xs text-zinc-300 space-y-1">
                    {craftContext.models.length ? craftContext.models.slice(0, 4).map((name) => <div key={name}>{name}</div>) : <div className="text-zinc-500">No linked models</div>}
                  </div>
                </div>
                <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-xl">
                  <div className="text-[10px] text-zinc-500 uppercase mb-2">Frameworks</div>
                  <div className="text-xs text-zinc-300 space-y-1">
                    {craftContext.frameworks.length ? craftContext.frameworks.slice(0, 4).map((name) => <div key={name}>{name}</div>) : <div className="text-zinc-500">No linked frameworks</div>}
                  </div>
                </div>
                <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-xl">
                  <div className="text-[10px] text-zinc-500 uppercase mb-2">Barbells</div>
                  <div className="text-xs text-zinc-300 space-y-1">
                    {craftContext.barbells.length ? craftContext.barbells.slice(0, 4).map((name) => <div key={name}>{name}</div>) : <div className="text-zinc-500">No linked barbells</div>}
                  </div>
                </div>
              </div>

              <button className="w-full px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm font-semibold disabled:bg-zinc-700" onClick={saveMeans} disabled={busy !== null || !meansDraft.craftId}>
                {busy === "means" ? "Saving Means..." : "Save Means"}
              </button>

              <div className="space-y-2">
                {selectedHeuristics.map((h) => (
                  <div key={h.id} className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase">Heuristic</span>
                    </div>
                    <div className="font-bold text-sm mb-1">{h.title}</div>
                    <p className="text-xs text-zinc-400">{h.content}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(craftContext.traces.get(h.id) ?? []).map((trace) => (
                        <span key={trace} className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-[10px] text-blue-300">
                          {trace}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {!selectedHeuristics.length && suggestedHeuristicOptions.length ? (
                  <div className="p-4 bg-zinc-900/50 rounded-xl border border-dashed border-white/10">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Suggested heuristics from craft</div>
                    <div className="space-y-2">
                      {suggestedHeuristicOptions.map((heuristic) => (
                        <div key={heuristic.id} className="rounded-lg border border-white/5 bg-zinc-800/40 p-3">
                          <div className="text-sm font-semibold">{heuristic.title}</div>
                          <div className="mt-1 text-xs text-zinc-400">{heuristic.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="glass p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
              <Sword size={16} /> Strategy Deployment
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                <div className="text-[10px] text-zinc-500 uppercase mb-2">Posture</div>
                <div className={cn("text-lg font-bold uppercase tracking-widest", posture === "offense" ? "text-red-400" : "text-blue-400")}>{posture}</div>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                <div className="text-[10px] text-zinc-500 uppercase mb-2">Positioning</div>
                <div className="text-lg font-bold uppercase tracking-widest text-zinc-300">{positioning}</div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-zinc-800/50 rounded-xl border border-white/5">
              <div className="text-[10px] text-zinc-500 uppercase mb-2">Allies & Enemies</div>
              <div className="flex justify-between">
                <div className="text-xs text-emerald-400">Allies: {allies.join(", ") || "N/A"}</div>
                <div className="text-xs text-red-400">Enemies: {enemies.join(", ") || "N/A"}</div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <section className="glass p-6 rounded-2xl border border-blue-500/20">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-3">Execution Readiness</h3>
            <p className="text-xs text-zinc-400 mb-3">
              Tasks created here auto-propagate to Surgical Execution.
            </p>
            <div className="space-y-2">
              <input
                className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Create execution task from this affair"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
              <button
                disabled={!taskTitle.trim() || creatingTask}
                onClick={createAffairTask}
                className="w-full px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white disabled:bg-zinc-700"
              >
                {creatingTask ? "Creating..." : "Create Task"}
              </button>
            </div>
          </section>

          <section className="glass p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
              <Shield size={16} /> Fragility Assessment
            </h3>
            <div className="space-y-4">
              {entities.map((e) => (
                <div key={e.id} className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-bold text-sm">{e.name}</div>
                    <span className="text-[10px] text-zinc-500 uppercase">{e.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all",
                          e.fragility === "fragile" ? "w-1/3 bg-red-500" : e.fragility === "robust" ? "w-2/3 bg-blue-500" : "w-full bg-emerald-500"
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        e.fragility === "fragile" ? "text-red-400" : e.fragility === "robust" ? "text-blue-400" : "text-emerald-400"
                      )}
                    >
                      {e.fragility}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
