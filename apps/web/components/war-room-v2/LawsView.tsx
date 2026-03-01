import React, { useMemo, useState } from 'react';
import { Activity } from 'lucide-react';
import { AppData, Domain } from './types';
import { LawCard } from './LawCard';
import { LawDetail } from './LawDetail';
import { resolveMetric } from './utils';

const CANONICAL_SOURCES = ['Universe', 'Nature', 'Jungle', 'Land', 'Time', 'Nurture'] as const;

function resolveDomainSource(domain: Domain, laws: AppData['laws']): string {
  if (domain.volatilitySourceName) return domain.volatilitySourceName;
  if (domain.volatilitySource) return domain.volatilitySource;
  if (domain.lawId) {
    const law = laws.find((item) => item.id === domain.lawId);
    if (law?.name) return law.name;
  }
  return 'Unmapped';
}

interface LawsViewProps {
  data: AppData;
  selectedLawId: string | null;
  onSelectLaw: (id: string | null) => void;
  onSelectDomain: (domain: Domain) => void;
  onWarGameSource: (sourceId: string) => void;
  onOpenCraftFromLaw: (craftId: string, lawId: string) => void;
}

export function LawsView({ data, selectedLawId, onSelectLaw, onSelectDomain, onWarGameSource, onOpenCraftFromLaw }: LawsViewProps) {
  const [activeSource, setActiveSource] = useState<string>(CANONICAL_SOURCES[0]);

  const domainsBySource = useMemo(() => {
    const grouped = new Map<string, Domain[]>();
    for (const source of CANONICAL_SOURCES) grouped.set(source, []);
    for (const domain of data.domains) {
      const sourceName = resolveDomainSource(domain, data.laws);
      if (grouped.has(sourceName)) {
        grouped.get(sourceName)!.push(domain);
      }
    }
    return grouped;
  }, [data.domains, data.laws]);

  const filteredLaws = useMemo(() => {
    const lawsWithSource = data.laws.filter((law) => {
      const lawSource = law.volatilitySource ?? law.name;
      return lawSource === activeSource || law.name === activeSource;
    });
    if (lawsWithSource.length > 0) return lawsWithSource;
    return data.laws.filter((law) => data.domains.some((domain) => domain.lawId === law.id && resolveDomainSource(domain, data.laws) === activeSource));
  }, [activeSource, data.domains, data.laws]);

  const sourceMap = useMemo(() => {
    const sources = (data.sources ?? []).length ? data.sources ?? [] : CANONICAL_SOURCES.map((name, index) => ({ id: name, code: name.toUpperCase(), name, sortOrder: index + 1, domainCount: 0 }));
    const domainById = new Map(data.domains.map((domain) => [domain.id, domain]));
    return sources.map((source) => {
      const linkedDomains = data.domains
        .filter((domain) => resolveDomainSource(domain, data.laws) === source.name)
        .map((domain) => ({
          domain,
          dependencyKind: domain.volatilitySourceId ? 'PRIMARY' : 'SECONDARY',
          pathWeight: 1
        }));
      return {
        source,
        linkedDomains: linkedDomains.length
          ? linkedDomains
          : (source as any).domains?.map((link: any) => ({
              domain: domainById.get(link.domainId),
              dependencyKind: link.dependencyKind ?? 'PRIMARY',
              pathWeight: link.pathWeight ?? 1
            })).filter((item: any) => item.domain)
      };
    });
  }, [data.domains, data.laws, data.sources]);

  const activeSourceMap = sourceMap.find((item) => item.source.name === activeSource);

  if (selectedLawId) {
    return (
      <LawDetail
        law={data.laws.find((l) => l.id === selectedLawId)!}
        domains={data.domains.filter((d) => d.lawId === selectedLawId)}
        crafts={data.crafts.filter((c) => data.laws.find((l) => l.id === selectedLawId)?.associatedCrafts?.includes(c.id))}
        onBack={() => onSelectLaw(null)}
        onDomainClick={onSelectDomain}
        onCraftClick={(id: string) => onOpenCraftFromLaw(id, selectedLawId)}
      />
    );
  }

  return (
    <div className="space-y-12">
      <section>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-3xl font-bold">Source of Volatility</h2>
          <span className="text-[10px] uppercase tracking-widest font-mono text-zinc-500">formerly Laws of Volatility</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-2">
            {CANONICAL_SOURCES.map((source) => (
              <button
                key={source}
                onClick={() => setActiveSource(source)}
                className={
                  activeSource === source
                    ? 'w-full px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold text-left'
                    : 'w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-semibold hover:border-blue-500/40 text-left'
                }
              >
                <div className="flex items-center justify-between">
                  <span>{source}</span>
                  <span className="text-[10px] text-zinc-300/80">{domainsBySource.get(source)?.length ?? 0}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-5 glass p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Source Narrative</h3>
              <button
                onClick={() => onWarGameSource(activeSourceMap?.source.id ?? activeSource)}
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-[10px] font-bold uppercase tracking-widest text-white"
              >
                WarGame Source
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">State of the Art</div>
                <p className="text-zinc-200">
                  {activeSource} governs path-dependent volatility across linked domains. Read constraints first, then sequence means.
                </p>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">State of Affairs</div>
                <p className="text-zinc-300">
                  {activeSourceMap?.linkedDomains?.length ?? 0} linked domains currently mapped with strategic exposure and barbell ends.
                </p>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Philosopher&apos;s Stone</div>
                <p className="text-zinc-300 italic">Remove fragility before optimizing upside. Narrative drives allocation.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 glass p-5 rounded-2xl border border-white/10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-3">Linked Domains</h3>
            <div className="space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
              {(activeSourceMap?.linkedDomains ?? []).map((item: any) => (
                <button
                  key={item.domain.id}
                  onClick={() => onSelectDomain(item.domain)}
                  className="w-full text-left p-3 rounded-lg bg-zinc-900/60 border border-white/5 hover:border-blue-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{item.domain.name}</div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${item.dependencyKind === 'PRIMARY' ? 'bg-blue-500/20 text-blue-300' : item.dependencyKind === 'CASCADE' ? 'bg-red-500/20 text-red-300' : 'bg-zinc-700 text-zinc-300'}`}>
                      {item.dependencyKind}
                    </span>
                  </div>
                  <div className="text-[10px] mt-1 text-zinc-500 font-mono uppercase">Weight {Number(item.pathWeight ?? 1).toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filteredLaws.map((law) => (
            <LawCard
              key={law.id}
              law={law}
              domains={data.domains.filter((d) => d.lawId === law.id && resolveDomainSource(d, data.laws) === activeSource)}
              onClick={() => onSelectLaw(law.id)}
            />
          ))}
        </div>
      </section>

      <section className="glass p-8 rounded-3xl border border-white/5">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Activity className="text-red-500" />
          Volatility Heatmap
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {(domainsBySource.get(activeSource) ?? []).map((domain) => {
            const intensity = resolveMetric(undefined, { entityId: `${domain.id}:volatility`, min: 10, max: 95 });
            return (
              <div
                key={domain.id}
                onClick={() => onSelectDomain(domain)}
                className="aspect-square rounded-xl border border-white/5 flex flex-col items-center justify-center p-2 cursor-pointer hover:scale-105 transition-all"
                style={{ backgroundColor: `rgba(239, 68, 68, ${intensity / 200})` }}
              >
                <div className="text-[8px] font-mono text-zinc-400 uppercase text-center mb-1">{domain.name}</div>
                <div className="text-sm font-bold">{intensity}%</div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex justify-between text-[10px] font-mono text-zinc-500 uppercase">
          <span>Stable</span>
          <div className="flex-1 mx-4 h-1 bg-gradient-to-r from-emerald-500/20 via-yellow-500/20 to-red-500/50 rounded-full" />
          <span>Volatile</span>
        </div>
      </section>
    </div>
  );
}
