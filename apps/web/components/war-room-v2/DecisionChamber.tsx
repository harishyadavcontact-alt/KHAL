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
export const DecisionChamber = ({ affair, data, onBack }: { affair: Affair, data: AppData, onBack: () => void }) => {
  const interest = data.interests.find(i => i.id === affair.interestId);
  const associatedDomains = affair.context?.associatedDomains ?? [];
  const volatilityExposure = affair.context?.volatilityExposure ?? 'Unknown';
  const objectives = affair.plan?.objectives ?? [];
  const uncertainty = affair.plan?.uncertainty ?? 'Unknown';
  const timeHorizon = affair.plan?.timeHorizon ?? 'Unknown';
  const posture = affair.strategy?.posture ?? 'defense';
  const positioning = affair.strategy?.positioning ?? 'unknown';
  const allies = affair.strategy?.mapping?.allies ?? [];
  const enemies = affair.strategy?.mapping?.enemies ?? [];
  const entities = affair.entities ?? [];
  const craftId = affair.means?.craftId ?? '';
  const selectedHeuristicIds = affair.means?.selectedHeuristicIds ?? [];
  const craft = data.crafts.find(c => c.id === craftId);
  const selectedHeuristics = craft?.heuristics.filter(h => selectedHeuristicIds.includes(h.id)) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400">
          <ChevronRight className="rotate-180" />
        </button>
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-widest font-mono mb-1">
            <Briefcase size={12} />
            Affair Decision Chamber
          </div>
          <h1 className="text-3xl font-bold">{affair.title}</h1>
        </div>
        <div className="ml-auto flex gap-3">
          <div className={cn(
            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
            affair.status === 'execution' ? "bg-red-500/10 border-red-500/50 text-red-400" : "bg-blue-500/10 border-blue-500/50 text-blue-400"
          )}>
            {affair.status}
          </div>
          <div className="px-3 py-1 bg-zinc-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-400 border border-white/5">
            {affair.perspective}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <section className="glass p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
              <Compass size={16} /> Situation Context
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase mb-1">Associated Domains</div>
                <div className="flex flex-wrap gap-2">
                  {associatedDomains.map(d => (
                    <span key={d} className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 uppercase font-mono">{d}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase mb-1">Volatility Exposure</div>
                <p className="text-sm text-zinc-300">{volatilityExposure}</p>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase mb-1">Parent Interest</div>
                <div className="text-sm font-bold text-blue-400">{interest?.title}</div>
              </div>
            </div>
          </section>

          <section className="glass p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
              <Target size={16} /> Planning & Preparation
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase mb-1">Objectives</div>
                <ul className="text-sm text-zinc-300 space-y-1">
                  {objectives.map((o, i) => <li key={i} className="flex items-start gap-2"><ArrowRight size={12} className="mt-1 text-blue-500" /> {o}</li>)}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase mb-1">Uncertainty</div>
                  <div className="text-sm font-mono text-red-400">{uncertainty}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase mb-1">Horizon</div>
                  <div className="text-sm font-mono text-emerald-400">{timeHorizon}</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <section className="glass p-6 rounded-2xl border-l-4 border-l-emerald-500">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
              <Layers size={16} /> Means Selection
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl border border-white/5">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase">Active Craft</div>
                  <div className="font-bold">{craft?.name}</div>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Activity size={20} className="text-emerald-400" />
                </div>
              </div>
              <div className="space-y-2">
                {selectedHeuristics.map(h => (
                  <div key={h.id} className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase">Heuristic</span>
                    </div>
                    <div className="font-bold text-sm mb-1">{h.title}</div>
                    <p className="text-xs text-zinc-400">{h.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="glass p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
              <Sword size={16} /> Strategy Deployment
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                <div className="text-[10px] text-zinc-500 uppercase mb-2">Posture</div>
                <div className={cn(
                  "text-lg font-bold uppercase tracking-widest",
                  posture === 'offense' ? "text-red-400" : "text-blue-400"
                )}>
                  {posture}
                </div>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                <div className="text-[10px] text-zinc-500 uppercase mb-2">Positioning</div>
                <div className="text-lg font-bold uppercase tracking-widest text-zinc-300">
                  {positioning}
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-zinc-800/50 rounded-xl border border-white/5">
              <div className="text-[10px] text-zinc-500 uppercase mb-2">Allies & Enemies</div>
              <div className="flex justify-between">
                <div className="text-xs text-emerald-400">Allies: {allies.join(', ') || 'N/A'}</div>
                <div className="text-xs text-red-400">Enemies: {enemies.join(', ') || 'N/A'}</div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <section className="glass p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
              <Shield size={16} /> Fragility Assessment
            </h3>
            <div className="space-y-4">
              {entities.map(e => (
                <div key={e.id} className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-bold text-sm">{e.name}</div>
                    <span className="text-[10px] text-zinc-500 uppercase">{e.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div className={cn(
                        "h-full transition-all",
                        e.fragility === 'fragile' ? "w-1/3 bg-red-500" :
                        e.fragility === 'robust' ? "w-2/3 bg-blue-500" : "w-full bg-emerald-500"
                      )} />
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      e.fragility === 'fragile' ? "text-red-400" :
                      e.fragility === 'robust' ? "text-blue-400" : "text-emerald-400"
                    )}>
                      {e.fragility}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="p-6 bg-blue-600 rounded-2xl text-center cursor-pointer hover:bg-blue-500 transition-colors">
            <div className="font-bold mb-1 text-white">EXECUTE DECISION</div>
            <div className="text-[10px] uppercase tracking-widest text-white/70">Commit to reality</div>
          </div>
        </div>
      </div>
    </div>
  );
};


