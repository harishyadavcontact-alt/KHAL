import React from 'react';
import { Plus } from 'lucide-react';
import { AppData } from './types';
import { cn } from './utils';

interface AffairsViewProps {
  data: AppData;
  onSelectAffair: (id: string) => void;
}

export function AffairsView({ data, onSelectAffair }: AffairsViewProps) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Active Affairs</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-bold text-white">
          <Plus size={16} /> New Affair
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.affairs.map((affair) => (
          <div
            key={affair.id}
            onClick={() => onSelectAffair(affair.id)}
            className="glass p-6 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className={cn(
                  'px-2 py-1 rounded text-[10px] font-mono uppercase',
                  affair.status === 'execution' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                )}
              >
                {affair.status}
              </div>
              <div className="text-[10px] font-mono text-zinc-500 uppercase">{affair.perspective}</div>
            </div>
            <h3 className="text-xl font-bold mb-4 group-hover:text-blue-400 transition-colors">{affair.title}</h3>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              <span>Domains: {affair.context.associatedDomains.length}</span>
              <span>Heuristics: {affair.means.selectedHeuristicIds.length}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
