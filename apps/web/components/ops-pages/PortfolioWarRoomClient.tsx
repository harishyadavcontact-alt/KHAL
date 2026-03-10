"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Archive,
  ArrowRight,
  Compass,
  Crosshair,
  Filter,
  Flame,
  Layers3,
  Plus,
  Radar,
  Skull,
  TestTube2
} from "lucide-react";
import { usePortfolioWarRoomData } from "../../lib/portfolio/usePortfolioWarRoomData";
import { filterPortfolioProjects, sortPortfolioProjects, type PortfolioSortKey } from "../../lib/portfolio/view-model";
import { PortfolioProjectEditor } from "../portfolio/PortfolioProjectEditor";
import {
  PORTFOLIO_ROLE_OPTIONS,
  PORTFOLIO_STAGE_OPTIONS,
  labelize,
  movementTone,
  roleTone,
  signalBandLabel,
  signalBadgeClass,
  signalTone,
  stageTone
} from "../portfolio/PortfolioSignals";

type DensityMode = "comfortable" | "dense";
type SurfaceMode = "board" | "cemetery";

function prettyDate(value?: string) {
  if (!value) return "No recent mark";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function SectionFrame({
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
    <section className="rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(20,25,32,0.96),rgba(11,15,20,0.94))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-text-faint)]">{subtitle ?? "Portfolio War Room"}</div>
          <h2 className="mt-1 text-base font-semibold text-[var(--color-text)]">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.75)] p-3">
      <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${tone ?? "text-[var(--color-text)]"}`}>{value}</div>
    </div>
  );
}

export function PortfolioWarRoomClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, loading, error, refresh, setData } = usePortfolioWarRoomData();
  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>("board");
  const [roleFilter, setRoleFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [sortKey, setSortKey] = useState<PortfolioSortKey>("attention");
  const [activeOnly, setActiveOnly] = useState(true);
  const [density, setDensity] = useState<DensityMode>("comfortable");
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const initialInterestId = searchParams.get("interestId") ?? undefined;

  const visibleProjects = useMemo(() => {
    if (!data) return [];
    const filtered = filterPortfolioProjects({
      projects: data.projects,
      role: roleFilter,
      stage: stageFilter,
      activeOnly: surfaceMode === "cemetery" ? false : activeOnly,
      cemeteryMode: surfaceMode === "cemetery"
    });
    return sortPortfolioProjects(filtered, sortKey);
  }, [activeOnly, data, roleFilter, sortKey, stageFilter, surfaceMode]);

  useEffect(() => {
    if (!initialInterestId || !data) return;
    const alreadyLinked = data.projects.some((project) => project.linkedInterestId === initialInterestId);
    if (!alreadyLinked) setCreateOpen(true);
  }, [data, initialInterestId]);

  async function createProject(values: Record<string, unknown>) {
    setBusy(true);
    setMutationError(null);
    try {
      const response = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const payload = (await response.json()) as { created?: { project?: { slug: string } }; snapshot?: typeof data; error?: string };
      if (!response.ok || payload.error) throw new Error(payload.error ?? `Failed creating project (${response.status})`);
      if (payload.snapshot) setData(payload.snapshot);
      setCreateOpen(false);
      if (payload.created?.project?.slug) router.push(`/missionCommand/portfolio/${encodeURIComponent(payload.created.project.slug)}`);
    } catch (cause) {
      setMutationError(cause instanceof Error ? cause.message : "Failed creating project.");
    } finally {
      setBusy(false);
    }
  }

  async function applyLifecycle(slug: string, action: "archive" | "kill" | "restore") {
    setBusy(true);
    setMutationError(null);
    try {
      const body =
        action === "archive"
          ? { strategicRole: "archive", stage: "archived", isActive: false }
          : action === "kill"
            ? { strategicRole: "killed", stage: "archived", isActive: false }
            : { strategicRole: "option", stage: "framing", isActive: true };
      const response = await fetch(`/api/portfolio/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = (await response.json()) as { snapshot?: typeof data; error?: string };
      if (!response.ok || payload.error) throw new Error(payload.error ?? `Failed updating lifecycle (${response.status})`);
      if (payload.snapshot) setData(payload.snapshot);
      await refresh({ force: true });
    } catch (cause) {
      setMutationError(cause instanceof Error ? cause.message : "Failed updating project.");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !data) {
    return <div className="mx-auto max-w-7xl p-5 text-[var(--color-text-muted)]">Loading Portfolio War Room...</div>;
  }
  if (error && !data) {
    return <div className="mx-auto max-w-7xl p-5 text-[var(--color-danger)]">{error}</div>;
  }
  if (!data) return null;

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-4 px-3 py-4">
        <section className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
          <div className="rounded-[32px] border border-[var(--color-border-strong)] bg-[radial-gradient(circle_at_top_left,rgba(200,154,87,0.12),transparent_32%),linear-gradient(180deg,rgba(19,24,31,0.96),rgba(10,13,18,0.98))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <div className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-faint)]">Mission Command</div>
                <h1 className="mt-2 text-3xl font-semibold text-[var(--color-text)]">Portfolio War Room</h1>
                <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--color-text-muted)]">
                  Command the full bet stack from one surface. Keep doctrine separate from execution, keep signal stronger than prose, and make attention allocation obvious in seconds.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/missionCommand" className="rounded-full border border-white/10 px-3 py-2 text-sm text-[var(--color-text-muted)]">
                  Back to Mission Command
                </Link>
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-4 py-2 text-sm font-semibold text-[#111318]"
                >
                  <Plus size={16} />
                  New bet
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              <MetricCard label="Active Bets" value={data.summary.activeProjects} tone="text-[var(--color-accent-strong)]" />
              <MetricCard label="Shipping" value={data.summary.shippingProjects} tone="text-[var(--color-success)]" />
              <MetricCard label="Stalled" value={data.summary.stalledProjects} tone="text-[var(--color-danger)]" />
              <MetricCard label="Archived / Killed" value={data.summary.archivedOrKilledProjects} tone="text-[var(--color-text-muted)]" />
              <MetricCard label="Core Conviction" value={data.summary.activeCoreCount} />
              <MetricCard label="Option Lane" value={data.summary.optionLikeCount} />
            </div>
          </div>

          <div className="rounded-[32px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(18,22,29,0.96),rgba(11,15,20,0.98))] p-5">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-text-faint)]">Command Signal</div>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.78)] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">Strong signal</span>
                  <span className={signalBadgeClass(signalTone("high"))}>{data.summary.signalBands.find((item) => item.label === "high")?.count ?? 0}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.78)] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">Watch list</span>
                  <span className={signalBadgeClass(signalTone("watch"))}>{data.summary.signalBands.find((item) => item.label === "watch")?.count ?? 0}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.78)] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">Weak signal</span>
                  <span className={signalBadgeClass(signalTone("low"))}>{data.summary.signalBands.find((item) => item.label === "low")?.count ?? 0}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.78)] p-3 text-sm text-[var(--color-text-muted)]">
                Runtime healthy:{" "}
                <span className={data.runtimeInvariants.projectionHealthy ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}>
                  {data.runtimeInvariants.projectionHealthy ? "yes" : "no"}
                </span>
                <div className="mt-2 text-xs">
                  {data.runtimeInvariants.hardViolationCount} hard / {data.runtimeInvariants.softViolationCount} soft invariant signals
                </div>
              </div>
            </div>
          </div>
        </section>

        <SectionFrame
          title="Command board"
          subtitle="Portfolio filters"
          action={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSurfaceMode("board")}
                className={surfaceMode === "board" ? signalBadgeClass(roleTone("core")) : "rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]"}
              >
                Board
              </button>
              <button
                type="button"
                onClick={() => setSurfaceMode("cemetery")}
                className={surfaceMode === "cemetery" ? signalBadgeClass(stageTone("archived")) : "rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]"}
              >
                Cemetery
              </button>
            </div>
          }
        >
          <div className="grid gap-3 xl:grid-cols-[repeat(5,minmax(0,1fr))_auto_auto]">
            <label className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.78)] p-3">
              <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">
                <Filter size={14} />
                Role
              </div>
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="w-full bg-transparent text-sm text-[var(--color-text)] outline-none">
                {PORTFOLIO_ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role} className="bg-[#10151c]">
                    {labelize(role)}
                  </option>
                ))}
              </select>
            </label>
            <label className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.78)] p-3">
              <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">Stage</div>
              <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)} className="w-full bg-transparent text-sm text-[var(--color-text)] outline-none">
                {PORTFOLIO_STAGE_OPTIONS.map((stage) => (
                  <option key={stage} value={stage} className="bg-[#10151c]">
                    {labelize(stage)}
                  </option>
                ))}
              </select>
            </label>
            <label className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.78)] p-3">
              <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">Sort</div>
              <select value={sortKey} onChange={(event) => setSortKey(event.target.value as PortfolioSortKey)} className="w-full bg-transparent text-sm text-[var(--color-text)] outline-none">
                <option value="attention" className="bg-[#10151c]">attention now</option>
                <option value="signal" className="bg-[#10151c]">signal</option>
                <option value="ship" className="bg-[#10151c]">last ship</option>
                <option value="name" className="bg-[#10151c]">name</option>
              </select>
            </label>
            <div className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.78)] p-3">
              <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">Density</div>
              <div className="flex gap-2">
                {(["comfortable", "dense"] as DensityMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDensity(mode)}
                    className={density === mode ? signalBadgeClass(signalTone("watch")) : "rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--color-text-muted)]"}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.78)] p-3 text-sm text-[var(--color-text)]">
              <input type="checkbox" checked={activeOnly} onChange={(event) => setActiveOnly(event.target.checked)} />
              Active only
            </label>
            <div className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.78)] p-3 text-sm text-[var(--color-text-muted)]">
              {visibleProjects.length} visible
            </div>
            <div className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.78)] p-3 text-sm text-[var(--color-text-muted)]">
              Last ship {prettyDate(data.summary.lastShipAt)}
            </div>
          </div>
        </SectionFrame>

        {mutationError ? <div className="rounded-2xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.12)] p-3 text-sm text-[var(--color-danger)]">{mutationError}</div> : null}

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
          <SectionFrame title={surfaceMode === "board" ? "Active portfolio tiles" : "Cemetery and lessons"} subtitle="One picture is worth 100 words">
            <div className={`grid gap-3 ${density === "dense" ? "xl:grid-cols-2" : "xl:grid-cols-2"}`}>
              {surfaceMode === "board"
                ? visibleProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => router.push(`/missionCommand/portfolio/${encodeURIComponent(project.slug)}`)}
                      className={`group rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,21,28,0.96),rgba(9,12,17,0.96))] p-4 text-left transition hover:border-[var(--color-border-strong)] hover:shadow-[0_22px_64px_rgba(0,0,0,0.3)] ${
                        density === "dense" ? "min-h-[280px]" : "min-h-[340px]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <span className={signalBadgeClass(roleTone(project.strategicRole))}>{labelize(project.strategicRole)}</span>
                            <span className={signalBadgeClass(stageTone(project.stage))}>{labelize(project.stage)}</span>
                            <span className={signalBadgeClass(signalTone(project.signalBand))}>{signalBandLabel(project.signalBand)}</span>
                          </div>
                          <div className="mt-3 text-xl font-semibold text-[var(--color-text)]">{project.name}</div>
                          <div className="mt-1 text-sm text-[var(--color-text-muted)]">{project.tagline || "No tagline recorded yet."}</div>
                        </div>
                        <div className={`text-xs font-semibold uppercase tracking-[0.22em] ${movementTone(project.movementState)}`}>{project.movementState}</div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">Bottleneck</div>
                          <div className="mt-2 text-sm text-[var(--color-text)]">{project.currentBottleneck || "No bottleneck recorded."}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">Next irreversible milestone</div>
                          <div className="mt-2 text-sm text-[var(--color-text)]">{project.nextMilestone || "No next milestone recorded."}</div>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">Last ship</div>
                          <div className="mt-2 text-sm text-[var(--color-text)]">{project.latestShip?.title || "No shipping signal yet."}</div>
                          <div className="mt-1 text-xs text-[var(--color-text-muted)]">{prettyDate(project.latestShip?.shippedAt)}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">Active experiment</div>
                          <div className="mt-2 text-sm text-[var(--color-text)]">{project.activeExperiment?.title || project.currentExperiment || "No active experiment recorded."}</div>
                          <div className="mt-1 text-xs text-[var(--color-text-muted)]">{project.activeExperiment?.status ?? "No experiment loop"}</div>
                        </div>
                      </div>

                      {!density || density === "comfortable" ? (
                        <div className="mt-3 rounded-2xl border border-white/10 bg-black/10 p-3 text-sm text-[var(--color-text-muted)]">
                          {project.mission || project.wedge || "No mission summary recorded yet."}
                        </div>
                      ) : null}

                      <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                        <div className="flex flex-wrap gap-3">
                          <span>{project.shipCount} ships</span>
                          <span>{project.experimentCount} experiments</span>
                          <span>{project.evidenceCount} evidence</span>
                          {project.linkedInterest ? <span>Interest: {project.linkedInterest.title}</span> : null}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[var(--color-accent-strong)]">
                          Open
                          <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </button>
                  ))
                : data.cemetery
                    .filter((entry) => (roleFilter === "all" || entry.project.strategicRole === roleFilter) && (stageFilter === "all" || entry.project.stage === stageFilter))
                    .map((entry) => (
                      <div key={entry.project.id} className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,21,28,0.96),rgba(9,12,17,0.96))] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap gap-2">
                              <span className={signalBadgeClass(roleTone(entry.project.strategicRole))}>{labelize(entry.project.strategicRole)}</span>
                              <span className={signalBadgeClass(stageTone(entry.project.stage))}>{labelize(entry.project.stage)}</span>
                            </div>
                            <div className="mt-3 text-xl font-semibold text-[var(--color-text)]">{entry.project.name}</div>
                            <div className="mt-1 text-sm text-[var(--color-text-muted)]">{entry.project.tagline || "No tagline recorded."}</div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => void applyLifecycle(entry.project.slug, "restore")}
                              className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--color-text-muted)]"
                            >
                              Restore
                            </button>
                            <Link href={`/missionCommand/portfolio/${encodeURIComponent(entry.project.slug)}`} className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-accent-strong)]">
                              Open
                            </Link>
                          </div>
                        </div>
                        <div className="mt-3 grid gap-3 lg:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">Why archived / killed</div>
                            <div className="mt-2 text-sm text-[var(--color-text)]">{entry.why}</div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">Lesson retained</div>
                            <div className="mt-2 text-sm text-[var(--color-text)]">{entry.lesson}</div>
                          </div>
                        </div>
                      </div>
                    ))}
              {visibleProjects.length === 0 && surfaceMode === "board" ? (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-[rgba(10,13,18,0.72)] p-6 text-sm text-[var(--color-text-muted)]">
                  No projects match the current filters.
                </div>
              ) : null}
              {surfaceMode === "cemetery" && data.cemetery.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-[rgba(10,13,18,0.72)] p-6 text-sm text-[var(--color-text-muted)]">
                  No archived or killed bets yet.
                </div>
              ) : null}
            </div>
          </SectionFrame>

          <div className="space-y-4">
            <SectionFrame title="Shipping radar" subtitle="Recent motion" action={<Radar size={16} className="text-[var(--color-accent-strong)]" />}>
              <div className="space-y-3">
                {data.shippingRadar.slice(0, 8).map((ship) => (
                  <div key={ship.id} className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.75)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-[var(--color-text)]">{ship.title}</div>
                        <div className="mt-1 text-xs text-[var(--color-text-muted)]">{ship.projectName} / {ship.type}</div>
                      </div>
                      <span className="text-xs text-[var(--color-text-faint)]">{prettyDate(ship.shippedAt)}</span>
                    </div>
                    {ship.summary ? <div className="mt-2 text-sm text-[var(--color-text-muted)]">{ship.summary}</div> : null}
                  </div>
                ))}
                {data.shippingRadar.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-[var(--color-text-muted)]">No shipping motion recorded yet.</div> : null}
              </div>
            </SectionFrame>

            <SectionFrame title="Experiment board" subtitle="Active learning loops" action={<TestTube2 size={16} className="text-[var(--color-accent-strong)]" />}>
              <div className="space-y-3">
                {data.experimentBoard.slice(0, 8).map((experiment) => (
                  <div key={experiment.id} className="rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.75)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-[var(--color-text)]">{experiment.title}</div>
                        <div className="mt-1 text-xs text-[var(--color-text-muted)]">{experiment.projectName} / {experiment.status}</div>
                      </div>
                      <span className={signalBadgeClass(signalTone(experiment.signalBand))}>{signalBandLabel(experiment.signalBand)}</span>
                    </div>
                    <div className="mt-2 text-sm text-[var(--color-text-muted)]">{experiment.hypothesis}</div>
                    <div className="mt-2 text-xs text-[var(--color-text-faint)]">
                      {experiment.nextGate ? `Next gate: ${experiment.nextGate.title}` : "No gate attached yet."}
                    </div>
                  </div>
                ))}
                {data.experimentBoard.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-[var(--color-text-muted)]">No active experiments recorded yet.</div> : null}
              </div>
            </SectionFrame>

            <SectionFrame title="Commander prompts" subtitle="What should receive attention now?" action={<Compass size={16} className="text-[var(--color-accent-strong)]" />}>
              <div className="space-y-3 text-sm text-[var(--color-text-muted)]">
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.75)] p-3">
                  <Flame size={16} className="mt-0.5 text-[var(--color-danger)]" />
                  <div>Prioritize any core bet that is stalled or shipping but lacks a clear next gate.</div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.75)] p-3">
                  <Crosshair size={16} className="mt-0.5 text-[var(--color-accent-strong)]" />
                  <div>Keep probes small. If a probe cannot produce learning quickly, kill it rather than letting it blur into option theater.</div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.75)] p-3">
                  <Layers3 size={16} className="mt-0.5 text-[var(--color-accent-cool)]" />
                  <div>Use the cemetery as anti-delusion memory. Archive and killed bets should retain lessons, not fresh attention.</div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[rgba(10,13,18,0.75)] p-3">
                  <Activity size={16} className="mt-0.5 text-[var(--color-success)]" />
                  <div>Manual ship logs are enough for v1. The adapter stub keeps a clean path open for future repo metadata ingestion.</div>
                </div>
              </div>
            </SectionFrame>
          </div>
        </div>
      </div>

      <PortfolioProjectEditor
        open={createOpen}
        mode="create"
        interestOptions={data.interestOptions}
        initialLinkedInterestId={initialInterestId}
        busy={busy}
        onClose={() => setCreateOpen(false)}
        onSubmit={createProject}
      />
    </>
  );
}
