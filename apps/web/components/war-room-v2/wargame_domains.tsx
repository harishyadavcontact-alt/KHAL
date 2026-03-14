import React from "react";
import { Affair, Craft, Domain, Interest, LineageRiskDto, VolatilitySourceDto } from "./types";
import { projectionsByDomain } from "../../lib/war-room/state-of-art";

interface WarGameDomainsProps {
  domainId?: string;
  domains: Domain[];
  sources: VolatilitySourceDto[];
  crafts: Craft[];
  affairs: Affair[];
  interests: Interest[];
  lineageRisks: LineageRiskDto[];
}

export function WarGameDomains({ domainId, domains, sources, crafts, affairs, interests, lineageRisks }: WarGameDomainsProps) {
  const domain = domains.find((item) => item.id === domainId);
  const domainAffairs = affairs.filter((affair) => affair.domainId === domainId || affair.context?.associatedDomains?.includes(domainId ?? ""));
  const domainInterests = interests.filter((interest) => interest.domainId === domainId);
  const domainRisks = lineageRisks.filter((risk) => risk.domainId === domainId);
  const projections = projectionsByDomain({ sources, domains, crafts }).get(domainId ?? "") ?? [];
  const quadrants = Array.from(new Set(projections.map((item) => item.quadrant)));
  const means = Array.from(new Set(projections.map((item) => item.means.primaryCraftName ?? item.means.primaryCraftId).filter(Boolean)));
  const fragilityLabels = Array.from(new Set(projections.map((item) => item.stone.nonLinearity.shortVolatilityLabel).filter(Boolean)));

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
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Non-Linearity</div>
          <div className="text-zinc-200">{fragilityLabels.join(" | ") || (domain?.fragilityText ?? "Undefined")}</div>
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
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Mapped Quadrants</div>
          <div className="text-zinc-200">{quadrants.join(", ") || "Unmapped"}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Means Backbone</div>
          <div className="text-zinc-200">{means.join(", ") || "No source-backed craft"}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Backend Coverage</div>
          <div className="text-zinc-200">{projections.length} source-map projection{projections.length === 1 ? "" : "s"}</div>
        </div>
      </div>
      {projections.length ? (
        <div className="mt-4 rounded-lg border border-white/10 bg-zinc-900/40 p-3 text-xs">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">State of the Art Projection</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {projections.map((projection) => (
              <div key={projection.profileId} className="rounded border border-white/10 bg-zinc-950/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-zinc-100">{projection.sourceName}</div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">{projection.quadrant}</div>
                </div>
                <div className="mt-2 text-zinc-300">Skin in the game: {projection.stone.asymmetry.skinInTheGame.stakes ?? "Undefined"}</div>
                <div className="mt-1 text-zinc-400">Risks: {projection.stone.asymmetry.skinInTheGame.risks ?? "Undefined"}</div>
                <div className="mt-1 text-zinc-400">Lineage: {projection.stone.asymmetry.skinInTheGame.lineage ?? "Undefined"}</div>
                <div className="mt-1 text-zinc-400">Hedge / Edge: {projection.ends.hedge ?? "Undefined"} / {projection.ends.edge ?? "Undefined"}</div>
                <div className="mt-1 text-zinc-400">Avoid: {projection.means.avoid ?? "Undefined"}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

