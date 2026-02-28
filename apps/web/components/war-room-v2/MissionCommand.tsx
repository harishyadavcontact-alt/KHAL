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
import { HUD } from './HUD';
import { StrategyCircle } from './StrategyCircle';
import { FragilityRadar } from './FragilityRadar';
import { TaskKillChain } from './TaskKillChain';
import { DomainCard } from './DomainCard';
export const MissionCommand = ({ data, onDomainClick }: { data: AppData, onDomainClick: (d: Domain) => void }) => {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  const getSegmentEntities = (segment: string) => {
    const allEntities = data.affairs.flatMap(a => a.entities);
    if (segment === 'Allies') return allEntities.filter(e => e.type === 'ally');
    if (segment === 'Enemies') return []; // We don't have enemy entities in the schema yet, but we could filter by something else
    return [];
  };

  const segmentEntities = selectedSegment ? getSegmentEntities(selectedSegment) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AnimatePresence>
        {selectedSegment && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSegment(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass w-full max-w-md rounded-2xl relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
                <h2 className="text-xl font-bold uppercase tracking-widest text-sm">{selectedSegment} Analysis</h2>
                <button onClick={() => setSelectedSegment(null)} className="p-1 hover:bg-white/10 rounded-full">
                  <X size={18} className="text-zinc-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {segmentEntities.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 italic">No detailed data for this segment</div>
                ) : (
                  segmentEntities.map(entity => (
                    <div key={entity.id} className="p-4 bg-zinc-800/50 rounded-xl border border-white/5 flex justify-between items-center">
                      <div>
                        <div className="font-bold">{entity.name}</div>
                        <div className="text-[10px] text-zinc-500 uppercase">{entity.type}</div>
                      </div>
                      <div className={cn(
                        "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                        entity.fragility === 'fragile' ? "bg-red-500/10 text-red-400" :
                        entity.fragility === 'robust' ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"
                      )}>
                        {entity.fragility}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <HUD user={data.user} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <StrategyCircle matrix={data.strategyMatrix} onSegmentClick={setSelectedSegment} />
        <FragilityRadar domains={data.domains} affairs={data.affairs} />
        <TaskKillChain tasks={data.tasks} />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MapIcon className="text-blue-400" />
          Macro Domains
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.domains.map(domain => (
          <DomainCard key={domain.id} domain={domain} onClick={() => onDomainClick(domain)} />
        ))}
      </div>
    </div>
  );
};

// --- Main App ---


