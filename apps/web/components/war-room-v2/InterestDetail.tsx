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
export const InterestDetail = ({ interest, affairs, onBack, onAffairClick }: { 
  interest: Interest, 
  affairs: Affair[], 
  onBack: () => void,
  onAffairClick: (id: string) => void
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400">
          <ChevronRight className="rotate-180" />
        </button>
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-widest font-mono mb-1">
            <Anchor size={12} />
            Interests / {interest.title}
          </div>
          <h1 className="text-3xl font-bold">{interest.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <section className="glass p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Interest Profile</h3>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase mb-1">Perspective</div>
                <div className="px-2 py-1 bg-zinc-800 rounded inline-block text-xs font-mono text-zinc-300 uppercase">{interest.perspective}</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase mb-1">Domain</div>
                <div className="text-sm font-bold">{interest.domainId}</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase mb-1">Stakes</div>
                <p className="text-sm text-zinc-300">{interest.stakes}</p>
              </div>
            </div>
          </section>

          <section className="glass p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Strategic Objectives</h3>
            <div className="space-y-3">
              {(interest.objectives ?? []).map((o, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-zinc-800/30 rounded-lg border border-white/5">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-sm text-zinc-300">{o}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <section className="glass p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Briefcase className="text-blue-400" />
                Active Affairs
              </h3>
              <button className="p-2 hover:bg-white/5 rounded-lg text-blue-400">
                <Plus size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {affairs.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 italic">No active affairs for this interest</div>
              ) : (
                affairs.map(affair => (
                  <div 
                    key={affair.id} 
                    onClick={() => onAffairClick(affair.id)}
                    className="p-4 bg-zinc-800/50 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-lg group-hover:text-blue-400 transition-colors">{affair.title}</div>
                        <div className="flex gap-2 mt-1">
                          <span className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded uppercase",
                            affair.status === 'execution' ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
                          )}>
                            {affair.status}
                          </span>
                          <span className="text-[10px] text-zinc-500 uppercase font-mono">{affair.perspective}</span>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-zinc-600 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};


