import React from "react";
import { AlertTriangle, ArrowRight, Shield, Zap } from "lucide-react";
import { AppData, Domain } from "./types";
import { HUD } from "./HUD";
import { FragilityRadar } from "./FragilityRadar";
import { TaskKillChain } from "./TaskKillChain";
import { HeatGrid } from "./charts/HeatGrid";
import { FlowLanes } from "./charts/FlowLanes";
import { StackedBalanceBar } from "./charts/StackedBalanceBar";
import { BlackSwanReadinessPanel, ViaNegativaPanel } from "./panels/RobustnessPanels";
import { computeBarbellGuardrail, computeBlackSwanReadiness, computeViaNegativaQueue } from "../../lib/war-room/operational-metrics";
import { buildWarGamingVisualSnapshot } from "../../lib/war-room/visual-encodings";

function DeepPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="khal-chamber p-5"
      style={{
        background: "linear-gradient(180deg, rgba(18,18,31,0.88), rgba(10,10,18,0.94))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 30px rgba(0,0,0,0.18)"
      }}
    >
      {children}
    </div>
  );
}

function SurfaceRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-sm border px-4 py-4"
      style={{
        borderColor: "var(--color-line)",
        background: "linear-gradient(180deg, rgba(18,18,31,0.82), rgba(10,10,18,0.9))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 24px rgba(0,0,0,0.12)"
      }}
    >
      {children}
    </div>
  );
}

