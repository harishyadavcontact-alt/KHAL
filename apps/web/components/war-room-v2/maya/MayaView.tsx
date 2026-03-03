"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { AppData, MayaLane } from "../types";
import { buildMayaFlowSnapshot } from "../../../lib/war-room/maya-metrics";
import { lawAliasForLabel } from "../../../lib/war-room/law-aliases";
import { IntentMirrorPanel } from "./IntentMirrorPanel";

const LANE_COLOR: Record<MayaLane, string> = {
  CAVE: "#f59e0b",
  CONVEX: "#22c55e"
};

function badgeClass(lane: MayaLane): string {
  return lane === "CONVEX"
    ? "rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-emerald-300"
    : "rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-300";
}

function lineOpacity(activeSourceId: string | null, sourceId: string): number {
  if (!activeSourceId) return 0.65;
  return activeSourceId === sourceId ? 1 : 0.2;
}

function nodeY(index: number, total: number): number {
  if (total <= 1) return 50;
  const start = 12;
  const span = 76;
  return start + (index / (total - 1)) * span;
}

export function MayaView({ data }: { data: AppData }) {
  const router = useRouter();
  const snapshot = React.useMemo(() => buildMayaFlowSnapshot(data), [data]);
  const [activeSourceId, setActiveSourceId] = React.useState<string | null>(snapshot.sources[0]?.sourceId ?? null);

  React.useEffect(() => {
    if (!snapshot.sources.length) {
      setActiveSourceId(null);
      return;
    }
    setActiveSourceId((prev) => (prev && snapshot.sources.some((source) => source.sourceId === prev) ? prev : snapshot.sources[0].sourceId));
  }, [snapshot.sources]);

  const activeSource = snapshot.sources.find((source) => source.sourceId === activeSourceId) ?? snapshot.sources[0] ?? null;
  const convexCount = snapshot.sources.filter((source) => source.lane === "CONVEX").length;
  const caveCount = snapshot.sources.filter((source) => source.lane === "CAVE").length;

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-5">
      <IntentMirrorPanel data={data} mayaSnapshot={snapshot} />

      <section className="glass rounded-xl border border-white/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-zinc-100">Maya: Causal Opacity Flow</h2>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">Read-only signal</div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-zinc-900/50 px-2 py-1 text-[10px] uppercase tracking-widest text-zinc-300">
            Causal Opacity: Active
          </span>
          <span className="rounded-full border border-white/10 bg-zinc-900/50 px-2 py-1 text-[10px] uppercase tracking-widest text-zinc-300">
            Signal: Harm
          </span>
          <span className="rounded-full border border-white/10 bg-zinc-900/50 px-2 py-1 text-[10px] uppercase tracking-widest text-zinc-400">
            Fragility default; antifragility forged
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <MetricCell label="Convex share" value={snapshot.convexSharePct} suffix="%" tone="text-emerald-300" />
          <MetricCell label="Cave share" value={snapshot.caveSharePct} suffix="%" tone="text-amber-300" />
          <MetricCell label="Heuristic means coverage" value={snapshot.heuristicMeansCoveragePct} suffix="%" tone="text-zinc-100" />
        </div>
      </section>

      <section className="mt-4 glass rounded-xl border border-white/10 p-4">
        {!snapshot.sources.length ? (
          <div className="rounded-lg border border-white/10 bg-zinc-900/50 p-4 text-sm text-zinc-400">
            No source-of-volatility inputs found. Add sources/domains to render the Maya flow.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Inputs</div>
              <div className="space-y-2">
                {snapshot.sources.map((source) => {
                  const active = source.sourceId === activeSourceId;
                  return (
                    <button
                      key={source.sourceId}
                      type="button"
                      onMouseEnter={() => setActiveSourceId(source.sourceId)}
                      onFocus={() => setActiveSourceId(source.sourceId)}
                      onClick={() => router.push(`/war-gaming/source?target=${encodeURIComponent(source.sourceId)}`)}
                      className={
                        active
                          ? "w-full text-left rounded-lg border border-blue-400/50 bg-blue-500/10 px-2.5 py-2"
                          : "w-full text-left rounded-lg border border-white/10 bg-zinc-900/50 px-2.5 py-2 hover:border-blue-400/30"
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-zinc-200 line-clamp-1">{lawAliasForLabel(source.sourceName)}</div>
                        <span className={badgeClass(source.lane)}>{source.lane}</span>
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">
                        volatility {source.inputVolatility} | domains {source.mappedDomainCount}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Flow</div>
              <div className="relative rounded-lg border border-white/10 bg-zinc-900/60 h-[360px] overflow-hidden">
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                  {snapshot.sources.map((source, index) => {
                    const y = nodeY(index, snapshot.sources.length);
                    const laneY = source.lane === "CONVEX" ? 30 : 70;
                    const strokeWidth = 0.7 + source.inputVolatility / 45;
                    return (
                      <path
                        key={`flow-${source.sourceId}`}
                        d={`M 9 ${y} C 24 ${y}, 32 ${y}, 43 50 C 58 50, 68 ${laneY}, 86 ${laneY}`}
                        stroke={LANE_COLOR[source.lane]}
                        strokeWidth={strokeWidth}
                        strokeOpacity={lineOpacity(activeSourceId, source.sourceId)}
                        fill="none"
                        strokeLinecap="round"
                      />
                    );
                  })}

                  <circle cx="50" cy="50" r="10.5" fill="rgba(59,130,246,0.10)" stroke="rgba(96,165,250,0.85)" strokeWidth="0.6" />
                  <text x="50" y="49" textAnchor="middle" fontSize="2.6" fill="#bfdbfe" letterSpacing="0.5">
                    MAYA
                  </text>
                  <text x="50" y="53.5" textAnchor="middle" fontSize="1.8" fill="#9ca3af">
                    CAUSAL OPACITY
                  </text>

                  <rect x="80" y="24" width="14" height="10" rx="1.4" fill="rgba(34,197,94,0.12)" stroke="rgba(74,222,128,0.45)" strokeWidth="0.4" />
                  <text x="87" y="29.8" textAnchor="middle" fontSize="2.0" fill="#86efac">
                    CONVEX
                  </text>

                  <rect x="80" y="66" width="14" height="10" rx="1.4" fill="rgba(245,158,11,0.12)" stroke="rgba(251,191,36,0.45)" strokeWidth="0.4" />
                  <text x="87" y="71.8" textAnchor="middle" fontSize="2.0" fill="#fcd34d">
                    CAVE
                  </text>
                </svg>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Outputs</div>
              <div className="space-y-2">
                <div className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 p-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-emerald-200">CONVEX / LONG VOL</div>
                    <span className="text-xs font-semibold text-emerald-300">{convexCount}</span>
                  </div>
                </div>
                <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 p-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-amber-200">CAVE / SHORT VOL</div>
                    <span className="text-xs font-semibold text-amber-300">{caveCount}</span>
                  </div>
                </div>
              </div>

              {activeSource && (
                <button
                  type="button"
                  className="mt-3 w-full rounded-lg border border-white/10 bg-zinc-900/55 px-2.5 py-2 text-left hover:border-blue-400/30"
                  onClick={() => router.push(`/war-gaming/source?target=${encodeURIComponent(activeSource.sourceId)}`)}
                >
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">Selected source</div>
                  <div className="text-sm font-semibold text-zinc-100 mt-1 line-clamp-1">{lawAliasForLabel(activeSource.sourceName)}</div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    lane {activeSource.lane} | conviction {activeSource.conviction}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-blue-300">
                    Open source wargame
                    <ArrowRight size={12} />
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {activeSource && (
          <div className="mt-4 rounded-lg border border-white/10 bg-zinc-900/40 p-2.5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Active signal</div>
            <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-5">
              <MetricCell label="Harm" value={activeSource.harmSignal} tone="text-amber-300" />
              <MetricCell label="Cave" value={activeSource.caveScore} tone="text-amber-300" />
              <MetricCell label="Convex" value={activeSource.convexScore} tone="text-emerald-300" />
              <MetricCell label="Conviction" value={activeSource.conviction} tone="text-zinc-100" />
              <MetricCell label="Mapped Domains" value={activeSource.mappedDomainCount} tone="text-zinc-100" />
            </div>
          </div>
        )}

        {!snapshot.sources.length && (
          <div className="mt-3 inline-flex items-center gap-2 text-[11px] text-zinc-500">
            <AlertTriangle size={14} className="text-amber-300" />
            Awaiting source volatility inputs.
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCell({
  label,
  value,
  tone,
  suffix
}: {
  label: string;
  value: number;
  tone: string;
  suffix?: string;
}) {
  return (
    <div className="rounded border border-white/10 bg-zinc-950/55 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</div>
      <div className={`text-sm font-semibold ${tone}`}>
        {value}
        {suffix ?? ""}
      </div>
    </div>
  );
}
