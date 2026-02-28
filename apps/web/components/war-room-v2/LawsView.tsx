import React from 'react';
import { Activity } from 'lucide-react';
import { AppData, Domain } from './types';
import { LawCard } from './LawCard';
import { LawDetail } from './LawDetail';
import { resolveMetric } from './utils';

interface LawsViewProps {
  data: AppData;
  selectedLawId: string | null;
  onSelectLaw: (id: string | null) => void;
  onSelectDomain: (domain: Domain) => void;
  onOpenCraftFromLaw: (craftId: string, lawId: string) => void;
}

export function LawsView({ data, selectedLawId, onSelectLaw, onSelectDomain, onOpenCraftFromLaw }: LawsViewProps) {
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
        <h2 className="text-3xl font-bold mb-8">Laws of Volatility</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.laws.map((law) => (
            <LawCard
              key={law.id}
              law={law}
              domains={data.domains.filter((d) => d.lawId === law.id)}
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
          {data.domains.map((domain) => {
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
