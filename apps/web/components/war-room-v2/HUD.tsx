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
import { addYears, differenceInSeconds } from 'date-fns';
import { cn } from './utils';
import { AppData, Law, Domain, Craft, Interest, Affair, Entity, Perspective, Task } from './types';
export const HUD = ({ user }: { user: AppData['user'] }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const birth = new Date(user.birthDate);
  const death = addYears(birth, user.lifeExpectancy);
  
  const secondsLived = differenceInSeconds(now, birth);
  const totalSeconds = differenceInSeconds(death, birth);
  const progress = (secondsLived / totalSeconds) * 100;
  
  const years = Math.floor(secondsLived / (365.25 * 24 * 3600));
  const days = Math.floor((secondsLived % (365.25 * 24 * 3600)) / (24 * 3600));
  const hours = Math.floor((secondsLived % (24 * 3600)) / 3600);
  const mins = Math.floor((secondsLived % 3600) / 60);
  const secs = secondsLived % 60;

  return (
    <div className="glass p-4 rounded-xl flex flex-wrap items-center justify-between gap-6 mb-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-500/20 rounded-lg">
          <Clock className="text-blue-400 w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Temporal Position</div>
          <div className="text-xl font-mono font-bold">
            {years}y {days}d {hours}h {mins}m {secs}s
          </div>
        </div>
      </div>
      
      <div className="flex-1 max-w-md">
        <div className="flex justify-between text-xs mb-1 font-mono uppercase tracking-widest text-zinc-500">
          <span>Life Progress</span>
          <span>{progress.toFixed(6)}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Location</div>
          <div className="text-sm font-medium">{user.location}</div>
        </div>
        <div className="p-3 bg-emerald-500/20 rounded-lg">
          <Activity className="text-emerald-400 w-6 h-6" />
        </div>
      </div>
    </div>
  );
};


