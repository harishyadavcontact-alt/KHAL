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
export const TaskKillChain = ({ tasks }: { tasks: Task[] }) => {
  const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority).slice(0, 5);

  return (
    <div className="glass p-6 rounded-xl h-full">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Sword className="text-emerald-400" />
        Surgical Kill Chain
      </h3>
      <div className="space-y-3">
        {sortedTasks.map(task => (
          <div key={task.id} className="p-3 bg-zinc-800/50 border border-white/5 rounded-lg flex items-center justify-between group hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-2 h-2 rounded-full",
                task.type === 'affair' ? "bg-blue-400" : "bg-emerald-400"
              )} />
              <div>
                <div className="text-sm font-medium line-clamp-1">{task.title}</div>
                <div className="text-[10px] uppercase text-zinc-500 font-mono">{task.domainId}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-mono font-bold text-zinc-400">P:{task.priority}</div>
              <button className="p-1 hover:bg-zinc-700 rounded transition-colors">
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-4 py-2 text-xs font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors">
        View Full Chain
      </button>
    </div>
  );
};


