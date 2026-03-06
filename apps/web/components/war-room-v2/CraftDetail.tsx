import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ChevronDown,
  ChevronRight,
  Cpu,
  Database,
  File as FileIcon,
  Layers,
  Link as LinkIcon,
  Milestone,
  Network,
  Plus,
  Scale,
  ShieldAlert,
  Swords,
  Zap
} from 'lucide-react';
import { cn } from './utils';
import { Craft } from './types';
import { GenericAddModal } from './GenericAddModal';

export const CraftDetail = ({
  craft,
  onBack,
  onAddEntity
}: {
  craft: Craft;
  onBack: () => void;
  onAddEntity: (type: string, data: any) => void;
}) => {
  const [expandedHeuristic, setExpandedHeuristic] = useState<string | null>(null);
  const [addModal, setAddModal] = useState<{ isOpen: boolean; type: string }>({ isOpen: false, type: '' });

  const knowledge = useMemo(
    () =>
      craft.knowledge ?? {
        stacks: [],
        protocols: [],
        rules: [],
        heuristics: [],
        wargames: [],
        scenarios: [],
        threats: [],
        responses: [],
        links: []
      },
    [craft.knowledge]
  );

  const Card = ({
    title,
    subtitle,
    icon: Icon,
    children,
    canAdd,
    addType
  }: {
    title: string;
    subtitle: string;
    icon: any;
    children: React.ReactNode;
    canAdd?: boolean;
    addType?: string;
  }) => (
    <section className="glass p-5 rounded-2xl border border-white/5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
            <Icon size={14} /> {title}
          </h3>
          <p className="text-[10px] text-zinc-600 mt-1">{subtitle}</p>
        </div>
        {canAdd && addType ? (
          <button
            onClick={() => setAddModal({ isOpen: true, type: addType })}
            className="p-1 hover:bg-white/5 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label={`Add ${title}`}
          >
            <Plus size={15} />
          </button>
        ) : (
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider">read-only</span>
        )}
      </div>
      {children}
    </section>
  );

  const Empty = ({ text }: { text: string }) => <div className="text-[11px] text-zinc-600 italic py-2">{text}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <GenericAddModal
        isOpen={addModal.isOpen}
        onClose={() => setAddModal({ ...addModal, isOpen: false })}
        type={addModal.type}
        onSave={(data: any) => onAddEntity(addModal.type, data)}
        craft={craft}
      />

      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400">
          <ChevronRight className="rotate-180" />
        </button>
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-widest font-mono mb-1">
            <Database size={12} /> Crafts Library / {craft.name}
          </div>
          <h1 className="text-3xl font-bold">{craft.name}</h1>
          {craft.description && <p className="text-sm text-zinc-500 mt-1">{craft.description}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="Means chain" subtitle="Editable craft building blocks" icon={Database}>
          <div className="space-y-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">Heaps</div>
              <div className="space-y-2">
                {craft.heaps.length === 0 ? (
                  <Empty text="No knowledge heaps." />
                ) : (
                  craft.heaps.slice(0, 3).map((heap) => (
                    <div key={heap.id} className="p-2 rounded-lg border border-white/5 bg-zinc-800/40 text-xs flex items-center gap-2">
                      {heap.type === 'link' ? <LinkIcon size={12} className="text-blue-400" /> : <FileIcon size={12} className="text-emerald-400" />}
                      <span className="truncate">{heap.title}</span>
                    </div>
                  ))
                )}
              </div>
              <button onClick={() => setAddModal({ isOpen: true, type: 'heaps' })} className="mt-2 text-[11px] text-blue-400 hover:text-blue-300">
                + Add heap
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button onClick={() => setAddModal({ isOpen: true, type: 'models' })} className="p-2 rounded-lg border border-white/5 bg-zinc-800/40 hover:border-blue-500/40 text-left">
                <Cpu size={12} className="mb-1 text-zinc-400" /> Models: {craft.models.length}
              </button>
              <button onClick={() => setAddModal({ isOpen: true, type: 'frameworks' })} className="p-2 rounded-lg border border-white/5 bg-zinc-800/40 hover:border-blue-500/40 text-left">
                <Layers size={12} className="mb-1 text-zinc-400" /> Frameworks: {craft.frameworks.length}
              </button>
              <button onClick={() => setAddModal({ isOpen: true, type: 'barbellStrategies' })} className="p-2 rounded-lg border border-white/5 bg-zinc-800/40 hover:border-blue-500/40 text-left">
                <Scale size={12} className="mb-1 text-zinc-400" /> Barbells: {craft.barbellStrategies.length}
              </button>
              <button onClick={() => setAddModal({ isOpen: true, type: 'heuristics' })} className="p-2 rounded-lg border border-white/5 bg-zinc-800/40 hover:border-blue-500/40 text-left">
                <Zap size={12} className="mb-1 text-zinc-400" /> Heuristics: {craft.heuristics.length}
              </button>
            </div>
          </div>
        </Card>

        <Card title="Doctrine" subtitle="Stack → Protocol → Rule → Heuristic" icon={Network}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Stacks', knowledge.stacks.length, Milestone],
                ['Protocols', knowledge.protocols.length, Network],
                ['Rules', knowledge.rules.length, ShieldAlert],
                ['Heuristics', knowledge.heuristics.length, Zap]
              ].map(([label, count, Icon]: any) => (
                <div key={label} className="p-2 rounded-lg border border-white/5 bg-zinc-800/40 text-[11px]">
                  <Icon size={12} className="mb-1 text-zinc-400" />
                  {label}: {count}
                </div>
              ))}
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">Top rules</div>
              <div className="space-y-2">
                {knowledge.rules.length === 0 ? (
                  <Empty text="No rules defined." />
                ) : (
                  knowledge.rules.slice(0, 4).map((rule) => (
                    <div key={rule.id} className="p-2 rounded-lg border border-white/5 bg-zinc-800/40 text-xs">
                      <div className="font-medium">{rule.statement}</div>
                      {rule.rationale && <div className="text-zinc-500 text-[10px] mt-1">{rule.rationale}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card title="War gaming" subtitle="Wargame → Scenario → Threat → Response" icon={Swords}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg border border-white/5 bg-zinc-800/40">Wargames: {knowledge.wargames.length}</div>
              <div className="p-2 rounded-lg border border-white/5 bg-zinc-800/40">Scenarios: {knowledge.scenarios.length}</div>
              <div className="p-2 rounded-lg border border-white/5 bg-zinc-800/40">Threats: {knowledge.threats.length}</div>
              <div className="p-2 rounded-lg border border-white/5 bg-zinc-800/40">Responses: {knowledge.responses.length}</div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">Active threat list</div>
              <div className="space-y-2">
                {knowledge.threats.length === 0 ? (
                  <Empty text="No threats modeled yet." />
                ) : (
                  knowledge.threats.slice(0, 4).map((threat) => (
                    <div key={threat.id} className="p-2 rounded-lg border border-white/5 bg-zinc-800/40 text-xs flex items-center justify-between gap-2">
                      <span className="truncate">{threat.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/20">S{threat.severity ?? 5}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {craft.heuristics.length > 0 && (
        <div className="mt-5 glass p-5 rounded-2xl border border-white/5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Heuristic notes</h3>
          <div className="space-y-2">
            {craft.heuristics.slice(0, 6).map((heuristic) => (
              <div
                key={heuristic.id}
                className="p-2 bg-zinc-800/40 rounded-lg border border-white/5 cursor-pointer"
                onClick={() => setExpandedHeuristic(expandedHeuristic === heuristic.id ? null : heuristic.id)}
              >
                <div className="flex justify-between items-center text-xs font-medium">
                  <span>{heuristic.title}</span>
                  <ChevronDown size={12} className={cn('text-zinc-500 transition-transform', expandedHeuristic === heuristic.id && 'rotate-180')} />
                </div>
                {expandedHeuristic === heuristic.id && (
                  <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="text-[11px] text-zinc-400 mt-2 pt-2 border-t border-white/5">
                    {heuristic.content || 'No note.'}
                  </motion.p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
