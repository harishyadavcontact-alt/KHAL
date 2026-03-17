import React from "react";
import { Box, Cpu, Database, Layers, Milestone, Network, Scale, ShieldAlert, Swords, Zap } from "lucide-react";
import { AppData, WarRoomViewState } from "./types";
import { CraftDetail } from "./CraftDetail";

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

function CraftSurface({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="khal-chamber group rounded-2xl p-6 text-left transition hover:border-[var(--color-accent)]"
      style={{
        background: "linear-gradient(180deg, rgba(18,18,31,0.88), rgba(10,10,18,0.94))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 30px rgba(0,0,0,0.18)"
      }}
    >
      {children}
    </div>
  );
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
            if (returnPath.view === "laws") onRestoreLaw(returnPath.id);
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
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-[var(--color-line)] pb-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Crafts Library</div>
          <h2 className="khal-serif-hero mt-2 text-4xl text-[var(--color-text-strong)]">Admissible means</h2>
          <p className="mt-3 max-w-3xl text-sm text-[var(--color-text-muted)]">
            Crafts are the methods library. This surface should answer what methods exist, what doctrine assets they carry, and where to enter for detail.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {data.crafts.map((craft) => (
          <button
            key={craft.id}
            onClick={() => onSelectCraft(craft.id)}
            className="text-left"
          >
            <CraftSurface>
              <div className="flex items-center gap-4 mb-5">
                <div className="rounded-2xl border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-accent)_14%,var(--color-editor-bg-soft))] p-4 transition-colors group-hover:border-[var(--color-accent)]">
                  <Box size={28} className="text-[var(--color-accent)]" />
                </div>
                <div>
                  <h3 className="text-2xl text-[var(--color-text-strong)]">{craft.name}</h3>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">{craft.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
                {[
                  { label: "Heaps", count: craft.heaps.length, icon: Database },
                  { label: "Models", count: craft.models.length, icon: Cpu },
                  { label: "Frameworks", count: craft.frameworks.length, icon: Layers },
                  { label: "Barbells", count: craft.barbellStrategies.length, icon: Scale },
                  { label: "Heuristics", count: craft.heuristics.length, icon: Zap },
                  { label: "Stacks", count: craft.knowledge?.stacks.length ?? 0, icon: Milestone },
                  { label: "Protocols", count: craft.knowledge?.protocols.length ?? 0, icon: Network },
                  { label: "Rules", count: craft.knowledge?.rules.length ?? 0, icon: ShieldAlert },
                  { label: "Wargames", count: craft.knowledge?.wargames.length ?? 0, icon: Swords }
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="khal-subtle-panel p-3 text-center"
                    style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 6px 20px rgba(0,0,0,0.1)" }}
                  >
                    <stat.icon size={12} className="mx-auto mb-2 text-[var(--color-text-faint)]" />
                    <div className="text-sm text-[var(--color-text-strong)]">{stat.count}</div>
                    <div className="text-[8px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">{stat.label}</div>
                  </div>
                ))}
              </div>
            </CraftSurface>
          </button>
        ))}
      </div>
    </div>
  );
}
