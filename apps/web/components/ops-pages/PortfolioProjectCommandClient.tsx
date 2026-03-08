"use client";

import Link from "next/link";
import { useState } from "react";
import { Archive, ArrowLeft, Compass, Plus, Skull, Target, TestTube2 } from "lucide-react";
import { usePortfolioProjectDetail } from "../../lib/portfolio/usePortfolioWarRoomData";
import { PortfolioProjectEditor } from "../portfolio/PortfolioProjectEditor";
import { labelize, roleTone, signalBadgeClass, signalBandLabel, signalTone, stageTone } from "../portfolio/PortfolioSignals";

type ComposerKind = "ship-logs" | "evidence" | "experiments" | "gates" | null;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function textField(multiline = false) {
  return multiline
    ? "min-h-[96px] w-full rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.9)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
    : "w-full rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.9)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]";
}

function prettyDate(value?: string) {
  if (!value) return "No mark yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : `${date.toLocaleDateString()} ${value.length > 10 ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}`.trim();
}

function Section({
  title,
  subtitle,
  action,
  children
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[26px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(19,24,31,0.96),rgba(10,13,18,0.96))] p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-faint)]">{subtitle ?? "Portfolio project"}</div>
          <h2 className="mt-1 text-base font-semibold text-[var(--color-text)]">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PortfolioProjectCommandClient({ slug }: { slug: string }) {
  const { data, loading, error, refresh, setData } = usePortfolioProjectDetail(slug);
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [composer, setComposer] = useState<ComposerKind>(null);
  const [shipForm, setShipForm] = useState({ title: "", type: "code", summary: "", sourceLabel: "", sourceUrl: "", shippedAt: today() });
  const [evidenceForm, setEvidenceForm] = useState({ title: "", type: "decision", summary: "", impact: "", recordedAt: today() });
  const [experimentForm, setExperimentForm] = useState({ title: "", hypothesis: "", expectedLearning: "", status: "planned", startedAt: today(), completedAt: "", resultSummary: "" });
  const [gateForm, setGateForm] = useState({ title: "", gateType: "continue", criteria: "", status: "open", dueAt: today() });

  async function patchProject(body: Record<string, unknown>) {
    setBusy(true);
    setMutationError(null);
    try {
      const response = await fetch(`/api/portfolio/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = (await response.json()) as { project?: typeof data; error?: string };
      if (!response.ok || payload.error) throw new Error(payload.error ?? `Failed updating project (${response.status})`);
      if (payload.project) setData(payload.project);
      setEditOpen(false);
    } catch (cause) {
      setMutationError(cause instanceof Error ? cause.message : "Failed updating project.");
    } finally {
      setBusy(false);
    }
  }

  async function runLifecycle(action: "archive" | "kill" | "restore") {
    const body =
      action === "archive"
        ? { strategicRole: "archive", stage: "archived", isActive: false }
        : action === "kill"
          ? { strategicRole: "killed", stage: "archived", isActive: false }
          : { strategicRole: "option", stage: "framing", isActive: true };
    await patchProject(body);
  }

  async function submitChild(kind: Exclude<ComposerKind, null>, body: Record<string, unknown>) {
    setBusy(true);
    setMutationError(null);
    try {
      const response = await fetch(`/api/portfolio/${encodeURIComponent(slug)}/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = (await response.json()) as { project?: typeof data; error?: string };
      if (!response.ok || payload.error) throw new Error(payload.error ?? `Failed updating project (${response.status})`);
      if (payload.project) setData(payload.project);
      setComposer(null);
      await refresh();
      setShipForm({ title: "", type: "code", summary: "", sourceLabel: "", sourceUrl: "", shippedAt: today() });
      setEvidenceForm({ title: "", type: "decision", summary: "", impact: "", recordedAt: today() });
      setExperimentForm({ title: "", hypothesis: "", expectedLearning: "", status: "planned", startedAt: today(), completedAt: "", resultSummary: "" });
      setGateForm({ title: "", gateType: "continue", criteria: "", status: "open", dueAt: today() });
    } catch (cause) {
      setMutationError(cause instanceof Error ? cause.message : "Failed updating project.");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !data) {
    return <div className="mx-auto max-w-7xl p-5 text-[var(--color-text-muted)]">Loading project command page...</div>;
  }
  if (error && !data) {
    return <div className="mx-auto max-w-7xl p-5 text-[var(--color-danger)]">{error}</div>;
  }
  if (!data) return null;

  const project = data.project;
  const archivedLike = project.strategicRole === "archive" || project.strategicRole === "killed" || project.stage === "archived";

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-4 px-3 py-4">
        <section className="rounded-[30px] border border-[var(--color-border-strong)] bg-[radial-gradient(circle_at_top_left,rgba(200,154,87,0.1),transparent_28%),linear-gradient(180deg,rgba(19,24,31,0.98),rgba(10,13,18,0.98))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.3)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <Link href="/missionCommand/portfolio" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <ArrowLeft size={16} />
                Back to Portfolio War Room
              </Link>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={signalBadgeClass(roleTone(project.strategicRole))}>{labelize(project.strategicRole)}</span>
                <span className={signalBadgeClass(stageTone(project.stage))}>{labelize(project.stage)}</span>
                <span className={signalBadgeClass(signalTone(project.signalBand))}>{signalBandLabel(project.signalBand)}</span>
              </div>
              <h1 className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{project.name}</h1>
              <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">{project.tagline || "No tagline recorded yet."}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setEditOpen(true)} className="rounded-full border border-white/10 px-3 py-2 text-sm text-[var(--color-text-muted)]">
                Edit
              </button>
              {archivedLike ? (
                <button type="button" onClick={() => void runLifecycle("restore")} className="rounded-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-accent-strong)]">
                  Restore
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => void runLifecycle("archive")} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-[var(--color-text-muted)]">
                    <Archive size={14} />
                    Archive
                  </button>
                  <button type="button" onClick={() => void runLifecycle("kill")} className="inline-flex items-center gap-2 rounded-full border border-[rgba(239,68,68,0.28)] px-3 py-2 text-sm text-[var(--color-danger)]">
                    <Skull size={14} />
                    Kill
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.72)] p-3">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">Current bottleneck</div>
              <div className="mt-2 text-sm text-[var(--color-text)]">{project.currentBottleneck || "No bottleneck recorded."}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.72)] p-3">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">Next milestone</div>
              <div className="mt-2 text-sm text-[var(--color-text)]">{project.nextMilestone || "No milestone recorded."}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.72)] p-3">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">Linked interest</div>
              <div className="mt-2 text-sm text-[var(--color-text)]">{project.linkedInterest?.title || "No linked interest"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.72)] p-3">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">Last ship</div>
              <div className="mt-2 text-sm text-[var(--color-text)]">{project.latestShip?.title || "No ship log yet"}</div>
              <div className="mt-1 text-xs text-[var(--color-text-muted)]">{prettyDate(project.lastShippedAt)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.72)] p-3">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">Runtime signal</div>
              <div className={`mt-2 text-sm ${data.runtimeInvariants.projectionHealthy ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                {data.runtimeInvariants.projectionHealthy ? "Healthy" : "Check invariants"}
              </div>
              <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                {data.runtimeInvariants.hardViolationCount} hard / {data.runtimeInvariants.softViolationCount} soft
              </div>
            </div>
          </div>
        </section>

        {mutationError ? <div className="rounded-2xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.12)] p-3 text-sm text-[var(--color-danger)]">{mutationError}</div> : null}

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.85fr]">
          <div className="space-y-4">
            <Section title="Mission" subtitle="Strategic frame" action={<Compass size={16} className="text-[var(--color-accent-strong)]" />}>
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.72)] p-4 text-sm text-[var(--color-text)]">{project.mission || "No mission recorded yet."}</div>
                <div className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.72)] p-4 text-sm text-[var(--color-text)]">{project.wedge || "No wedge recorded yet."}</div>
              </div>
            </Section>

            <Section title="Current experiment" subtitle="Learning loop" action={<TestTube2 size={16} className="text-[var(--color-accent-strong)]" />}>
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.72)] p-4">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">Current experiment summary</div>
                  <div className="mt-2 text-sm text-[var(--color-text)]">{project.currentExperiment || project.activeExperiment?.title || "No experiment summary recorded."}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.72)] p-4">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">Next gate</div>
                  <div className="mt-2 text-sm text-[var(--color-text)]">{project.nextGate?.title || "No active gate yet."}</div>
                  <div className="mt-1 text-xs text-[var(--color-text-muted)]">{project.nextGate?.status ? `${project.nextGate.status} / ${project.nextGate.gateType}` : "Decision still implicit"}</div>
                </div>
              </div>
            </Section>

            <Section title="Shipping log" subtitle="What shipped">
              <div className="mb-4 flex justify-end">
                <button type="button" onClick={() => setComposer(composer === "ship-logs" ? null : "ship-logs")} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--color-text-muted)]">
                  <Plus size={14} />
                  Add ship
                </button>
              </div>
              {composer === "ship-logs" ? (
                <form
                  className="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.72)] p-4 lg:grid-cols-2"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    await submitChild("ship-logs", shipForm);
                  }}
                >
                  <input className={textField()} placeholder="Title" value={shipForm.title} onChange={(event) => setShipForm((current) => ({ ...current, title: event.target.value }))} required />
                  <select className={textField()} value={shipForm.type} onChange={(event) => setShipForm((current) => ({ ...current, type: event.target.value }))}>
                    <option value="code">code</option>
                    <option value="spec">spec</option>
                    <option value="doc">doc</option>
                    <option value="design">design</option>
                    <option value="release">release</option>
                    <option value="research">research</option>
                    <option value="prompt">prompt</option>
                  </select>
                  <textarea className={textField(true)} placeholder="Summary" value={shipForm.summary} onChange={(event) => setShipForm((current) => ({ ...current, summary: event.target.value }))} />
                  <div className="grid gap-3">
                    <input className={textField()} placeholder="Source label" value={shipForm.sourceLabel} onChange={(event) => setShipForm((current) => ({ ...current, sourceLabel: event.target.value }))} />
                    <input className={textField()} placeholder="Source URL" value={shipForm.sourceUrl} onChange={(event) => setShipForm((current) => ({ ...current, sourceUrl: event.target.value }))} />
                    <input type="date" className={textField()} value={shipForm.shippedAt} onChange={(event) => setShipForm((current) => ({ ...current, shippedAt: event.target.value }))} />
                  </div>
                  <div className="lg:col-span-2 flex justify-end gap-2">
                    <button type="button" onClick={() => setComposer(null)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--color-text-muted)]">Cancel</button>
                    <button type="submit" disabled={busy} className="rounded-full border border-[var(--color-border-strong)] px-3 py-1 text-xs text-[var(--color-accent-strong)]">Save ship log</button>
                  </div>
                </form>
              ) : null}
              <div className="space-y-3">
                {data.shipLogs.map((ship) => (
                  <div key={ship.id} className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.72)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-[var(--color-text)]">{ship.title}</div>
                        <div className="mt-1 text-xs text-[var(--color-text-muted)]">{ship.type}</div>
                      </div>
                      <div className="text-xs text-[var(--color-text-faint)]">{prettyDate(ship.shippedAt)}</div>
                    </div>
                    {ship.summary ? <div className="mt-2 text-sm text-[var(--color-text-muted)]">{ship.summary}</div> : null}
                  </div>
                ))}
                {data.shipLogs.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-[var(--color-text-muted)]">No shipping recorded yet.</div> : null}
              </div>
            </Section>

            <Section title="Evidence" subtitle="What changed belief">
              <div className="mb-4 flex justify-end">
                <button type="button" onClick={() => setComposer(composer === "evidence" ? null : "evidence")} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--color-text-muted)]">
                  <Plus size={14} />
                  Add evidence
                </button>
              </div>
              {composer === "evidence" ? (
                <form
                  className="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.72)] p-4 lg:grid-cols-2"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    await submitChild("evidence", evidenceForm);
                  }}
                >
                  <input className={textField()} placeholder="Title" value={evidenceForm.title} onChange={(event) => setEvidenceForm((current) => ({ ...current, title: event.target.value }))} required />
                  <select className={textField()} value={evidenceForm.type} onChange={(event) => setEvidenceForm((current) => ({ ...current, type: event.target.value }))}>
                    <option value="user-signal">user-signal</option>
                    <option value="metric">metric</option>
                    <option value="observation">observation</option>
                    <option value="decision">decision</option>
                    <option value="market">market</option>
                    <option value="technical">technical</option>
                  </select>
                  <textarea className={textField(true)} placeholder="Summary" value={evidenceForm.summary} onChange={(event) => setEvidenceForm((current) => ({ ...current, summary: event.target.value }))} required />
                  <div className="grid gap-3">
                    <textarea className={textField(true)} placeholder="Impact" value={evidenceForm.impact} onChange={(event) => setEvidenceForm((current) => ({ ...current, impact: event.target.value }))} />
                    <input type="date" className={textField()} value={evidenceForm.recordedAt} onChange={(event) => setEvidenceForm((current) => ({ ...current, recordedAt: event.target.value }))} />
                  </div>
                  <div className="lg:col-span-2 flex justify-end gap-2">
                    <button type="button" onClick={() => setComposer(null)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--color-text-muted)]">Cancel</button>
                    <button type="submit" disabled={busy} className="rounded-full border border-[var(--color-border-strong)] px-3 py-1 text-xs text-[var(--color-accent-strong)]">Save evidence</button>
                  </div>
                </form>
              ) : null}
              <div className="space-y-3">
                {data.evidence.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.72)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-[var(--color-text)]">{item.title}</div>
                        <div className="mt-1 text-xs text-[var(--color-text-muted)]">{item.type}</div>
                      </div>
                      <div className="text-xs text-[var(--color-text-faint)]">{prettyDate(item.recordedAt)}</div>
                    </div>
                    <div className="mt-2 text-sm text-[var(--color-text-muted)]">{item.summary}</div>
                    {item.impact ? <div className="mt-2 text-sm text-[var(--color-text)]">{item.impact}</div> : null}
                  </div>
                ))}
                {data.evidence.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-[var(--color-text-muted)]">No evidence recorded yet.</div> : null}
              </div>
            </Section>
          </div>
          <div className="space-y-4">
            <Section title="Experiments" subtitle="Live and planned probes">
              <div className="mb-4 flex justify-end">
                <button type="button" onClick={() => setComposer(composer === "experiments" ? null : "experiments")} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--color-text-muted)]">
                  <Plus size={14} />
                  Add experiment
                </button>
              </div>
              {composer === "experiments" ? (
                <form
                  className="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.72)] p-4"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    await submitChild("experiments", experimentForm);
                  }}
                >
                  <input className={textField()} placeholder="Title" value={experimentForm.title} onChange={(event) => setExperimentForm((current) => ({ ...current, title: event.target.value }))} required />
                  <textarea className={textField(true)} placeholder="Hypothesis" value={experimentForm.hypothesis} onChange={(event) => setExperimentForm((current) => ({ ...current, hypothesis: event.target.value }))} required />
                  <textarea className={textField(true)} placeholder="Expected learning" value={experimentForm.expectedLearning} onChange={(event) => setExperimentForm((current) => ({ ...current, expectedLearning: event.target.value }))} />
                  <div className="grid gap-3 lg:grid-cols-3">
                    <select className={textField()} value={experimentForm.status} onChange={(event) => setExperimentForm((current) => ({ ...current, status: event.target.value }))}>
                      <option value="planned">planned</option>
                      <option value="active">active</option>
                      <option value="paused">paused</option>
                      <option value="complete">complete</option>
                      <option value="killed">killed</option>
                    </select>
                    <input type="date" className={textField()} value={experimentForm.startedAt} onChange={(event) => setExperimentForm((current) => ({ ...current, startedAt: event.target.value }))} />
                    <input type="date" className={textField()} value={experimentForm.completedAt} onChange={(event) => setExperimentForm((current) => ({ ...current, completedAt: event.target.value }))} />
                  </div>
                  <textarea className={textField(true)} placeholder="Result summary" value={experimentForm.resultSummary} onChange={(event) => setExperimentForm((current) => ({ ...current, resultSummary: event.target.value }))} />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setComposer(null)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--color-text-muted)]">Cancel</button>
                    <button type="submit" disabled={busy} className="rounded-full border border-[var(--color-border-strong)] px-3 py-1 text-xs text-[var(--color-accent-strong)]">Save experiment</button>
                  </div>
                </form>
              ) : null}
              <div className="space-y-3">
                {data.experiments.map((experiment) => (
                  <div key={experiment.id} className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.72)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-[var(--color-text)]">{experiment.title}</div>
                        <div className="mt-1 text-xs text-[var(--color-text-muted)]">{experiment.status}</div>
                      </div>
                      <div className="text-xs text-[var(--color-text-faint)]">{prettyDate(experiment.startedAt)}</div>
                    </div>
                    <div className="mt-2 text-sm text-[var(--color-text-muted)]">{experiment.hypothesis}</div>
                    {experiment.expectedLearning ? <div className="mt-2 text-sm text-[var(--color-text)]">{experiment.expectedLearning}</div> : null}
                    {experiment.resultSummary ? <div className="mt-2 text-sm text-[var(--color-text-muted)]">{experiment.resultSummary}</div> : null}
                  </div>
                ))}
                {data.experiments.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-[var(--color-text-muted)]">No experiments yet.</div> : null}
              </div>
            </Section>

            <Section title="Decision gates" subtitle="Explicit next decisions">
              <div className="mb-4 flex justify-end">
                <button type="button" onClick={() => setComposer(composer === "gates" ? null : "gates")} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--color-text-muted)]">
                  <Plus size={14} />
                  Add gate
                </button>
              </div>
              {composer === "gates" ? (
                <form
                  className="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.72)] p-4"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    await submitChild("gates", gateForm);
                  }}
                >
                  <input className={textField()} placeholder="Title" value={gateForm.title} onChange={(event) => setGateForm((current) => ({ ...current, title: event.target.value }))} required />
                  <textarea className={textField(true)} placeholder="Criteria" value={gateForm.criteria} onChange={(event) => setGateForm((current) => ({ ...current, criteria: event.target.value }))} required />
                  <div className="grid gap-3 lg:grid-cols-3">
                    <select className={textField()} value={gateForm.gateType} onChange={(event) => setGateForm((current) => ({ ...current, gateType: event.target.value }))}>
                      <option value="continue">continue</option>
                      <option value="scale">scale</option>
                      <option value="pause">pause</option>
                      <option value="archive">archive</option>
                      <option value="kill">kill</option>
                    </select>
                    <select className={textField()} value={gateForm.status} onChange={(event) => setGateForm((current) => ({ ...current, status: event.target.value }))}>
                      <option value="open">open</option>
                      <option value="watch">watch</option>
                      <option value="cleared">cleared</option>
                      <option value="triggered">triggered</option>
                    </select>
                    <input type="date" className={textField()} value={gateForm.dueAt} onChange={(event) => setGateForm((current) => ({ ...current, dueAt: event.target.value }))} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setComposer(null)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--color-text-muted)]">Cancel</button>
                    <button type="submit" disabled={busy} className="rounded-full border border-[var(--color-border-strong)] px-3 py-1 text-xs text-[var(--color-accent-strong)]">Save gate</button>
                  </div>
                </form>
              ) : null}
              <div className="space-y-3">
                {data.decisionGates.map((gate) => (
                  <div key={gate.id} className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.72)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-[var(--color-text)]">{gate.title}</div>
                        <div className="mt-1 text-xs text-[var(--color-text-muted)]">{gate.gateType} / {gate.status}</div>
                      </div>
                      <div className="text-xs text-[var(--color-text-faint)]">{prettyDate(gate.dueAt)}</div>
                    </div>
                    <div className="mt-2 text-sm text-[var(--color-text-muted)]">{gate.criteria}</div>
                  </div>
                ))}
                {data.decisionGates.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-[var(--color-text-muted)]">No decision gates yet.</div> : null}
              </div>
            </Section>

            <Section title="Kill criteria and notes" subtitle="Anti-delusion memory" action={<Target size={16} className="text-[var(--color-accent-strong)]" />}>
              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.72)] p-4 text-sm text-[var(--color-text)]">{project.killCriteria || "No kill criteria recorded yet."}</div>
                <div className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.72)] p-4 text-sm text-[var(--color-text-muted)]">{project.notes || "No notes or retained lesson recorded yet."}</div>
                <div className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.72)] p-4 text-sm text-[var(--color-text-muted)]">
                  Repo adapter: {project.adapter?.adapterKind ?? "manual"}
                  <div className="mt-2 text-xs">
                    {project.adapter?.sourcePath ? `Source path: ${project.adapter.sourcePath}` : "Future contract ready for project.meta.json ingestion."}
                  </div>
                </div>
              </div>
            </Section>
          </div>
        </div>
      </div>
      <PortfolioProjectEditor
        open={editOpen}
        mode="edit"
        project={project}
        interestOptions={data.interestOptions}
        busy={busy}
        onClose={() => setEditOpen(false)}
        onSubmit={patchProject}
      />
    </>
  );
}
