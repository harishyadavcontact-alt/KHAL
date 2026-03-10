import React from 'react';
import { Box, Cpu, Database, Layers, Scale, Zap, Network, ShieldAlert, Swords, Milestone } from 'lucide-react';
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
      <h2 className="khal-title text-3xl font-bold">Crafts Library</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {data.crafts.map((craft) => (
          <div
            key={craft.id}
            onClick={() => onSelectCraft(craft.id)}
            className="khal-panel group cursor-pointer rounded-3xl p-8 transition-all hover:border-[var(--color-accent)]"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="rounded-2xl border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-accent)_14%,var(--color-editor-bg-soft))] p-4 transition-colors group-hover:border-[var(--color-accent)]">
                <Box size={32} className="text-[var(--color-accent)]" />
              </div>
              <div>
                <h3 className="khal-title text-2xl font-bold">{craft.name}</h3>
                <p className="text-sm text-[var(--color-text-muted)]">{craft.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {[
                { label: 'Heaps', count: craft.heaps.length, icon: Database },
                { label: 'Models', count: craft.models.length, icon: Cpu },
                { label: 'Frameworks', count: craft.frameworks.length, icon: Layers },
                { label: 'Barbells', count: craft.barbellStrategies.length, icon: Scale },
                { label: 'Heuristics', count: craft.heuristics.length, icon: Zap },
                { label: 'Stacks', count: craft.knowledge?.stacks.length ?? 0, icon: Milestone },
                { label: 'Protocols', count: craft.knowledge?.protocols.length ?? 0, icon: Network },
                { label: 'Rules', count: craft.knowledge?.rules.length ?? 0, icon: ShieldAlert },
                { label: 'Wargames', count: craft.knowledge?.wargames.length ?? 0, icon: Swords }
              ].map((stat) => (
                <div key={stat.label} className="khal-stat p-2 text-center">
                  <stat.icon size={12} className="mx-auto mb-1 text-[var(--color-text-faint)]" />
                  <div className="khal-title text-xs font-bold">{stat.count}</div>
                  <div className="khal-meta text-[8px]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