export function DashboardView({
  data,
  onOpenDomain,
  onWarGameSource
}: {
  data: AppData;
  onOpenDomain: (domain: Domain) => void;
  onWarGameSource?: (sourceId: string) => void;
  onWarGameDomain?: (domainId: string) => void;
  onWarGameLineage?: (lineageNodeId: string) => void;
  onQueueAction?: () => Promise<void> | void;
}) {
  const domainsById = React.useMemo(() => new Map(data.domains.map((domain) => [domain.id, domain])), [data.domains]);
  const viaNegativa = React.useMemo(() => computeViaNegativaQueue(data, 5), [data]);
  const blackSwan = React.useMemo(() => computeBlackSwanReadiness(data), [data]);
  const barbellGuardrail = React.useMemo(
    () => computeBarbellGuardrail({ affairs: data.affairs, interests: data.interests, tasks: data.tasks, lineageRisks: data.lineageRisks, domains: data.domains }),
    [data]
  );
  const globalVisualSnapshot = React.useMemo(
    () =>
      buildWarGamingVisualSnapshot({
        sources: data.sources ?? [],
        domains: data.domains,
        affairs: data.affairs,
        interests: data.interests,
        tasks: data.tasks,
        lineageRisks: data.lineageRisks ?? []
      }),
    [data]
  );
  const sourceRows = React.useMemo(
    () =>
      (data.sources ?? []).map((source) => ({
        ...source,
        riskCount: (data.lineageRisks ?? []).filter((risk) => risk.sourceId === source.id).length
      })),
    [data.lineageRisks, data.sources]
  );

  const fallbackDecisionAcceleration = React.useMemo(
    () => ({
      virtueSpiral: {
        stage: "REDUCE_FRAGILITY" as const,
        score: 0,
        trend: "STABLE" as const,
        nextAction: "No decision telemetry available yet.",
        openFragilityMass: 0,
        convexityMass: 0,
        executionVelocity: 0
      }
    }),
    []
  );
  const decisionAcceleration = data.decisionAcceleration ?? fallbackDecisionAcceleration;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <HUD user={data.user} />

      <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-[var(--color-line)] pb-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Dashboard</div>
          <h2 className="khal-serif-hero mt-2 text-4xl text-[var(--color-text-strong)]">Global telemetry</h2>
          <p className="mt-3 max-w-3xl text-sm text-[var(--color-text-muted)]">
            This surface is only for cross-system signal. Local decision doctrine stays in War Room, War Gaming, Mission, and Vision.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          <div className="khal-subtle-panel px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Sources</div>
            <div className="mt-1 text-lg text-[var(--color-text)]">{sourceRows.length}</div>
          </div>
          <div className="khal-subtle-panel px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Domains</div>
            <div className="mt-1 text-lg text-[var(--color-text)]">{data.domains.length}</div>
          </div>
          <div className="khal-subtle-panel px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Open risks</div>
            <div className="mt-1 text-lg text-[var(--color-text)]">{(data.lineageRisks ?? []).length}</div>
          </div>
          <div className="khal-subtle-panel px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Tasks</div>
            <div className="mt-1 text-lg text-[var(--color-text)]">{data.tasks.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <DeepPanel>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Global Risk Field</div>
              <h3 className="mt-1 text-lg text-[var(--color-text-strong)]">Quadrant HeatGrid</h3>
            </div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">{(data.lineageRisks ?? []).length} risks</div>
          </div>
          <HeatGrid
            columns={globalVisualSnapshot.quadrantColumns}
            rows={globalVisualSnapshot.quadrantRows}
            cells={globalVisualSnapshot.quadrantCells}
            emptyText="No open risks to map."
          />
        </DeepPanel>

        <DeepPanel>
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Global Source Pressure</div>
            <h3 className="mt-1 text-lg text-[var(--color-text-strong)]">Source Volatility Flow</h3>
          </div>
          <FlowLanes
            nodes={globalVisualSnapshot.sourceNodes}
            lanes={globalVisualSnapshot.sourceLanes}
            links={globalVisualSnapshot.sourceLinks}
            height={220}
            emptyText="No source flow available."
          />
          <div className="mt-5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)] mb-2">Global Barbell Guardrail</div>
            <StackedBalanceBar
              segments={[
                { id: "hedge", label: `Obligations ${barbellGuardrail.activeObligationCount}`, value: barbellGuardrail.hedgeMass, tone: "hedge" },
                { id: "edge", label: `Options ${barbellGuardrail.activeOptionCount}`, value: barbellGuardrail.edgeMass, tone: "edge" }
              ]}
            />
          </div>
        </DeepPanel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-5">
          <DeepPanel>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Source Register</div>
                <h3 className="mt-1 text-lg text-[var(--color-text-strong)]">Sources of Volatility</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sourceRows.map((source) => (
                <button
                  key={source.id}
                  onClick={() => onWarGameSource?.(source.id)}
                  className="text-left transition hover:border-[var(--color-accent)]"
                >
                  <SurfaceRow>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-base text-[var(--color-text-strong)]">{source.name}</div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">{source.riskCount} risks</div>
                    </div>
                    <div className="mt-2 text-xs text-[var(--color-text-muted)]">
                      {(source.domains ?? [])
                        .map((link) => domainsById.get(link.domainId)?.name ?? link.domainId)
                        .slice(0, 3)
                        .join(" | ") || "No linked domains"}
                    </div>
                  </SurfaceRow>
                </button>
              ))}
            </div>
          </DeepPanel>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <DeepPanel>
              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Fragility Telemetry</div>
                <h3 className="mt-1 text-lg text-[var(--color-text-strong)]">Domain fragility radar</h3>
              </div>
              <FragilityRadar domains={data.domains} affairs={data.affairs} sources={data.sources} lineageRisks={data.lineageRisks} />
            </DeepPanel>

            <DeepPanel>
              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Execution Telemetry</div>
                <h3 className="mt-1 text-lg text-[var(--color-text-strong)]">Task kill chain</h3>
              </div>
              <TaskKillChain tasks={data.tasks} />
            </DeepPanel>
          </div>
        </section>

        <aside className="space-y-4">
          <DeepPanel>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Operator signal</div>
            <SurfaceRow>
              <div className="text-sm text-[var(--color-text-strong)]">{decisionAcceleration.virtueSpiral.nextAction}</div>
              <div className="mt-2 text-xs text-[var(--color-text-muted)]">
                {data.tripwire?.riskyActionBlocked ? `Blocked: ${data.tripwire.reason}` : "No hard block currently active."}
              </div>
            </SurfaceRow>
          </DeepPanel>

          <ViaNegativaPanel items={viaNegativa} />
          <BlackSwanReadinessPanel snapshot={blackSwan} />

          <DeepPanel>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Dashboard rule</div>
            <div className="mt-3 space-y-3 text-sm text-[var(--color-text-muted)]">
              <div className="flex items-start gap-3">
                <Shield size={14} className="mt-1 text-[var(--color-success)]" />
                <span>This surface is for global signal only.</span>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle size={14} className="mt-1 text-[var(--color-warning)]" />
                <span>Do not read local doctrine or make local edits here.</span>
              </div>
              <div className="flex items-start gap-3">
                <Zap size={14} className="mt-1 text-[var(--color-accent)]" />
                <span>Use this page to decide where to enter the system, then move into the correct chamber.</span>
              </div>
            </div>
          </DeepPanel>

          <DeepPanel>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Entry routes</div>
            <div className="mt-3 space-y-3">
              {data.domains.slice(0, 5).map((domain) => (
                <button
                  key={domain.id}
                  onClick={() => onOpenDomain(domain)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <SurfaceRow>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm text-[var(--color-text-strong)]">{domain.name}</div>
                        <div className="mt-1 text-xs text-[var(--color-text-muted)]">{domain.volatilitySourceName ?? domain.volatilitySource ?? domain.volatility ?? "No source mapped"}</div>
                      </div>
                      <ArrowRight size={13} className="text-[var(--color-accent)]" />
                    </div>
                  </SurfaceRow>
                </button>
              ))}
            </div>
          </DeepPanel>
        </aside>
      </div>
    </div>
  );
}
