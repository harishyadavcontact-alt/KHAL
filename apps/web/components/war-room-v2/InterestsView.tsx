import React, { useMemo } from "react";
import { Plus } from "lucide-react";
import { AppData, Interest } from "./types";
import { InterestDetail } from "./InterestDetail";

interface InterestsViewProps {
  data: AppData;
  selectedInterestId: string | null;
  onSelectInterest: (id: string | null) => void;
  onSelectAffair: (id: string) => void;
  onCreateInterest: (payload: { title: string; domainId: string }) => Promise<void>;
  onWarGame: (interestId: string) => void;
  onOpenLab?: (interestId: string) => void;
}

function buildDummyInterests(data: AppData): Interest[] {
  const firstDomain = data.domains[0]?.id ?? "general";
  return [
    { id: "dummy-interest-01", title: "Optionality Stack: Intelligence", domainId: firstDomain, perspective: "public", stakes: "Expand strategic foresight", objectives: ["Signal collection", "Early warning"] },
    { id: "dummy-interest-02", title: "Optionality Stack: Capital", domainId: firstDomain, perspective: "private", stakes: "Increase convex upside", objectives: ["Asymmetric entries", "Tail-risk hedges"] },
    { id: "dummy-interest-03", title: "Optionality Stack: Network", domainId: firstDomain, perspective: "personal", stakes: "Compound trusted alliances", objectives: ["Alliance map", "Cooperation leverage"] }
  ];
}

export function InterestsView({ data, selectedInterestId, onSelectInterest, onSelectAffair, onCreateInterest, onWarGame, onOpenLab }: InterestsViewProps) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [domainId, setDomainId] = React.useState(data.domains[0]?.id ?? "general");
  const [saving, setSaving] = React.useState(false);

  const [domainFilter, setDomainFilter] = React.useState("all");
  const [sourceFilter, setSourceFilter] = React.useState("all");
  const [lineageFilter, setLineageFilter] = React.useState("all");
  const [scopeFilter, setScopeFilter] = React.useState("all");

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

  const visualInterests = useMemo(() => (data.interests.length ? data.interests : buildDummyInterests(data)), [data]);

  const filteredInterests = useMemo(() => {
    const lineageRisks = data.lineageRisks ?? [];
    const domainsById = new Map(data.domains.map((domain) => [domain.id, domain]));
    return visualInterests.filter((interest) => {
      if (domainFilter !== "all" && interest.domainId !== domainFilter) return false;

      if (sourceFilter !== "all") {
        const domain = domainsById.get(interest.domainId);
        const candidate = domain?.volatilitySourceId ?? domain?.volatilitySourceName ?? domain?.volatilitySource ?? "";
        if (candidate !== sourceFilter) return false;
      }

      if (lineageFilter !== "all") {
        const hasLineage = lineageRisks.some((risk) => risk.lineageNodeId === lineageFilter && risk.domainId === interest.domainId);
        if (!hasLineage) return false;
      }

      if (scopeFilter !== "all") {
        const perspective = String(interest.perspective ?? "").toLowerCase();
        if (perspective !== scopeFilter) return false;
      }

      return true;
    });
  }, [data.domains, data.lineageRisks, domainFilter, lineageFilter, scopeFilter, sourceFilter, visualInterests]);

  if (selectedInterestId) {
    return (
      <InterestDetail
        interest={visualInterests.find((interest) => interest.id === selectedInterestId)!}
        affairs={data.affairs.filter((affair) => affair.interestId === selectedInterestId)}
        onBack={() => onSelectInterest(null)}
        onAffairClick={(id: string) => {
          onSelectAffair(id);
          onSelectInterest(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 py-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-xl font-bold">Long-term Interests</h2>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 rounded text-xs font-bold text-white">
          <Plus size={14} /> New Interest
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
            <option value="all">All Scopes</option>
            <option value="personal">personal</option>
            <option value="private">private</option>
            <option value="public">public</option>
            <option value="family">family</option>
          </select>
        </div>
      </div>

      {open && (
        <div className="glass p-4 rounded-lg border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Interest title" />
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
                    await onCreateInterest({ title: title.trim(), domainId });
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
        {filteredInterests.map((interest) => (
          <div
            key={interest.id}
            onClick={() => onSelectInterest(interest.id)}
            className="glass p-4 rounded-lg border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-mono text-zinc-400 uppercase">{interest.perspective}</div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{interest.domainId}</span>
            </div>
            <h3 className="text-base font-bold mb-2 group-hover:text-blue-400 transition-colors">{interest.title}</h3>
            <div className="text-xs text-zinc-400 mb-2">
              Stakes: <span className="text-zinc-200">{interest.stakes}</span>
            </div>
            <div className="space-y-1">
              {(interest.objectives ?? []).slice(0, 2).map((objective, index) => (
                <div key={`${interest.id}-${index}`} className="flex items-center gap-2 text-[11px] text-zinc-500">
                  <div className="w-1 h-1 bg-blue-500 rounded-full" />
                  {objective}
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenLab?.(interest.id);
                }}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold uppercase tracking-widest text-white"
              >
                Open Lab
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onWarGame(interest.id);
                }}
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-[10px] font-bold uppercase tracking-widest text-white"
              >
                WarGame
              </button>
            </div>
          </div>
        ))}
        {!filteredInterests.length && <div className="text-sm text-zinc-500">No interests match current filters.</div>}
      </div>
    </div>
  );
}
