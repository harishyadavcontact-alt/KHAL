import React, { useMemo } from "react";
import { Plus } from "lucide-react";
import { AppData } from "./types";
import { cn } from "./utils";

interface AffairsViewProps {
  data: AppData;
  onSelectAffair: (id: string) => void;
  onCreateAffair: (payload: { title: string; domainId: string }) => Promise<void>;
  onWarGame: (affairId: string) => void;
}

export function AffairsView({ data, onSelectAffair, onCreateAffair, onWarGame }: AffairsViewProps) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [domainId, setDomainId] = React.useState(data.domains[0]?.id ?? "general");
  const [saving, setSaving] = React.useState(false);

  const [domainFilter, setDomainFilter] = React.useState("all");
  const [sourceFilter, setSourceFilter] = React.useState("all");
  const [lineageFilter, setLineageFilter] = React.useState("all");
  const [scopeFilter, setScopeFilter] = React.useState("all");

  const domainsById = useMemo(() => new Map(data.domains.map((domain) => [domain.id, domain])), [data.domains]);
  const sourceOptions = useMemo(() => {
    if (data.sources?.length) return data.sources.map((source) => ({ id: source.id, label: source.name }));
    const fallback = new Map<string, string>();
    for (const domain of data.domains) {
      const key = domain.volatilitySourceId ?? domain.volatilitySourceName ?? domain.volatilitySource ?? "unmapped";
      const label = domain.volatilitySourceName ?? domain.volatilitySource ?? key;
      fallback.set(key, label);
    }
    return Array.from(fallback.entries()).map(([id, label]) => ({ id, label }));
  }, [data.domains, data.sources]);

  const scopeOptions = useMemo(() => {
    const set = new Set<string>(["all", "personal", "private", "public", "family"]);
    for (const affair of data.affairs) {
      if (affair.perspective) set.add(String(affair.perspective).toLowerCase());
    }
    return Array.from(set);
  }, [data.affairs]);

  const filteredAffairs = useMemo(() => {
    const lineageRisks = data.lineageRisks ?? [];
    return data.affairs.filter((affair) => {
      const associatedDomains = affair.context?.associatedDomains ?? [];
      const allDomains = new Set([affair.domainId, ...associatedDomains]);

      if (domainFilter !== "all" && !allDomains.has(domainFilter)) return false;

      if (sourceFilter !== "all") {
        const hasSource = Array.from(allDomains).some((dId) => {
          const domain = domainsById.get(dId);
          const candidate = domain?.volatilitySourceId ?? domain?.volatilitySourceName ?? domain?.volatilitySource ?? "";
          return candidate === sourceFilter;
        });
        if (!hasSource) return false;
      }

      if (lineageFilter !== "all") {
        const hasLineage = lineageRisks.some((risk) => risk.lineageNodeId === lineageFilter && allDomains.has(risk.domainId));
        if (!hasLineage) return false;
      }

      if (scopeFilter !== "all") {
        const perspective = String(affair.perspective ?? "").toLowerCase();
        if (perspective !== scopeFilter) return false;
      }

      return true;
    });
  }, [data.affairs, data.lineageRisks, domainFilter, domainsById, lineageFilter, scopeFilter, sourceFilter]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 py-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-xl font-bold">Active Affairs</h2>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 rounded text-xs font-bold text-white">
          <Plus size={14} /> New Affair
        </button>
      </div>

      <div className="glass p-3 rounded-lg border border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
          <select className="bg-zinc-900 border border-white/10 rounded px-2 py-1.5 text-xs" value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
            <option value="all">All Domains</option>
            {data.domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.name}
              </option>
            ))}
          </select>
          <select className="bg-zinc-900 border border-white/10 rounded px-2 py-1.5 text-xs" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="all">All Volatility Sources</option>
            {sourceOptions.map((source) => (
              <option key={source.id} value={source.id}>
                {source.label}
              </option>
            ))}
          </select>
          <select className="bg-zinc-900 border border-white/10 rounded px-2 py-1.5 text-xs" value={lineageFilter} onChange={(e) => setLineageFilter(e.target.value)}>
            <option value="all">All Lineages</option>
            {(data.lineages?.nodes ?? []).map((node) => (
              <option key={node.id} value={node.id}>
                {node.name}
              </option>
            ))}
          </select>
          <select className="bg-zinc-900 border border-white/10 rounded px-2 py-1.5 text-xs" value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)}>
            {scopeOptions.map((scope) => (
              <option key={scope} value={scope}>
                {scope === "all" ? "All Scopes" : scope}
              </option>
            ))}
          </select>
        </div>
      </div>

      {open && (
        <div className="glass p-4 rounded-lg border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              className="bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Affair title"
            />
            <select className="bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm" value={domainId} onChange={(e) => setDomainId(e.target.value)}>
              {data.domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-semibold text-white disabled:bg-zinc-700"
                disabled={!title.trim() || saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await onCreateAffair({ title: title.trim(), domainId });
                    setTitle("");
                    setOpen(false);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Save
              </button>
              <button className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-sm font-semibold text-white" onClick={() => setOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredAffairs.map((affair) => (
          <div
            key={affair.id}
            onClick={() => onSelectAffair(affair.id)}
            className="glass p-4 rounded-lg border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-3">
              <div
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono uppercase",
                  affair.status === "execution" ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
                )}
              >
                {affair.status}
              </div>
              <div className="text-[10px] font-mono text-zinc-500 uppercase">{affair.perspective}</div>
            </div>
            <h3 className="text-base font-bold mb-2 group-hover:text-blue-400 transition-colors">{affair.title}</h3>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              <span>Domains: {(affair.context?.associatedDomains ?? []).length || 1}</span>
              <span>Heuristics: {affair.means?.selectedHeuristicIds?.length ?? 0}</span>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onWarGame(affair.id);
                }}
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-[10px] font-bold uppercase tracking-widest text-white"
              >
                WarGame
              </button>
            </div>
          </div>
        ))}
        {!filteredAffairs.length && <div className="text-sm text-zinc-500">No affairs match current filters.</div>}
      </div>
    </div>
  );
}
