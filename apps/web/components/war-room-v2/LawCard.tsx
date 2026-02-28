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
export const LawCard = ({ law, domains, onClick }: { law: Law, domains: Domain[], onClick: () => void, key?: string }) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="glass p-6 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all group cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
          <Globe className="text-blue-400" size={24} />
        </div>
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Fixed Law</div>
      </div>
      <h3 className="text-xl font-bold mb-2">{law.name}</h3>
      <p className="text-sm text-zinc-400 mb-6">Immutable law of reality. Navigate, do not resist.</p>
      
      <div className="space-y-3">
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-1">Subordinate Domains</div>
        {domains.map(d => (
          <div key={d.id} className="flex items-center justify-between text-sm">
            <span className="text-zinc-300">{d.name}</span>
            <span className="text-[10px] font-mono text-zinc-500">{d.volatilitySource}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};


