import React, { useMemo } from "react";
import { Domain, LineageNodeDto, LineageRiskDto, VolatilitySourceDto } from "./types";

interface WarGameVolatilityProps {
  sourceId?: string;
  sources: VolatilitySourceDto[];
  domains: Domain[];
  lineages: LineageNodeDto[];
  lineageRisks: LineageRiskDto[];
}

export function WarGameVolatility({ sourceId, sources, domains, lineages, lineageRisks }: WarGameVolatilityProps) {
  const source = sources.find((item) => item.id === sourceId);
  const linkedDomainIds = useMemo(() => {
    const fromLinks = (source?.domains ?? []).map((link) => link.domainId);
    if (fromLinks.length > 0) return new Set(fromLinks);
    return new Set(domains.filter((domain) => domain.volatilitySourceId === sourceId).map((domain) => domain.id));
  }, [domains, source?.domains, sourceId]);
  const linkedDomains = domains.filter((domain) => linkedDomainIds.has(domain.id));
  const sourceRisks = lineageRisks.filter((risk) => risk.sourceId === sourceId);
  const affectedLineages = lineages.filter((lineage) => sourceRisks.some((risk) => risk.lineageNodeId === lineage.id));

  return (
    <section className="glass p-5 rounded-xl border border-white/10 mb-6">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Source WarGame Protocol</h3>
        <span className="text-[10px] font-mono text-zinc-500 uppercase">Mode: Volatility</span>
      </div>
      <div className="text-lg font-semibold mb-3">{source?.name ?? "Select a source"}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Linked Domains</div>
          <div className="text-zinc-200">{linkedDomains.map((item) => item.name).join(", ") || "None mapped"}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Affected Lineages</div>
          <div className="text-zinc-200">{affectedLineages.map((item) => item.level).join(", ") || "None mapped"}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Risk Rows</div>
          <div className="text-zinc-200">{sourceRisks.length}</div>
        </div>
      </div>
    </section>
  );
}

