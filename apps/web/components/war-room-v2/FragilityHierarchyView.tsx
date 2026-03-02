import React, { useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { AppData, Domain } from "./types";

export function FragilityHierarchyView({
  data,
  onOpenDomain,
  onWarGameSource,
  onWarGameDomain,
  onWarGameLineage
}: {
  data: AppData;
  onOpenDomain: (domain: Domain) => void;
  onWarGameSource?: (sourceId: string) => void;
  onWarGameDomain?: (domainId: string) => void;
  onWarGameLineage?: (lineageNodeId: string) => void;
}) {
  const hierarchy = useMemo(() => {
    const risks = data.lineageRisks ?? [];
    const bySource = new Map<string, number[]>();
    const byDomain = new Map<string, number[]>();
    const byLineage = new Map<string, number[]>();

    for (const risk of risks) {
      const score = Number(risk.fragilityScore ?? 0);
      (bySource.get(risk.sourceId) ?? bySource.set(risk.sourceId, []).get(risk.sourceId)!).push(score);
      (byDomain.get(risk.domainId) ?? byDomain.set(risk.domainId, []).get(risk.domainId)!).push(score);
      (byLineage.get(risk.lineageNodeId) ?? byLineage.set(risk.lineageNodeId, []).get(risk.lineageNodeId)!).push(score);
    }

    const avg = (values: number[]) => (values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0);

    const sources = Array.from(bySource.entries())
      .map(([id, values]) => ({
        id,
        score: avg(values),
        name: data.sources?.find((source) => source.id === id)?.name ?? id,
        riskCount: values.length,
        domainCount: new Set(risks.filter((risk) => risk.sourceId === id).map((risk) => risk.domainId)).size
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const domains = Array.from(byDomain.entries())
      .map(([id, values]) => ({
        id,
        score: avg(values),
        riskCount: values.length,
        domain: data.domains.find((domain) => domain.id === id)
      }))
      .filter((item) => Boolean(item.domain))
      .map((item) => ({
        id: item.id,
        score: item.score,
        riskCount: item.riskCount,
        domain: item.domain as Domain
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const lineages = Array.from(byLineage.entries())
      .map(([id, values]) => ({
        id,
        score: avg(values),
        name: data.lineages?.nodes?.find((node) => node.id === id)?.name ?? id,
        riskCount: values.length,
        sourceCount: new Set(risks.filter((risk) => risk.lineageNodeId === id).map((risk) => risk.sourceId)).size,
        domainCount: new Set(risks.filter((risk) => risk.lineageNodeId === id).map((risk) => risk.domainId)).size
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return { sources, domains, lineages };
  }, [data]);

  const radarData = useMemo(
    () => [
      { axis: "Volatility", value: hierarchy.sources[0]?.score ?? 0 },
      { axis: "Domain", value: hierarchy.domains[0]?.score ?? 0 },
      { axis: "Lineage", value: hierarchy.lineages[0]?.score ?? 0 }
    ],
    [hierarchy.domains, hierarchy.lineages, hierarchy.sources]
  );

  return (
    <section className="glass p-4 rounded-lg border border-white/10 mb-6">
      <h3 className="text-sm font-bold uppercase tracking-widest mb-3">Fragility Topology (Volatility {'->'} Domain {'->'} Lineage)</h3>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-white/10 bg-zinc-900/40">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Volatility Sources</div>
          <div className="space-y-2">
            {hierarchy.sources.map((item) => (
              <button
                key={item.id}
                onClick={() => onWarGameSource?.(item.id)}
                className="w-full text-left rounded-md border border-white/10 bg-zinc-950/60 p-2 hover:border-blue-500/50 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!onWarGameSource}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate pr-3">{item.name}</span>
                  <span className="text-red-300 font-mono">{item.score}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-300">risks {item.riskCount}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300">domains {item.domainCount}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300">war-game source</span>
                </div>
              </button>
            ))}
            {hierarchy.sources.length === 0 && <div className="text-xs text-zinc-500">No source-linked risks yet.</div>}
          </div>
        </div>

        <div className="p-3 rounded-lg border border-white/10 bg-zinc-900/40">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Domains</div>
          <div className="space-y-2">
            {hierarchy.domains.map((item) => (
              <div key={item.id} className="rounded-md border border-white/10 bg-zinc-950/60 p-2">
                <button onClick={() => onOpenDomain(item.domain)} className="w-full text-left rounded hover:bg-zinc-900/40 p-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate pr-3">{item.domain.name}</span>
                    <span className="text-red-300 font-mono">{item.score}</span>
                  </div>
                </button>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-300">risks {item.riskCount}</span>
                  {item.domain.stakesText && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300">stakes</span>}
                  {item.domain.fragilityText && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-300">fragility</span>}
                  {item.domain.vulnerabilitiesText && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300">vulnerabilities</span>}
                  {onWarGameDomain && (
                    <button
                      onClick={() => onWarGameDomain(item.id)}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                    >
                      war-game domain
                    </button>
                  )}
                </div>
              </div>
            ))}
            {hierarchy.domains.length === 0 && <div className="text-xs text-zinc-500">No domain-linked risks yet.</div>}
          </div>
        </div>

        <div className="p-3 rounded-lg border border-white/10 bg-zinc-900/40">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Lineages</div>
          <div className="space-y-2">
            {hierarchy.lineages.map((item) => (
              <button
                key={item.id}
                onClick={() => onWarGameLineage?.(item.id)}
                className="w-full text-left rounded-md border border-white/10 bg-zinc-950/60 p-2 hover:border-blue-500/50 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!onWarGameLineage}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate pr-3">{item.name}</span>
                  <span className="text-red-300 font-mono">{item.score}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-300">risks {item.riskCount}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300">sources {item.sourceCount}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300">domains {item.domainCount}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300">war-game lineage</span>
                </div>
              </button>
            ))}
            {hierarchy.lineages.length === 0 && <div className="text-xs text-zinc-500">No lineage-linked risks yet.</div>}
          </div>
        </div>

        <div className="p-3 rounded-lg border border-white/10 bg-zinc-900/40">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Hierarchy Radar</div>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.15)" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                <Radar dataKey="value" stroke="#ff8c00" fill="#ff8c00" fillOpacity={0.28} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
