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
export const TaskCard = ({ task, onUpdateTask, onClick }: { task: Task, onUpdateTask: (id: string, updates: Partial<Task>) => void, onClick?: () => void, key?: string }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div className="glass p-4 rounded-xl border-l-4 border-l-blue-500 hover:border-blue-400 transition-all">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 uppercase">
          {task.domainId}
        </span>
        <div className="flex gap-2">
          {task.status !== 'done' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onUpdateTask(task.id, { status: task.status === 'not_started' ? 'in_progress' : 'done' });
              }}
              className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded text-zinc-400"
            >
              NEXT
            </button>
          )}
          <span className="text-xs font-bold text-zinc-500">P:{task.priority}</span>
        </div>
      </div>
      <h4 className="font-bold mb-3 cursor-pointer hover:text-blue-400 transition-colors" onClick={onClick}>{task.title}</h4>
      
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
          <span>PROGRESS</span>
          <span>{task.progress}%</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${task.progress}%` }}
            className="h-full bg-blue-500"
          />
        </div>
        {task.status === 'in_progress' && (
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={task.progress}
            onChange={(e) => onUpdateTask(task.id, { progress: parseInt(e.target.value) })}
            className="w-full mt-2 accent-blue-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
          />
        )}
      </div>

      {showDetails && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mb-4 text-xs text-zinc-400 space-y-2 border-t border-white/5 pt-3"
        >
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="uppercase text-zinc-300">{task.type}</span>
          </div>
          <div className="flex justify-between">
            <span>Convexity:</span>
            <span className="text-emerald-400">+{task.convexity || 0.0}</span>
          </div>
          <p className="italic">"Survival is the first priority. Optimization comes later."</p>
        </motion.div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex -space-x-2">
          <div className="w-6 h-6 rounded-full bg-zinc-700 border-2 border-zinc-900" />
        </div>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300"
        >
          {showDetails ? 'Hide' : 'Details'}
        </button>
      </div>
    </div>
  );
};


