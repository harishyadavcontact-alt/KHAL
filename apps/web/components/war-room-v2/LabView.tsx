"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppData, Interest } from "./types";
import { createExecutionTask, updateInterest } from "../../lib/war-room/actions";
import { computeInterestProtocolChecks, computeLabSummary, withLabDerivedFields } from "../../lib/war-room/operational-metrics";

type Stage = "FORGE" | "WIELD" | "TINKER";

function deepPanelStyle() {
  return {
    background: "linear-gradient(180deg, rgba(18,18,31,0.88), rgba(10,10,18,0.94))",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 30px rgba(0,0,0,0.18)"
  } as const;
}

function stageTone(stage: Stage) {
  if (stage === "FORGE") return "border-blue-400/30 bg-blue-500/10 text-blue-200";
  if (stage === "WIELD") return "border-amber-400/30 bg-amber-500/10 text-amber-200";
  return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
}

function safeDateInput(value?: string): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function isoDateDaysFromNow(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() + days);
  return now.toISOString().slice(0, 10);
}

function isBlankText(value: unknown): boolean {
  return String(value ?? "").trim().length === 0;
}

export function LabView({ data, onRefresh, initialFocusId }: { data: AppData; onRefresh: () => Promise<unknown> | void; initialFocusId?: string }) {
  const router = useRouter();
  const derived = useMemo(() => withLabDerivedFields(data), [data]);
  const summary = useMemo(() => computeLabSummary(derived), [derived]);
  const domainById = useMemo(() => new Map(derived.domains.map((domain) => [domain.id, domain])), [derived.domains]);
  const sourceMapProfiles = useMemo(() => data.sources?.flatMap((source) => source.mapProfiles ?? []) ?? [], [data.sources]);

  const ordered = useMemo(
    () => [...derived.interests].sort((left, right) => (right.asymmetryScore ?? 0) - (left.asymmetryScore ?? 0)),
    [derived.interests]
  );
  const lanes = useMemo(
    () => ({
      FORGE: ordered.filter((interest) => (interest.labStage ?? "FORGE") === "FORGE"),
      WIELD: ordered.filter((interest) => (interest.labStage ?? "FORGE") === "WIELD"),
      TINKER: ordered.filter((interest) => (interest.labStage ?? "FORGE") === "TINKER")
    }),
    [ordered]
  );

  const [selectedId, setSelectedId] = useState<string | null>(initialFocusId ?? ordered[0]?.id ?? null);
  const selected = ordered.find((interest) => interest.id === selectedId) ?? null;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(true);

  const [draft, setDraft] = useState<Partial<Interest>>({});
  const focus = selected ? { ...selected, ...draft } : null;
  const inheritedProfile = useMemo(
    () => sourceMapProfiles.find((profile) => profile.interestId === selectedId),
    [selectedId, sourceMapProfiles]
  );
  const inheritedSource = useMemo(
    () => data.sources?.find((source) => source.id === inheritedProfile?.sourceId),
    [data.sources, inheritedProfile?.sourceId]
  );
  const inheritedCraft = useMemo(
    () => data.crafts.find((craft) => craft.id === inheritedProfile?.primaryCraftId),
    [data.crafts, inheritedProfile?.primaryCraftId]
  );
  const suggestedHeuristics = useMemo(() => inheritedCraft?.heuristics.slice(0, 3) ?? [], [inheritedCraft]);

  const checks = useMemo(
    () => (focus ? computeInterestProtocolChecks(focus as Interest, domainById.get(focus.domainId ?? "")) : []),
    [domainById, focus]
  );
  const linkedTasks = useMemo(
    () =>
      focus
        ? derived.tasks.filter(
            (task) =>
              String(task.sourceType ?? "").toUpperCase() === "INTEREST" &&
              String(task.sourceId ?? "") === focus.id
          )
        : [],
    [derived.tasks, focus]
  );
  const hasExecutionEvidence = linkedTasks.some((task) => {
    const status = String(task.status ?? "").toLowerCase();
    return status === "done" || status === "in_progress";
  });

  const queueBlocked = !(focus && focus.labStage === "WIELD" && focus.protocolReady);
  const failedChecks = checks.filter((check) => !check.passed);
  const checklistRatio = checks.length ? Math.round(((checks.length - failedChecks.length) / checks.length) * 100) : 0;

  const setSelected = (interest: Interest) => {
    setSelectedId(interest.id);
    setDraft({});
    setError(null);
  };

  const updateDraft = <K extends keyof Interest>(key: K, value: Interest[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (!initialFocusId) return;
    setSelectedId(initialFocusId);
    setDraft({});
    setError(null);
  }, [initialFocusId]);

  useEffect(() => {
    if (!selected || !inheritedProfile) return;
    setDraft((prev) => {
      const next = { ...prev };
      let changed = false;

      if (isBlankText(selected.hypothesis) && isBlankText(prev.hypothesis) && !isBlankText(inheritedProfile.edgeText)) {
        next.hypothesis = inheritedProfile.edgeText;
        changed = true;
      }
      if (isBlankText(selected.evidenceNote) && isBlankText(prev.evidenceNote) && !isBlankText(inheritedProfile.heuristicsText)) {
        next.evidenceNote = inheritedProfile.heuristicsText;
        changed = true;
      }
      if (isBlankText(selected.downside) && isBlankText(prev.downside) && !isBlankText(inheritedProfile.avoidText)) {
        next.downside = inheritedProfile.avoidText;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [selected, inheritedProfile]);

  const applyInheritedDoctrine = () => {
    if (!inheritedProfile) return;
    setDraft((prev) => ({
      ...prev,
      hypothesis: inheritedProfile.edgeText ?? prev.hypothesis ?? "",
      evidenceNote: inheritedProfile.heuristicsText ?? prev.evidenceNote ?? "",
      downside: inheritedProfile.avoidText ?? inheritedProfile.risksText ?? prev.downside ?? ""
    }));
    setError(null);
  };

  const attemptStageChange = (stage: Stage) => {
    if (!focus) return;
    if (stage === "WIELD" && !focus.protocolReady) {
      setError("Cannot move to WIELD: protocol checklist incomplete.");
      return;
    }
    if (stage === "TINKER" && !hasExecutionEvidence) {
      setError("Cannot move to TINKER: requires at least one in-progress/done linked execution task.");
      return;
    }
    setError(null);
    updateDraft("labStage", stage);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { ...draft };
      if (typeof payload.expiryDate === "string" && payload.expiryDate.trim()) {
        payload.expiryDate = `${payload.expiryDate}T00:00:00.000Z`;
      }
      if (typeof payload.killCriteria === "string") {
        payload.killCriteria = String(payload.killCriteria)
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean);
      }
      await updateInterest(selected.id, payload);
      setDraft({});
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Lab experiment.");
    } finally {
      setSaving(false);
    }
  };

  const scaffoldProtocol = () => {
    if (!focus) return;
    const nextKillCriteria =
      focus.killCriteria && focus.killCriteria.length
        ? focus.killCriteria
        : ["Exit if drawdown exceeds max loss", "Exit if thesis invalidated by evidence"];
    setDraft((prev) => ({
      ...prev,
      hypothesis: String(focus.hypothesis ?? "").trim() ? focus.hypothesis : inheritedProfile?.edgeText?.trim() || `Convex trial for ${focus.title}`,
      maxLossPct: Number.isFinite(Number(focus.maxLossPct)) && Number(focus.maxLossPct) > 0 ? Number(focus.maxLossPct) : 5,
      expiryDate: safeDateInput(focus.expiryDate) || isoDateDaysFromNow(30),
      killCriteria: nextKillCriteria,
      hedgePct: Number.isFinite(Number(focus.hedgePct)) ? Number(focus.hedgePct) : 90,
      edgePct: Number.isFinite(Number(focus.edgePct)) ? Number(focus.edgePct) : 10,
      irreversibility: Number.isFinite(Number(focus.irreversibility)) ? Number(focus.irreversibility) : 30,
      evidenceNote: String(focus.evidenceNote ?? "").trim() ? focus.evidenceNote : inheritedProfile?.heuristicsText ?? "",
      downside: String(focus.downside ?? "").trim() ? focus.downside : inheritedProfile?.avoidText ?? inheritedProfile?.risksText ?? ""
    }));
    setError(null);
  };

  const rebalanceBarbell = (hedgePct: number, edgePct: number) => {
    setDraft((prev) => ({ ...prev, hedgePct, edgePct }));
    setError(null);
  };

  const advanceAndSave = async () => {
    if (!focus || !selected) return;
    let nextStage: Stage | null = null;
    if ((focus.labStage ?? "FORGE") === "FORGE") {
      if (!focus.protocolReady) {
        setError("Cannot advance: protocol checklist incomplete.");
        return;
      }
      nextStage = "WIELD";
    } else if ((focus.labStage ?? "FORGE") === "WIELD") {
      if (!hasExecutionEvidence) {
        setError("Cannot advance: execution evidence missing. Queue or run at least one linked task.");
        return;
      }
      nextStage = "TINKER";
    }
    if (!nextStage) return;

    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { ...draft, labStage: nextStage };
      if (typeof payload.expiryDate === "string" && payload.expiryDate.trim()) {
        payload.expiryDate = `${payload.expiryDate}T00:00:00.000Z`;
      }
      if (typeof payload.killCriteria === "string") {
        payload.killCriteria = String(payload.killCriteria)
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean);
      }
      await updateInterest(selected.id, payload);
      setDraft({});
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to advance Lab stage.");
    } finally {
      setSaving(false);
    }
  };

  const currentStage = (focus?.labStage ?? "FORGE") as Stage;
  const flowHint = !focus
    ? "Select an experiment."
    : currentStage === "FORGE"
      ? focus.protocolReady
        ? "Protocol complete. Advance to WIELD."
        : `${failedChecks.length} checklist item(s) missing. Complete protocol first.`
      : currentStage === "WIELD"
        ? hasExecutionEvidence
          ? "Execution evidence found. Advance to TINKER."
          : "Queue one execution action to generate evidence."
        : "Capture evidence and iterate thesis or recycle to FORGE.";

  const queueExecution = async () => {
    if (!focus || queueBlocked) return;
    setSaving(true);
    setError(null);
    try {
      await createExecutionTask({
        title: `Lab Execute: ${focus.title}`,
        sourceType: "INTEREST",
        sourceId: focus.id,
        horizon: "WEEK",
        notes: `Lab WIELD action. Hypothesis: ${focus.hypothesis ?? "n/a"}`
      });
      await onRefresh();
      router.push(`/surgical-execution?sourceType=INTEREST&sourceId=${encodeURIComponent(focus.id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to queue execution task.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-[var(--color-line)] pb-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Lab</div>
          <h2 className="khal-serif-hero mt-2 text-4xl text-[var(--color-text-strong)]">Forge, wield, tinker</h2>
          <p className="mt-3 max-w-3xl text-sm text-[var(--color-text-muted)]">
            Lab is the controlled workflow for interests. Use it to shape protocol, move into execution, then iterate with evidence.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="khal-subtle-panel px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Protocol</div>
            <div className="mt-1 text-lg text-[var(--color-text)]">{summary.protocolIntegrity}%</div>
          </div>
          <div className="khal-subtle-panel px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Blocked</div>
            <div className="mt-1 text-lg text-[var(--color-danger)]">{summary.blockedExperiments}</div>
          </div>
          <div className="khal-subtle-panel px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Asymmetry</div>
            <div className="mt-1 text-lg text-[var(--color-success)]">{summary.averageAsymmetryScore}</div>
          </div>
          <div className="khal-subtle-panel px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Stale</div>
            <div className="mt-1 text-lg text-[var(--color-warning)]">{summary.staleOptionalityCount}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["FORGE", "WIELD", "TINKER"] as Stage[]).map((stage) => (
            <div key={stage} className="khal-chamber p-4" style={deepPanelStyle()}>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)] mb-3">{stage}</div>
              <div className="space-y-2">
                {lanes[stage].map((interest) => (
                  <button
                    type="button"
                    key={interest.id}
                    onClick={() => setSelected(interest)}
                    className={`w-full text-left rounded-sm border px-3 py-3 transition ${
                      interest.id === selectedId ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_12%,var(--color-editor-bg-soft))]" : "border-[var(--color-line)] bg-[var(--color-editor-bg-soft)]"
                    }`}
                    style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 22px rgba(0,0,0,0.12)" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-[var(--color-text-strong)]">{interest.title}</div>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest ${stageTone(stage)}`}>{stage}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                      Asymmetry {interest.asymmetryScore ?? 0} | {interest.protocolReady ? "Protocol ready" : "Blocked"}
                    </div>
                  </button>
                ))}
                {!lanes[stage].length && <div className="text-xs text-[var(--color-text-muted)]">No experiments in {stage}.</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="khal-chamber p-4 space-y-4" style={deepPanelStyle()}>
          <div className="khal-subtle-panel p-3 space-y-2" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 22px rgba(0,0,0,0.12)" }}>
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Flow Navigator</div>
              <button
                type="button"
                onClick={() => setFocusMode((prev) => !prev)}
                className="rounded-sm border border-[var(--color-line)] px-2 py-0.5 text-[10px] text-[var(--color-text)] hover:bg-white/5"
              >
                {focusMode ? "Focus: On" : "Focus: Off"}
              </button>
            </div>
            <div className="text-xs text-[var(--color-text)]">{flowHint}</div>
            {focus ? (
              <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                <span>Checklist</span>
                <span className={checklistRatio >= 100 ? "text-emerald-300" : "text-amber-300"}>{checklistRatio}%</span>
              </div>
            ) : null}
            {focus ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={scaffoldProtocol}
                  className="rounded-sm border border-[var(--color-line)] px-2 py-1 text-[11px] text-[var(--color-text)] hover:bg-white/5"
                >
                  Scaffold Protocol
                </button>
                <button
                  type="button"
                  onClick={advanceAndSave}
                  disabled={saving || currentStage === "TINKER"}
                  className={`rounded px-2 py-1 text-[11px] font-semibold text-white ${
                    saving || currentStage === "TINKER" ? "bg-zinc-700 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500"
                  }`}
                >
                  {currentStage === "FORGE" ? "Advance to WIELD" : currentStage === "WIELD" ? "Advance to TINKER" : "Final Stage"}
                </button>
              </div>
            ) : null}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Selected Experiment</div>
            <div className="mt-1 text-sm font-semibold text-[var(--color-text-strong)]">{focus?.title ?? "Select an interest from lanes"}</div>
          </div>
          {!focus ? null : (
            <>
              {inheritedProfile ? (
                <div className="rounded border border-blue-400/20 bg-blue-500/5 p-2.5 space-y-2" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 22px rgba(0,0,0,0.12)" }}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">Inherited From State of the Art</div>
                      <div className="text-xs text-zinc-200">
                        {inheritedSource?.name ?? inheritedProfile.sourceId} {"->"} {domainById.get(focus.domainId)?.name ?? focus.domainId}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={applyInheritedDoctrine}
                      className="rounded border border-white/10 px-2 py-1 text-[10px] text-zinc-200 hover:bg-white/5"
                    >
                      Prefill Doctrine
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
                    <div>
                      <span className="text-zinc-500">Quadrant:</span> {inheritedProfile.quadrant}
                    </div>
                    <div>
                      <span className="text-zinc-500">Craft:</span> {inheritedCraft?.name ?? inheritedProfile.primaryCraftId ?? "Unassigned"}
                    </div>
                    <div className="col-span-2">
                      <span className="text-zinc-500">Edge:</span> {inheritedProfile.edgeText ?? "Undefined"}
                    </div>
                    <div className="col-span-2">
                      <span className="text-zinc-500">Avoid:</span> {inheritedProfile.avoidText ?? "Undefined"}
                    </div>
                    {suggestedHeuristics.length ? (
                      <div className="col-span-2">
                        <span className="text-zinc-500">Suggested heuristics:</span>{" "}
                        {suggestedHeuristics.map((heuristic) => heuristic.title).join(" | ")}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500">Hypothesis</label>
                <textarea
                  className="w-full rounded border border-white/10 bg-zinc-950 px-2 py-1.5 text-xs"
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
                  value={String(focus.hypothesis ?? "")}
                  onChange={(event) => updateDraft("hypothesis", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500">Evidence Note</label>
                <textarea
                  className="w-full rounded border border-white/10 bg-zinc-950 px-2 py-1.5 text-xs"
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
                  value={String(focus.evidenceNote ?? "")}
                  onChange={(event) => updateDraft("evidenceNote", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500">Downside / Avoid</label>
                <textarea
                  className="w-full rounded border border-white/10 bg-zinc-950 px-2 py-1.5 text-xs"
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
                  value={String(focus.downside ?? "")}
                  onChange={(event) => updateDraft("downside", event.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500">Max Loss %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-full rounded border border-white/10 bg-zinc-950 px-2 py-1.5 text-xs"
                    style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
                    value={Number(focus.maxLossPct ?? 0)}
                    onChange={(event) => updateDraft("maxLossPct", Number(event.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500">Expiry</label>
                  <input
                    type="date"
                    className="w-full rounded border border-white/10 bg-zinc-950 px-2 py-1.5 text-xs"
                    style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
                    value={safeDateInput(focus.expiryDate)}
                    onChange={(event) => updateDraft("expiryDate", event.target.value)}
                  />
                </div>
              </div>
              {focusMode && failedChecks.every((check) => check.key !== "barbell_split") ? null : (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500">Hedge %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-full rounded border border-white/10 bg-zinc-950 px-2 py-1.5 text-xs"
                      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
                      value={Number(focus.hedgePct ?? 0)}
                      onChange={(event) => updateDraft("hedgePct", Number(event.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500">Edge %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-full rounded border border-white/10 bg-zinc-950 px-2 py-1.5 text-xs"
                      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
                      value={Number(focus.edgePct ?? 0)}
                      onChange={(event) => updateDraft("edgePct", Number(event.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500">Irreversibility</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-full rounded border border-white/10 bg-zinc-950 px-2 py-1.5 text-xs"
                      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
                      value={Number(focus.irreversibility ?? 0)}
                      onChange={(event) => updateDraft("irreversibility", Number(event.target.value))}
                    />
                  </div>
                </div>
              )}
              {focusMode ? null : (
                <div className="flex items-center gap-2 text-[11px]">
                  <button type="button" onClick={() => rebalanceBarbell(90, 10)} className="rounded border border-white/10 px-2 py-1 hover:bg-white/5">
                    Rebalance 90/10
                  </button>
                  <button type="button" onClick={() => rebalanceBarbell(80, 20)} className="rounded border border-white/10 px-2 py-1 hover:bg-white/5">
                    Rebalance 80/20
                  </button>
                </div>
              )}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500">Kill Criteria (one per line)</label>
                <textarea
                  className="w-full rounded border border-white/10 bg-zinc-950 px-2 py-1.5 text-xs"
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
                  value={(focus.killCriteria ?? []).join("\n")}
                  onChange={(event) => updateDraft("killCriteria", event.target.value.split("\n").map((v) => v.trim()).filter(Boolean))}
                />
              </div>
              <div className="space-y-1 rounded border border-white/10 bg-zinc-950/60 p-2">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Protocol Checklist</div>
                {(focusMode ? failedChecks : checks).map((check) => (
                  <div key={check.key} className={`text-[11px] ${check.passed ? "text-emerald-300" : "text-red-300"}`}>
                    {check.passed ? "PASS" : "MISS"} - {check.label}
                  </div>
                ))}
                {focusMode && !failedChecks.length ? <div className="text-[11px] text-emerald-300">PASS - all protocol checks cleared.</div> : null}
              </div>
              <div className="space-y-2">
                <div className="text-xs text-zinc-300">Asymmetry Score: <span className="font-bold text-emerald-300">{focus.asymmetryScore ?? 0}</span></div>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => attemptStageChange("FORGE")} className="rounded border border-white/10 px-2 py-1 text-[11px] hover:bg-white/5">FORGE</button>
                  <button type="button" onClick={() => attemptStageChange("WIELD")} className="rounded border border-white/10 px-2 py-1 text-[11px] hover:bg-white/5">WIELD</button>
                  <button type="button" onClick={() => attemptStageChange("TINKER")} className="rounded border border-white/10 px-2 py-1 text-[11px] hover:bg-white/5">TINKER</button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/war-gaming/interest?target=${encodeURIComponent(focus.id)}`)}
                  className="rounded bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Open War Game Context
                </button>
                <button
                  type="button"
                  onClick={queueExecution}
                  disabled={queueBlocked || saving}
                  className={`rounded px-3 py-1.5 text-xs font-semibold text-white ${
                    queueBlocked ? "bg-zinc-700 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500"
                  }`}
                >
                  Queue in Surgical Execution
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="rounded bg-zinc-200 text-zinc-900 hover:bg-white px-3 py-1.5 text-xs font-semibold"
                >
                  {saving ? "Saving..." : "Save Lab Experiment"}
                </button>
              </div>
            </>
          )}
          {error && <div className="rounded border border-red-400/30 bg-red-500/10 p-2 text-xs text-red-300">{error}</div>}
        </div>
      </div>
    </div>
  );
}
