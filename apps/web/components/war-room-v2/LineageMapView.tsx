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
  const selectedEntities = entities.filter(
    (entity) => entity.lineageNodeId === selectedNode?.id && (actorFilter === "all" || entity.actorType === actorFilter)
  );
  const selectedRisks = risks.filter(
    (risk) => risk.lineageNodeId === selectedNode?.id && (actorFilter === "all" || !risk.actorType || risk.actorType === actorFilter)
  );

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
          className={`mb-2 w-full rounded-lg border px-3 py-2 text-left transition-colors ${
            selectedNode?.id === node.id
              ? "khal-panel-strong text-[var(--color-text-strong)]"
              : "khal-panel text-[var(--color-text)] hover:border-[var(--color-accent)]"
          }`}
        >
          <div className="khal-meta text-[10px]">{node.level}</div>
          <div className="khal-title font-semibold">{node.name}</div>
        </button>
        {renderBranch(node.id, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="khal-title text-3xl font-bold">Lineage Map</h2>
        <div className="flex gap-2">
          {(["all", "personal", "private", "public"] as const).map((actorType) => (
            <button
              key={actorType}
              onClick={() => setActorFilter(actorType)}
              className={`khal-chip text-xs uppercase font-mono ${actorFilter === actorType ? "khal-chip-active" : ""}`}
            >
              {actorType}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="khal-panel custom-scrollbar max-h-[70vh] overflow-y-auto p-4 lg:col-span-4">{renderBranch(null)}</div>

        <div className="space-y-6 lg:col-span-8">
          <div className="khal-panel-strong p-5">
            <div className="khal-meta mb-2 text-[10px]">Selected Lineage Node</div>
            <div className="khal-title text-xl font-bold">{selectedNode?.name ?? "None"}</div>
            <div className="mt-1 text-sm text-[var(--color-text-muted)]">{selectedNode?.level ?? ""}</div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="khal-stat p-3">
                <div className="khal-meta text-[10px]">Entities</div>
                <div className="khal-title text-lg font-bold">{selectedEntities.length}</div>
              </div>
              <div className="khal-stat p-3">
                <div className="khal-meta text-[10px]">Risks</div>
                <div className="khal-title text-lg font-bold">{selectedRisks.length}</div>
              </div>
              <div className="khal-stat p-3">
                <div className="khal-meta text-[10px]">Avg Fragility</div>
                <div className="khal-title text-lg font-bold">{avgFragility}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="khal-panel p-5">
              <div className="khal-title mb-3 text-sm font-bold">Domain Exposure</div>
              <div className="space-y-2">
                {!domainExposure.length && <div className="text-sm text-[var(--color-text-faint)]">No domain exposure mapped yet.</div>}
                {domainExposure.map((item) => (
                  <div key={item.domainId} className="khal-table-row">
                    <span className="text-sm text-[var(--color-text)]">{item.name}</span>
                    <span className="text-xs font-mono text-[var(--color-text-muted)]">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="khal-panel p-5">
              <div className="khal-title mb-3 text-sm font-bold">Volatility Exposure</div>
              <div className="space-y-2">
                {!volatilityExposure.length && <div className="text-sm text-[var(--color-text-faint)]">No volatility exposure mapped yet.</div>}
                {volatilityExposure.map((item) => (
                  <div key={item.sourceId} className="khal-table-row">
                    <span className="text-sm text-[var(--color-text)]">{item.name}</span>
                    <span className="text-xs font-mono text-[var(--color-text-muted)]">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="khal-panel p-5">
              <div className="khal-title mb-3 text-sm font-bold">Linked Interests</div>
              <div className="space-y-2">
                {!linkedInterests.length && <div className="text-sm text-[var(--color-text-faint)]">No linked interests from current exposure.</div>}
                {linkedInterests.map((interest) => (
                  <div key={interest.id} className="khal-editor-block p-3">
                    <div className="khal-title text-sm font-medium">{interest.title}</div>
                    <div className="text-xs text-[var(--color-text-faint)]">{domainsById.get(interest.domainId)?.name ?? interest.domainId}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="khal-panel p-5">
              <div className="khal-title mb-3 text-sm font-bold">Linked Affairs</div>
              <div className="space-y-2">
                {!linkedAffairs.length && <div className="text-sm text-[var(--color-text-faint)]">No linked affairs from current exposure.</div>}
                {linkedAffairs.map((affair) => (
                  <div key={affair.id} className="khal-editor-block p-3">
                    <div className="khal-title text-sm font-medium">{affair.title}</div>
                    <div className="text-xs text-[var(--color-text-faint)]">{domainsById.get(affair.domainId)?.name ?? affair.domainId}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="khal-panel p-5">
            <div className="khal-title mb-3 text-sm font-bold">Entities</div>
            <div className="space-y-2">
              {selectedEntities.length === 0 && <div className="text-sm text-[var(--color-text-faint)]">No entities for this filter.</div>}
              {selectedEntities.map((entity) => (
                <div key={entity.id} className="khal-editor-block p-3">
                  <div className="khal-title font-medium">{entity.label}</div>
                  <div className="khal-meta text-[10px]">{entity.actorType}</div>
                  {entity.description && <div className="mt-1 text-xs text-[var(--color-text-muted)]">{entity.description}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="khal-panel p-5">
            <div className="khal-title mb-3 text-sm font-bold">Risk Register</div>
            <div className="space-y-2">
              {selectedRisks.length === 0 && <div className="text-sm text-[var(--color-text-faint)]">No risk rows for this lineage node.</div>}
              {selectedRisks.map((risk) => (
                <div key={risk.id} className="khal-editor-block p-3">
                  <div className="flex items-center justify-between">
                    <div className="khal-title font-medium">{risk.title}</div>
                    <div className="text-xs font-mono text-[var(--color-text-muted)]">{risk.status}</div>
                  </div>
                  <div className="mt-1 text-xs text-[var(--color-text-faint)]">
                    Source: {sourcesById.get(risk.sourceId)?.name ?? risk.sourceId} • Domain: {domainsById.get(risk.domainId)?.name ?? risk.domainId}
                  </div>
                  <div className="mt-2 grid grid-cols-5 gap-2 text-[10px] text-[var(--color-text-muted)]">
                    <span>E:{risk.exposure}</span>
                    <span>D:{risk.dependency}</span>
                    <span>I:{risk.irreversibility}</span>
                    <span>O:{risk.optionality}</span>
                    <span>F:{risk.fragilityScore}</span>
                  </div>
                  {risk.notes && <div className="mt-2 text-xs text-[var(--color-text-muted)]">{risk.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
