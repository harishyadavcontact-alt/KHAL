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
import { DecisionModal } from './DecisionModal';
export const WarGaming = ({ domains, onAddTask }: { domains: Domain[], onAddTask: (task: any) => void }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <DecisionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        domains={domains}
        onSave={onAddTask}
      />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Zap className="text-amber-400" />
          War Gaming Chamber
        </h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors text-white"
        >
          <Plus className="w-5 h-5" />
          New Scenario
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="glass p-8 rounded-xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="text-emerald-400" />
            Jensen's Inequality
          </h3>
          <div className="h-[300px] w-full bg-zinc-800/30 rounded-lg flex items-center justify-center border border-white/5">
            <div className="text-center p-6">
              <div className="text-4xl font-bold text-emerald-400 mb-2">E[f(X)] &gt; f(E[X])</div>
              <p className="text-zinc-400 max-w-sm">
                Convexity visualization: In a convex payoff structure, volatility increases the expected value. 
              </p>
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Activity className="text-blue-400" />
            Ergodicity Check
          </h3>
          <div className="h-[300px] w-full bg-zinc-800/30 rounded-lg flex items-center justify-center border border-white/5">
            <div className="text-center p-6">
              <div className="text-4xl font-bold text-blue-400 mb-2">T ≠ E</div>
              <p className="text-zinc-400 max-w-sm">
                Time average ≠ Ensemble average. Survival is the first priority. 
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


