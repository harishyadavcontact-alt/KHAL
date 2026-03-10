"use client";

import { useEffect, useState } from "react";
import type { PortfolioInterestOption, PortfolioProjectCard } from "../../lib/portfolio/models";
import { PORTFOLIO_ROLE_OPTIONS, PORTFOLIO_SIGNAL_OPTIONS, PORTFOLIO_STAGE_OPTIONS, labelize, signalBandLabel } from "./PortfolioSignals";

type EditorValues = {
  name: string;
  tagline: string;
  strategicRole: string;
  stage: string;
  mission: string;
  wedge: string;
  rightTail: string;
  leftTail: string;
  currentExperiment: string;
  successMetric: string;
  killCriteria: string;
  nextMilestone: string;
  currentBottleneck: string;
  signalBand: string;
  repoUrl: string;
  repoName: string;
  defaultBranch: string;
  lastReviewedAt: string;
  notes: string;
  linkedInterestId: string;
  adapterSourcePath: string;
  isActive: boolean;
};

function buildValues(project?: PortfolioProjectCard | null): EditorValues {
  return {
    name: project?.name ?? "",
    tagline: project?.tagline ?? "",
    strategicRole: project?.strategicRole ?? "probe",
    stage: project?.stage ?? "idea",
    mission: project?.mission ?? "",
    wedge: project?.wedge ?? "",
    rightTail: project?.rightTail ?? "",
    leftTail: project?.leftTail ?? "",
    currentExperiment: project?.currentExperiment ?? "",
    successMetric: project?.successMetric ?? "",
    killCriteria: project?.killCriteria ?? "",
    nextMilestone: project?.nextMilestone ?? "",
    currentBottleneck: project?.currentBottleneck ?? "",
    signalBand: project?.signalBand ?? "watch",
    repoUrl: project?.repoUrl ?? "",
    repoName: project?.repoName ?? "",
    defaultBranch: project?.defaultBranch ?? "main",
    lastReviewedAt: project?.lastReviewedAt ? project.lastReviewedAt.slice(0, 10) : "",
    notes: project?.notes ?? "",
    linkedInterestId: project?.linkedInterestId ?? "",
    adapterSourcePath: project?.adapter?.sourcePath ?? "",
    isActive: project?.isActive ?? true
  };
}

function fieldClass(multiline = false) {
  return multiline
    ? "min-h-[110px] w-full rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.9)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
    : "w-full rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.9)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]";
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-faint)]">{children}</div>;
}

function buildValuesFromInterestOption(option: PortfolioInterestOption, current: EditorValues): EditorValues {
  const domainLabel = option.domainName ?? option.domainId ?? "Unmapped domain";
  const sourceLabel = option.sourceName ? ` from ${option.sourceName}` : "";
  return {
    ...current,
    name: current.name || option.title,
    tagline: current.tagline || `${domainLabel}${sourceLabel}`,
    strategicRole: current.strategicRole === "probe" ? "option" : current.strategicRole,
    stage: current.stage === "idea" ? "framing" : current.stage,
    mission: current.mission || option.edgeText || option.hypothesis || `Develop the asymmetric upside in ${domainLabel}.`,
    wedge: current.wedge || option.heuristicsText || option.hypothesis || "",
    rightTail: current.rightTail || option.edgeText || "",
    leftTail: current.leftTail || option.downside || option.avoidText || "",
    currentExperiment: current.currentExperiment || option.hypothesis || option.edgeText || "",
    killCriteria: current.killCriteria || option.downside || option.avoidText || "",
    currentBottleneck: current.currentBottleneck || option.avoidText || "",
    signalBand: current.signalBand === "watch" && option.protocolReady ? "high" : current.signalBand,
    linkedInterestId: option.id
  };
}

