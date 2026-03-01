import React from "react";
import { Affair, Domain, Interest, LineageRiskDto } from "./types";

interface WarGameDomainsProps {
  domainId?: string;
  domains: Domain[];
  affairs: Affair[];
  interests: Interest[];
  lineageRisks: LineageRiskDto[];
}

export function WarGameDomains({ domainId, domains, affairs, interests, lineageRisks }: WarGameDomainsProps) {
  const domain = domains.find((item) => item.id === domainId);
  const domainAffairs = affairs.filter((affair) => affair.domainId === domainId || affair.context?.associatedDomains?.includes(domainId ?? ""));
  const domainInterests = interests.filter((interest) => interest.domainId === domainId);
  const domainRisks = lineageRisks.filter((risk) => risk.domainId === domainId);

  return (
    <section className="glass p-5 rounded-xl border border-white/10 mb-6">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Domain WarGame Protocol</h3>
        <span className="text-[10px] font-mono text-zinc-500 uppercase">Mode: Domain</span>
      </div>
      <div className="text-lg font-semibold mb-3">{domain?.name ?? "Select a domain"}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Stakes</div>
          <div className="text-zinc-200">{domain?.stakesText ?? "Undefined"}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Fragility</div>
          <div className="text-zinc-200">{domain?.fragilityText ?? "Undefined"}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Affairs / Interests</div>
          <div className="text-zinc-200">
            {domainAffairs.length} / {domainInterests.length}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Lineage Risks</div>
          <div className="text-zinc-200">{domainRisks.length}</div>
        </div>
      </div>
    </section>
  );
}

