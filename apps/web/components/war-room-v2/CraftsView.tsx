import React from 'react';
import { Box, Cpu, Database, Layers, Scale, Zap } from 'lucide-react';
import { AppData, WarRoomViewState } from './types';
import { CraftDetail } from './CraftDetail';

interface CraftsViewProps {
  data: AppData;
  selectedCraftId: string | null;
  returnPath: { view: string; id: string | null } | null;
  onSelectCraft: (id: string | null) => void;
  onSetActiveView: (view: WarRoomViewState) => void;
  onRestoreLaw: (id: string | null) => void;
  onClearReturnPath: () => void;
  onAddEntity: (craftId: string, type: string, entityData: any) => Promise<void>;
}

export function CraftsView({
  data,
  selectedCraftId,
  returnPath,
  onSelectCraft,
  onSetActiveView,
  onRestoreLaw,
  onClearReturnPath,
  onAddEntity
}: CraftsViewProps) {
  if (selectedCraftId) {
    return (
      <CraftDetail
        craft={data.crafts.find((c) => c.id === selectedCraftId)!}
        onBack={() => {
          if (returnPath) {
            onSetActiveView(returnPath.view as WarRoomViewState);
            if (returnPath.view === 'laws') onRestoreLaw(returnPath.id);
            onClearReturnPath();
          } else {
            onSelectCraft(null);
          }
        }}
        onAddEntity={(type: string, entityData: any) => onAddEntity(selectedCraftId, type, entityData)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">Crafts Library</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {data.crafts.map((craft) => (
          <div
            key={craft.id}
            onClick={() => onSelectCraft(craft.id)}
            className="glass p-8 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500/20 transition-colors">
                <Box size={32} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{craft.name}</h3>
                <p className="text-sm text-zinc-500">{craft.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: 'Heaps', count: craft.heaps.length, icon: Database },
                { label: 'Models', count: craft.models.length, icon: Cpu },
                { label: 'Frameworks', count: craft.frameworks.length, icon: Layers },
                { label: 'Barbells', count: craft.barbellStrategies.length, icon: Scale },
                { label: 'Heuristics', count: craft.heuristics.length, icon: Zap }
              ].map((stat) => (
                <div key={stat.label} className="text-center p-2 bg-zinc-800/50 rounded-xl border border-white/5">
                  <stat.icon size={12} className="mx-auto mb-1 text-zinc-500" />
                  <div className="text-xs font-bold">{stat.count}</div>
                  <div className="text-[8px] text-zinc-500 uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
