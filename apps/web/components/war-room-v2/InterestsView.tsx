import React from 'react';
import { Plus } from 'lucide-react';
import { AppData } from './types';
import { InterestDetail } from './InterestDetail';

interface InterestsViewProps {
  data: AppData;
  selectedInterestId: string | null;
  onSelectInterest: (id: string | null) => void;
  onSelectAffair: (id: string) => void;
}

export function InterestsView({ data, selectedInterestId, onSelectInterest, onSelectAffair }: InterestsViewProps) {
  if (selectedInterestId) {
    return (
      <InterestDetail
        interest={data.interests.find((i) => i.id === selectedInterestId)!}
        affairs={data.affairs.filter((a) => a.interestId === selectedInterestId)}
        onBack={() => onSelectInterest(null)}
        onAffairClick={(id: string) => {
          onSelectAffair(id);
          onSelectInterest(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Long-term Interests</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-bold text-white">
          <Plus size={16} /> New Interest
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.interests.map((interest) => (
          <div
            key={interest.id}
            onClick={() => onSelectInterest(interest.id)}
            className="glass p-6 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-mono text-zinc-400 uppercase">{interest.perspective}</div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{interest.domainId}</span>
            </div>
            <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{interest.title}</h3>
            <div className="text-sm text-zinc-400 mb-4">
              Stakes: <span className="text-zinc-200">{interest.stakes}</span>
            </div>
            <div className="space-y-2">
              {(interest.objectives ?? []).map((o, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-zinc-500">
                  <div className="w-1 h-1 bg-blue-500 rounded-full" />
                  {o}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
