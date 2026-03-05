import React from "react";
import type {
  AppData,
  AssumptionItem,
  BlastRadiusSnapshot,
  BlackSwanReadinessSnapshot,
  ConfidenceEvidenceMeta,
  DoctrineViolationEvent,
  ExecutionDistributionSnapshot,
  FragilityTimelinePoint,
  HedgeCoverageCell,
  MissionBottleneck,
  OptionalityBudgetState,
  RecoveryPlaybook,
  RuinLedgerItem,
  ViaNegativaItem
} from "../types";

function badgeClass(confidence?: "HIGH" | "MEDIUM" | "LOW"): string {
  if (confidence === "HIGH") return "text-emerald-300 border-emerald-500/40 bg-emerald-500/10";
  if (confidence === "LOW") return "text-red-300 border-red-500/40 bg-red-500/10";
  return "text-amber-300 border-amber-500/40 bg-amber-500/10";
}

export function ConfidenceEvidenceStrip({
  confidence,
  protocolState
}: {
  confidence?: ConfidenceEvidenceMeta;
  protocolState?: string;
}) {
  if (!confidence) return null;
  return (
    <section className="glass p-3 rounded-xl border border-white/10 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">Confidence + Evidence</div>
        <span className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-widest ${badgeClass(confidence.confidence)}`}>
          {confidence.confidence}
        </span>
      </div>
      <div className="mt-2 text-xs text-zinc-300">
        evidence {confidence.evidenceCount} | recency {confidence.recencyMinutes}m | protocol {protocolState ?? "UNKNOWN"}
      </div>
    </section>
  );
}

export function NoRuinTripwirePanel({ tripwire }: { tripwire?: AppData["tripwire"] }) {
  if (!tripwire) return null;
  const stateClass =
    tripwire.state === "BLOCK"
      ? "text-red-300 border-red-500/40 bg-red-500/10"
      : tripwire.state === "WATCH"
        ? "text-amber-300 border-amber-500/40 bg-amber-500/10"
        : "text-emerald-300 border-emerald-500/40 bg-emerald-500/10";
  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">No-Ruin Tripwire</div>
          <h3 className="text-sm font-bold text-zinc-100">Gate State</h3>
        </div>
        <span className={`rounded-md border px-2 py-1 text-[10px] uppercase tracking-widest font-semibold ${stateClass}`}>{tripwire.state}</span>
      </div>
      <div className="mt-2 text-xs text-zinc-300">{tripwire.reason}</div>
      <div className="mt-2 text-xs text-zinc-400">Recovery: {tripwire.recoveryAction}</div>
      <button
        disabled={tripwire.state !== "BLOCK"}
        className="mt-3 w-full rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-red-200 disabled:opacity-50"
      >
        Kill-Switch Console
      </button>
    </section>
  );
}

export function RuinLedgerPanel({ items }: { items?: RuinLedgerItem[] }) {
  const rows = items ?? [];
  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Ruin Ledger</div>
      <div className="space-y-2">
        {rows.slice(0, 6).map((item) => (
          <div key={item.id} className="rounded border border-white/10 bg-zinc-950/55 px-2.5 py-2 text-xs">
            <div className="font-semibold text-zinc-200 line-clamp-1">{item.title}</div>
            <div className="text-zinc-400">F {item.fragilityScore} | I {item.irreversibility} | TTI {item.timeToImpactDays}d | {item.hedgeStatus}</div>
          </div>
        ))}
      </div>
      {!rows.length && <div className="text-xs text-zinc-500">No open ruin ledger rows.</div>}
    </section>
  );
}

export function DoctrineViolationFeedPanel({ events }: { events?: DoctrineViolationEvent[] }) {
  const rows = events ?? [];
  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Doctrine Violation Feed</div>
      <div className="space-y-2">
        {rows.slice(0, 6).map((event) => (
          <div key={event.id} className="rounded border border-white/10 bg-zinc-950/55 px-2.5 py-2 text-xs">
            <div className={event.severity === "HARD_GATE" ? "text-red-300 font-semibold" : "text-amber-300 font-semibold"}>{event.severity}</div>
            <div className="text-zinc-200">{event.message}</div>
            <div className="text-zinc-500">{event.source}</div>
          </div>
        ))}
      </div>
      {!rows.length && <div className="text-xs text-zinc-500">No active doctrine violations.</div>}
    </section>
  );
}

export function DependencyBlastRadiusPanel({ snapshot }: { snapshot?: BlastRadiusSnapshot }) {
  if (!snapshot) return null;
  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Dependency Blast Radius</div>
      <div className="text-xs text-zinc-300 mb-2">nodes {snapshot.nodes.length} | edges {snapshot.edges.length}</div>
      <div className="space-y-1.5 max-h-40 overflow-auto">
        {snapshot.nodes.slice(0, 8).map((node) => (
          <div key={node.id} className="rounded border border-white/10 bg-zinc-950/55 px-2 py-1 text-xs text-zinc-300">
            {node.label} | {node.kind} | risk {node.risk}
          </div>
        ))}
      </div>
    </section>
  );
}

export function MissionBottleneckPanel({ rows }: { rows?: MissionBottleneck[] }) {
  const items = rows ?? [];
  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Mission Bottlenecks</div>
      <div className="space-y-1.5">
        {items.slice(0, 6).map((item) => (
          <div key={item.id} className="rounded border border-white/10 bg-zinc-950/55 px-2.5 py-1.5 text-xs text-zinc-300">
            {item.title} | score {item.bottleneckScore} | backlog {item.backlog}
          </div>
        ))}
      </div>
    </section>
  );
}

export function HedgeCoverageMatrixPanel({ cells }: { cells?: HedgeCoverageCell[] }) {
  const rows = cells ?? [];
  const covered = rows.filter((cell) => cell.covered).length;
  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Hedge Coverage Matrix</div>
      <div className="text-xs text-zinc-300">{covered}/{rows.length || 1} covered</div>
      <div className="mt-2 text-xs text-zinc-500">Risk x Affair coverage for top ledger rows.</div>
    </section>
  );
}

export function CorrelationRiskCard({
  concentrationPct
}: {
  concentrationPct: number;
}) {
  const band = concentrationPct >= 70 ? "CRITICAL" : concentrationPct >= 45 ? "WATCH" : "LOW";
  const tone =
    band === "CRITICAL"
      ? "text-red-300 border-red-500/30 bg-red-500/10"
      : band === "WATCH"
        ? "text-amber-300 border-amber-500/30 bg-amber-500/10"
        : "text-emerald-300 border-emerald-500/30 bg-emerald-500/10";
  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Correlation Risk</div>
      <div className={`rounded border px-2.5 py-2 text-xs ${tone}`}>
        concentration {concentrationPct.toFixed(1)}% | {band}
      </div>
      <div className="mt-2 text-xs text-zinc-500">Detects hidden same-source concentration across interests.</div>
    </section>
  );
}

export function ViaNegativaPanel({ items }: { items: ViaNegativaItem[] }) {
  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Via Negativa Queue</div>
      <div className="space-y-2">
        {items.slice(0, 6).map((item) => (
          <div key={item.id} className="rounded border border-white/10 bg-zinc-950/55 px-2.5 py-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-zinc-100">{item.title}</div>
              <span className="text-red-300">P {item.pressure}</span>
            </div>
            <div className="text-zinc-400">{item.reason}</div>
            <div className="text-zinc-500">{item.source}</div>
          </div>
        ))}
      </div>
      {!items.length && <div className="text-xs text-zinc-500">No high-pressure fragility items to prune.</div>}
    </section>
  );
}

export function BlackSwanReadinessPanel({ snapshot }: { snapshot: BlackSwanReadinessSnapshot }) {
  const tone =
    snapshot.crisisMode === "CRISIS"
      ? "text-red-300 border-red-500/35 bg-red-500/10"
      : snapshot.crisisMode === "WATCH"
        ? "text-amber-300 border-amber-500/35 bg-amber-500/10"
        : "text-emerald-300 border-emerald-500/35 bg-emerald-500/10";

  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Black Swan Readiness</div>
      <div className={`rounded border px-2.5 py-2 text-xs ${tone}`}>
        <div className="font-semibold uppercase tracking-widest">{snapshot.crisisMode}</div>
        <div className="mt-1">readiness {snapshot.readinessScore} | critical risks {snapshot.openCriticalRisks}</div>
      </div>
      <div className="mt-2 text-xs text-zinc-300">{snapshot.trigger}</div>
      <div className="mt-1 text-xs text-zinc-500">Next: {snapshot.nextAction}</div>
    </section>
  );
}

export function ExecutionDistributionPanel({ snapshot }: { snapshot: ExecutionDistributionSnapshot }) {
  const barWidth = (part: number, total: number) => `${Math.max(0, Math.min(100, total ? (part / total) * 100 : 0))}%`;

  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Execution Distribution</div>
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
            <span>Defense (Affairs)</span>
            <span>{snapshot.defense.done}/{snapshot.defense.total} done</span>
          </div>
          <div className="h-2 rounded-full border border-white/10 bg-zinc-900 overflow-hidden">
            <div className="h-full bg-blue-400/85" style={{ width: barWidth(snapshot.defense.done, snapshot.defense.total) }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
            <span>Offense (Interests)</span>
            <span>{snapshot.offense.done}/{snapshot.offense.total} done</span>
          </div>
          <div className="h-2 rounded-full border border-white/10 bg-zinc-900 overflow-hidden">
            <div className="h-full bg-emerald-400/85" style={{ width: barWidth(snapshot.offense.done, snapshot.offense.total) }} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function OptionalityBudgetPanel({ state }: { state?: OptionalityBudgetState }) {
  if (!state) return null;
  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Optionality Budget</div>
      <div className="h-2 rounded-full bg-zinc-900 border border-white/10 overflow-hidden">
        <div className={state.canAllocate ? "h-full bg-emerald-400/80" : "h-full bg-red-400/80"} style={{ width: `${state.usedPct}%` }} />
      </div>
      <div className="mt-2 text-xs text-zinc-300">used {state.usedPct}% | redline {state.redlinePct}%</div>
      <div className="mt-1 text-xs text-zinc-500">{state.rationale}</div>
    </section>
  );
}

export function ConvexityPipelinePanel({ data }: { data: AppData }) {
  const stages = data.convexityPipeline ?? [];
  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Convexity Pipeline</div>
      <div className="grid grid-cols-5 gap-2">
        {stages.map((stage) => (
          <div key={stage.id} className="rounded border border-white/10 bg-zinc-950/55 px-2 py-1 text-center">
            <div className="text-[10px] text-zinc-500 uppercase">{stage.label}</div>
            <div className="text-sm font-semibold text-zinc-100">{stage.count}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FragilityHeatTimelinePanel({ points }: { points?: FragilityTimelinePoint[] }) {
  const rows = points ?? [];
  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Fragility Heat Timeline</div>
      <div className="space-y-1.5">
        {rows.map((point) => (
          <div key={point.atIso} className="text-xs text-zinc-300 flex items-center justify-between">
            <span>{new Date(point.atIso).toLocaleDateString()}</span>
            <span>F {point.fragility} | C {point.convexity}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DecisionLatencyMeterPanel({ data }: { data: AppData }) {
  if (!data.latency) return null;
  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Decision Latency</div>
      <div className="text-lg font-bold text-zinc-100">{data.latency.signalToQueueMinutes}m</div>
      <div className="text-xs text-zinc-400">{data.latency.signalToQueueBand}</div>
    </section>
  );
}

export function CounterfactualDeltaPanel({ data }: { data: AppData }) {
  if (!data.counterfactual) return null;
  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Counterfactual Delta</div>
      <div className="text-sm font-semibold text-zinc-100">net gain {data.counterfactual.netGain}</div>
      <div className="text-xs text-zinc-400 mt-1">{data.counterfactual.note}</div>
    </section>
  );
}

export function DecisionReplayPanel({ events }: { events?: AppData["decisionReplay"] }) {
  const rows = events ?? [];
  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Decision Replay</div>
      <div className="space-y-2">
        {rows.map((event) => (
          <div key={event.id} className="rounded border border-white/10 bg-zinc-950/55 px-2.5 py-2 text-xs">
            <div className="text-zinc-500">{new Date(event.atIso).toLocaleTimeString()}</div>
            <div className="text-zinc-200">{event.state}</div>
            <div className="text-zinc-300">Action: {event.action}</div>
            <div className="text-zinc-400">Outcome: {event.outcome}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function OutcomeAttributionPanel({ data }: { data: AppData }) {
  if (!data.outcomeAttribution) return null;
  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Outcome Attribution</div>
      <div className="text-xs text-zinc-300">skill {data.outcomeAttribution.skillPct}% | luck {data.outcomeAttribution.luckPct}% | regime {data.outcomeAttribution.regimePct}%</div>
    </section>
  );
}

export function AssumptionRegisterPanel({ assumptions }: { assumptions?: AssumptionItem[] }) {
  const rows = assumptions ?? [];
  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Assumption Register</div>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.id} className="rounded border border-white/10 bg-zinc-950/55 px-2 py-1 text-xs text-zinc-300">
            <span className={row.stale ? "text-red-300 font-semibold" : "text-emerald-300 font-semibold"}>{row.stale ? "STALE" : "ACTIVE"}</span>
            {" "} {row.statement}
          </div>
        ))}
      </div>
    </section>
  );
}

export function RecoveryPlaybooksPanel({ rows }: { rows?: RecoveryPlaybook[] }) {
  const items = rows ?? [];
  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Recovery Playbooks</div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.id} className="rounded border border-white/10 bg-zinc-950/55 px-2.5 py-2 text-xs text-zinc-300">
            <div className="font-semibold text-zinc-100">{item.trigger}</div>
            <div>{item.firstAction}</div>
            <div className="text-zinc-500">{item.owner}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
