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
export const LawDetail = ({ law, domains, crafts, onBack, onDomainClick, onCraftClick }: { 
  law: Law, 
  domains: Domain[], 
  crafts: Craft[],
  onBack: () => void, 
  onDomainClick: (d: Domain) => void,
  onCraftClick: (id: string) => void 
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400">
          <ChevronRight className="rotate-180" />
        </button>
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-widest font-mono mb-1">
            <Globe size={12} />
            Laws of Volatility / {law.name}
          </div>
          <h1 className="text-3xl font-bold">{law.name}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section className="glass p-8 rounded-2xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <MapIcon className="text-blue-400" />
              Subordinate Domains
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {domains.map(domain => (
                <div 
                  key={domain.id} 
                  onClick={() => onDomainClick(domain)}
                  className="p-4 bg-zinc-800/50 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-lg group-hover:text-blue-400 transition-colors">{domain.name}</div>
                      <div className="text-xs text-zinc-500 font-mono uppercase">{domain.volatilitySource}</div>
                    </div>
                    <ChevronRight size={16} className="text-zinc-600 group-hover:text-blue-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="glass p-8 rounded-2xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Database className="text-emerald-400" />
              Associated Crafts
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {crafts.map(craft => (
                <div 
                  key={craft.id} 
                  onClick={() => onCraftClick(craft.id)}
                  className="p-4 bg-zinc-800/50 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-lg group-hover:text-emerald-400 transition-colors">{craft.name}</div>
                      <div className="text-xs text-zinc-500">{craft.description}</div>
                    </div>
                    <ChevronRight size={16} className="text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};


