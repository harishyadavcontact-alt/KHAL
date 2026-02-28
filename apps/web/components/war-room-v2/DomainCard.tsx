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
export const DomainCard = ({ domain, onClick }: { domain: Domain, onClick: () => void, key?: string }) => {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="glass p-5 rounded-xl cursor-pointer hover:border-blue-500/30 transition-all group"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-bold group-hover:text-blue-400 transition-colors">{domain.name}</h4>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">{domain.volatilitySource}</p>
        </div>
        <div className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-zinc-800 text-emerald-400">
          STABLE
        </div>
      </div>
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500" style={{ width: '30%' }} />
      </div>
    </motion.div>
  );
};


