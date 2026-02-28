import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Zap,
  Target,
  Activity,
  Clock,
  Map as MapIcon,
  Crosshair,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  LayoutDashboard,
  Sword,
  Settings,
  Plus,
  FileDown as Import,
  BookOpen,
  Users,
  Eye,
  EyeOff,
  Globe,
  Lock,
  User,
  ArrowRight,
  Layers,
  Database,
  Search,
  Download,
  Maximize2,
  Minimize2,
  Scale,
  Compass,
  Briefcase,
  Heart,
  Anchor,
  Box,
  Cpu,
  Terminal,
  Menu,
  X,
  Link as LinkIcon,
  File as FileIcon,
  ChevronDown
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie
} from 'recharts';
import { cn } from './utils';
import { AppData, Law, Domain, Craft, Interest, Affair, Entity, Perspective, Task } from './types';
import { GenericAddModal } from './GenericAddModal';
export const CraftDetail = ({ craft, onBack, onAddEntity }: { craft: Craft, onBack: () => void, onAddEntity: (type: string, data: any) => void }) => {
  const [expandedHeuristic, setExpandedHeuristic] = useState<string | null>(null);
  const [addModal, setAddModal] = useState<{ isOpen: boolean, type: string }>({ isOpen: false, type: '' });

  const EntitySection = ({ title, icon: Icon, items, type, renderItem }: { title: string, icon: any, items: any[], type: string, renderItem: (item: any) => React.ReactNode }) => (
    <div className="glass p-6 rounded-2xl border border-white/5 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
          <Icon size={16} /> {title}
        </h3>
        <button 
          onClick={() => setAddModal({ isOpen: true, type })}
          className="p-1 hover:bg-white/5 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
        {items.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-600 italic">No {title.toLowerCase()} defined</div>
        ) : (
          items.map(renderItem)
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <GenericAddModal 
        isOpen={addModal.isOpen} 
        onClose={() => setAddModal({ ...addModal, isOpen: false })} 
        type={addModal.type}
        onSave={(data: any) => onAddEntity(addModal.type, data)}
        craft={craft}
      />
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400">
          <ChevronRight className="rotate-180" />
        </button>
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-widest font-mono mb-1">
            <Database size={12} />
            Crafts Library / {craft.name}
          </div>
          <h1 className="text-3xl font-bold">{craft.name}</h1>
        </div>
      </div>

      <div className="crafts-entity-grid">
        {/* Heaps */}
        <EntitySection 
          title="Knowledge Heaps" 
          icon={Database} 
          items={craft.heaps} 
          type="heaps"
          renderItem={(heap) => (
            <div key={heap.id} className="p-3 bg-zinc-800/50 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all group">
              <div className="flex items-center gap-3">
                {heap.type === 'link' ? <LinkIcon size={14} className="text-blue-400" /> : <FileIcon size={14} className="text-emerald-400" />}
                <div className="text-xs font-medium truncate">{heap.title}</div>
              </div>
              {heap.url && <div className="text-[10px] text-zinc-500 truncate ml-6 mt-1">{heap.url}</div>}
            </div>
          )}
        />

        {/* Models */}
        <EntitySection 
          title="Models" 
          icon={Cpu} 
          items={craft.models} 
          type="models"
          renderItem={(model) => (
            <div key={model.id} className="p-3 bg-zinc-800/50 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all">
              <div className="text-xs font-bold mb-1">{model.title}</div>
              <p className="text-[10px] text-zinc-500 line-clamp-2">{model.description}</p>
              <div className="mt-2 flex gap-1">
                {model.heapIds.map((hId: string) => (
                  <div key={hId} className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                ))}
              </div>
            </div>
          )}
        />

        {/* Frameworks */}
        <EntitySection 
          title="Frameworks" 
          icon={Layers} 
          items={craft.frameworks} 
          type="frameworks"
          renderItem={(framework) => (
            <div key={framework.id} className="p-3 bg-zinc-800/50 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all">
              <div className="text-xs font-bold mb-1">{framework.title}</div>
              <p className="text-[10px] text-zinc-500 line-clamp-2">{framework.description}</p>
            </div>
          )}
        />

        {/* Barbell Strategies */}
        <EntitySection 
          title="Barbell Strategies" 
          icon={Scale} 
          items={craft.barbellStrategies} 
          type="barbellStrategies"
          renderItem={(barbell) => (
            <div key={barbell.id} className="p-3 bg-zinc-800/50 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all">
              <div className="text-xs font-bold mb-2">{barbell.title}</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden flex">
                  <div className="h-full bg-blue-500" style={{ width: '90%' }} />
                  <div className="h-full bg-red-500" style={{ width: '10%' }} />
                </div>
              </div>
              <div className="flex justify-between text-[8px] font-mono text-zinc-500 mt-1 uppercase">
                <span>90% Hedge</span>
                <span>10% Edge</span>
              </div>
            </div>
          )}
        />

        {/* Heuristics */}
        <EntitySection 
          title="Heuristics" 
          icon={Zap} 
          items={craft.heuristics} 
          type="heuristics"
          renderItem={(heuristic) => (
            <div 
              key={heuristic.id} 
              className="p-3 bg-zinc-800/50 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer"
              onClick={() => setExpandedHeuristic(expandedHeuristic === heuristic.id ? null : heuristic.id)}
            >
              <div className="flex justify-between items-center">
                <div className="text-xs font-bold">{heuristic.title}</div>
                <ChevronDown size={12} className={cn("text-zinc-500 transition-transform", expandedHeuristic === heuristic.id && "rotate-180")} />
              </div>
              {expandedHeuristic === heuristic.id && (
                <motion.p 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="text-[10px] text-zinc-400 mt-2 border-t border-white/5 pt-2"
                >
                  {heuristic.content}
                </motion.p>
              )}
            </div>
          )}
        />
      </div>
    </div>
  );
};


