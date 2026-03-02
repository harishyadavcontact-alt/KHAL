import React, { useMemo, useState } from "react";
import { AppData } from "./types";

type ActorTypeFilter = "all" | "personal" | "private" | "public";

export function LineageMapView({ data }: { data: AppData }) {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(data.lineages?.nodes?.[0]?.id ?? null);
  const [actorFilter, setActorFilter] = useState<ActorTypeFilter>("all");

  const nodes = data.lineages?.nodes ?? [];
  const entities = data.lineages?.entities ?? [];
  const risks = data.lineageRisks ?? [];
  const sources = data.sources ?? [];
  const domainsById = new Map(data.domains.map((domain) => [domain.id, domain]));
  const sourcesById = new Map(sources.map((source) => [source.id, source]));

  const tree = useMemo(() => {
    const byParent = new Map<string | null, typeof nodes>();
    for (const node of nodes) {
      const key = node.parentId ?? null;
      const list = byParent.get(key) ?? [];
      list.push(node);
      byParent.set(key, list);
    }
    for (const [, list] of byParent) {
      list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    }
    return byParent;
  }, [nodes]);

  const selectedNode = nodes.find((node) => node.id === activeNodeId) ?? null;
  const selectedEntities = entities.filter((entity) => entity.lineageNodeId === selectedNode?.id && (actorFilter === "all" || entity.actorType === actorFilter));
  const selectedRisks = risks.filter((risk) => risk.lineageNodeId === selectedNode?.id && (actorFilter === "all" || !risk.actorType || risk.actorType === actorFilter));

  const avgFragility = selectedRisks.length
    ? Number((selectedRisks.reduce((sum, risk) => sum + (Number(risk.fragilityScore) || 0), 0) / selectedRisks.length).toFixed(2))
    : 0;

  const domainExposure = useMemo(() => {
    const map = new Map<string, number>();
    for (const risk of selectedRisks) {
      map.set(risk.domainId, (map.get(risk.domainId) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([domainId, count]) => ({
        domainId,
        name: domainsById.get(domainId)?.name ?? domainId,
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [domainsById, selectedRisks]);

  const volatilityExposure = useMemo(() => {
    const map = new Map<string, number>();
    for (const risk of selectedRisks) {
      map.set(risk.sourceId, (map.get(risk.sourceId) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([sourceId, count]) => ({
        sourceId,
        name: sourcesById.get(sourceId)?.name ?? sourceId,
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [selectedRisks, sourcesById]);

  const exposedDomainIds = useMemo(() => new Set(domainExposure.map((item) => item.domainId)), [domainExposure]);
  const linkedInterests = useMemo(
    () => data.interests.filter((interest) => exposedDomainIds.has(interest.domainId)),
    [data.interests, exposedDomainIds]
  );
  const linkedAffairs = useMemo(
    () =>
      data.affairs.filter(
        (affair) => exposedDomainIds.has(affair.domainId) || (affair.context?.associatedDomains ?? []).some((domainId) => exposedDomainIds.has(domainId))
      ),
    [data.affairs, exposedDomainIds]
  );

  const renderBranch = (parentId: string | null, depth = 0): React.ReactNode => {
    const branch = tree.get(parentId) ?? [];
    return branch.map((node) => (
      <div key={node.id} style={{ marginLeft: depth * 16 }}>
        <button
          onClick={() => setActiveNodeId(node.id)}
          className={`w-full text-left px-3 py-2 rounded-lg border mb-2 ${
            selectedNode?.id === node.id ? "bg-blue-500/20 border-blue-500/40 text-white" : "bg-zinc-900/40 border-white/5 text-zinc-300 hover:border-blue-500/30"
          }`}
        >
          <div className="text-xs uppercase text-zinc-400">{node.level}</div>
          <div className="font-semibold">{node.name}</div>
        </button>
        {renderBranch(node.id, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Lineage Map</h2>
        <div className="flex gap-2">
          {(["all", "personal", "private", "public"] as const).map((actorType) => (
            <button
              key={actorType}
              onClick={() => setActorFilter(actorType)}
              className={`px-3 py-1 rounded-full text-xs uppercase font-mono ${
                actorFilter === actorType ? "bg-blue-600 text-white" : "bg-zinc-900 border border-white/10 text-zinc-400"
              }`}
            >
              {actorType}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 glass p-4 rounded-2xl border border-white/10 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {renderBranch(null)}
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="glass p-5 rounded-2xl border border-white/10">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Selected Lineage Node</div>
            <div className="text-xl font-bold">{selectedNode?.name ?? "None"}</div>
            <div className="text-sm text-zinc-400 mt-1">{selectedNode?.level ?? ""}</div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="p-3 bg-zinc-900/50 rounded-lg border border-white/5">
                <div className="text-[10px] uppercase text-zinc-500">Entities</div>
                <div className="text-lg font-bold">{selectedEntities.length}</div>
              </div>
              <div className="p-3 bg-zinc-900/50 rounded-lg border border-white/5">
                <div className="text-[10px] uppercase text-zinc-500">Risks</div>
                <div className="text-lg font-bold">{selectedRisks.length}</div>
              </div>
              <div className="p-3 bg-zinc-900/50 rounded-lg border border-white/5">
                <div className="text-[10px] uppercase text-zinc-500">Avg Fragility</div>
                <div className="text-lg font-bold">{avgFragility}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="glass p-5 rounded-2xl border border-white/10">
              <div className="text-sm font-bold mb-3">Domain Exposure</div>
              <div className="space-y-2">
                {!domainExposure.length && <div className="text-sm text-zinc-500">No domain exposure mapped yet.</div>}
                {domainExposure.map((item) => (
                  <div key={item.domainId} className="p-3 bg-zinc-900/50 rounded-lg border border-white/5 flex items-center justify-between">
                    <span className="text-sm text-zinc-200">{item.name}</span>
                    <span className="text-xs font-mono text-zinc-400">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass p-5 rounded-2xl border border-white/10">
              <div className="text-sm font-bold mb-3">Volatility Exposure</div>
              <div className="space-y-2">
                {!volatilityExposure.length && <div className="text-sm text-zinc-500">No volatility exposure mapped yet.</div>}
                {volatilityExposure.map((item) => (
                  <div key={item.sourceId} className="p-3 bg-zinc-900/50 rounded-lg border border-white/5 flex items-center justify-between">
                    <span className="text-sm text-zinc-200">{item.name}</span>
                    <span className="text-xs font-mono text-zinc-400">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="glass p-5 rounded-2xl border border-white/10">
              <div className="text-sm font-bold mb-3">Linked Interests</div>
              <div className="space-y-2">
                {!linkedInterests.length && <div className="text-sm text-zinc-500">No linked interests from current exposure.</div>}
                {linkedInterests.map((interest) => (
                  <div key={interest.id} className="p-3 bg-zinc-900/50 rounded-lg border border-white/5">
                    <div className="font-medium text-sm">{interest.title}</div>
                    <div className="text-xs text-zinc-500">{domainsById.get(interest.domainId)?.name ?? interest.domainId}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass p-5 rounded-2xl border border-white/10">
              <div className="text-sm font-bold mb-3">Linked Affairs</div>
              <div className="space-y-2">
                {!linkedAffairs.length && <div className="text-sm text-zinc-500">No linked affairs from current exposure.</div>}
                {linkedAffairs.map((affair) => (
                  <div key={affair.id} className="p-3 bg-zinc-900/50 rounded-lg border border-white/5">
                    <div className="font-medium text-sm">{affair.title}</div>
                    <div className="text-xs text-zinc-500">{domainsById.get(affair.domainId)?.name ?? affair.domainId}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl border border-white/10">
            <div className="text-sm font-bold mb-3">Entities</div>
            <div className="space-y-2">
              {selectedEntities.length === 0 && <div className="text-sm text-zinc-500">No entities for this filter.</div>}
              {selectedEntities.map((entity) => (
                <div key={entity.id} className="p-3 bg-zinc-900/50 rounded-lg border border-white/5">
                  <div className="font-medium">{entity.label}</div>
                  <div className="text-xs uppercase text-zinc-500">{entity.actorType}</div>
                  {entity.description && <div className="text-xs text-zinc-400 mt-1">{entity.description}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-5 rounded-2xl border border-white/10">
            <div className="text-sm font-bold mb-3">Risk Register</div>
            <div className="space-y-2">
              {selectedRisks.length === 0 && <div className="text-sm text-zinc-500">No risk rows for this lineage node.</div>}
              {selectedRisks.map((risk) => (
                <div key={risk.id} className="p-3 bg-zinc-900/50 rounded-lg border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{risk.title}</div>
                    <div className="text-xs font-mono text-zinc-400">{risk.status}</div>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Source: {sourcesById.get(risk.sourceId)?.name ?? risk.sourceId} • Domain: {domainsById.get(risk.domainId)?.name ?? risk.domainId}
                  </div>
                  <div className="grid grid-cols-5 gap-2 mt-2 text-[10px] text-zinc-400">
                    <span>E:{risk.exposure}</span>
                    <span>D:{risk.dependency}</span>
                    <span>I:{risk.irreversibility}</span>
                    <span>O:{risk.optionality}</span>
                    <span>F:{risk.fragilityScore}</span>
                  </div>
                  {risk.notes && <div className="text-xs text-zinc-400 mt-2">{risk.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