export function PortfolioProjectEditor({
  open,
  mode,
  project,
  interestOptions,
  initialLinkedInterestId,
  busy,
  onClose,
  onSubmit
}: {
  open: boolean;
  mode: "create" | "edit";
  project?: PortfolioProjectCard | null;
  interestOptions: PortfolioInterestOption[];
  initialLinkedInterestId?: string;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (values: EditorValues) => Promise<void> | void;
}) {
  const [values, setValues] = useState<EditorValues>(buildValues(project));

  useEffect(() => {
    if (!open) return;
    const baseValues = buildValues(project);
    const linkedInterest =
      initialLinkedInterestId && mode === "create"
        ? interestOptions.find((interest) => interest.id === initialLinkedInterestId)
        : undefined;
    setValues(linkedInterest ? buildValuesFromInterestOption(linkedInterest, baseValues) : baseValues);
  }, [initialLinkedInterestId, interestOptions, mode, open, project]);

  if (!open) return null;

  const setField = <K extends keyof EditorValues>(key: K, value: EditorValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const applyInterestOption = (interestId: string) => {
    const option = interestOptions.find((interest) => interest.id === interestId);
    if (!option) return;
    setValues((current) => buildValuesFromInterestOption(option, { ...current, linkedInterestId: interestId }));
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-5xl rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(19,24,31,0.98),rgba(12,15,20,0.98))] shadow-[0_32px_100px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-text-faint)]">Portfolio War Room</div>
            <div className="mt-1 text-lg font-semibold text-[var(--color-text)]">{mode === "create" ? "New strategic bet" : `Edit ${project?.name ?? "project"}`}</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 px-3 py-1 text-sm text-[var(--color-text-muted)]">
            Close
          </button>
        </div>

        <form
          className="grid gap-5 p-5"
          onSubmit={async (event) => {
            event.preventDefault();
            await onSubmit(values);
          }}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <FieldLabel>Name</FieldLabel>
              <input value={values.name} onChange={(event) => setField("name", event.target.value)} className={fieldClass()} required />
            </div>
            <div>
              <FieldLabel>Tagline</FieldLabel>
              <input value={values.tagline} onChange={(event) => setField("tagline", event.target.value)} className={fieldClass()} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <div>
              <FieldLabel>Strategic Role</FieldLabel>
              <select value={values.strategicRole} onChange={(event) => setField("strategicRole", event.target.value)} className={fieldClass()}>
                {PORTFOLIO_ROLE_OPTIONS.filter((item) => item !== "all").map((role) => (
                  <option key={role} value={role}>
                    {labelize(role)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Stage</FieldLabel>
              <select value={values.stage} onChange={(event) => setField("stage", event.target.value)} className={fieldClass()}>
                {PORTFOLIO_STAGE_OPTIONS.filter((item) => item !== "all").map((stage) => (
                  <option key={stage} value={stage}>
                    {labelize(stage)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Signal Band</FieldLabel>
              <select value={values.signalBand} onChange={(event) => setField("signalBand", event.target.value)} className={fieldClass()}>
                {PORTFOLIO_SIGNAL_OPTIONS.map((band) => (
                  <option key={band} value={band}>
                    {signalBandLabel(band)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Linked Interest</FieldLabel>
              <select
                value={values.linkedInterestId}
                onChange={(event) => {
                  const interestId = event.target.value;
                  setField("linkedInterestId", interestId);
                  if (interestId) applyInterestOption(interestId);
                }}
                className={fieldClass()}
              >
                <option value="">None</option>
                {interestOptions.map((interest) => (
                  <option key={interest.id} value={interest.id}>
                    {interest.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <FieldLabel>Mission</FieldLabel>
              <textarea value={values.mission} onChange={(event) => setField("mission", event.target.value)} className={fieldClass(true)} />
            </div>
            <div>
              <FieldLabel>Wedge</FieldLabel>
              <textarea value={values.wedge} onChange={(event) => setField("wedge", event.target.value)} className={fieldClass(true)} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <FieldLabel>Right Tail</FieldLabel>
              <textarea value={values.rightTail} onChange={(event) => setField("rightTail", event.target.value)} className={fieldClass(true)} />
            </div>
            <div>
              <FieldLabel>Left Tail</FieldLabel>
              <textarea value={values.leftTail} onChange={(event) => setField("leftTail", event.target.value)} className={fieldClass(true)} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <FieldLabel>Current Experiment</FieldLabel>
              <input value={values.currentExperiment} onChange={(event) => setField("currentExperiment", event.target.value)} className={fieldClass()} />
            </div>
            <div>
              <FieldLabel>Success Metric</FieldLabel>
              <input value={values.successMetric} onChange={(event) => setField("successMetric", event.target.value)} className={fieldClass()} />
            </div>
            <div>
              <FieldLabel>Next Milestone</FieldLabel>
              <input value={values.nextMilestone} onChange={(event) => setField("nextMilestone", event.target.value)} className={fieldClass()} />
            </div>
            <div>
              <FieldLabel>Current Bottleneck</FieldLabel>
              <input value={values.currentBottleneck} onChange={(event) => setField("currentBottleneck", event.target.value)} className={fieldClass()} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <FieldLabel>Kill Criteria</FieldLabel>
              <textarea value={values.killCriteria} onChange={(event) => setField("killCriteria", event.target.value)} className={fieldClass(true)} />
            </div>
            <div>
              <FieldLabel>Notes / Lessons</FieldLabel>
              <textarea value={values.notes} onChange={(event) => setField("notes", event.target.value)} className={fieldClass(true)} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <div>
              <FieldLabel>Repo Name</FieldLabel>
              <input value={values.repoName} onChange={(event) => setField("repoName", event.target.value)} className={fieldClass()} />
            </div>
            <div>
              <FieldLabel>Repo URL</FieldLabel>
              <input value={values.repoUrl} onChange={(event) => setField("repoUrl", event.target.value)} className={fieldClass()} />
            </div>
            <div>
              <FieldLabel>Default Branch</FieldLabel>
              <input value={values.defaultBranch} onChange={(event) => setField("defaultBranch", event.target.value)} className={fieldClass()} />
            </div>
            <div>
              <FieldLabel>Adapter Source Path</FieldLabel>
              <input value={values.adapterSourcePath} onChange={(event) => setField("adapterSourcePath", event.target.value)} className={fieldClass()} />
            </div>
            <div>
              <FieldLabel>Last Reviewed</FieldLabel>
              <input type="date" value={values.lastReviewedAt} onChange={(event) => setField("lastReviewedAt", event.target.value)} className={fieldClass()} />
            </div>
            <label className="flex items-end gap-3 rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.9)] px-3 py-2 text-sm text-[var(--color-text)]">
              <input type="checkbox" checked={values.isActive} onChange={(event) => setField("isActive", event.target.checked)} />
              <span>Active bet</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <button type="button" onClick={onClose} className="rounded-full border border-white/10 px-4 py-2 text-sm text-[var(--color-text-muted)]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-full border border-[var(--color-border-strong)] bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-4 py-2 text-sm font-semibold text-[#111318] disabled:opacity-50"
            >
              {busy ? "Saving..." : mode === "create" ? "Create project" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
