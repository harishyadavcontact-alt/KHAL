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
import { TaskCard } from './TaskCard';
export const SurgicalExecution = ({ tasks, onUpdateTask }: { tasks: Task[], onUpdateTask: (id: string, updates: Partial<Task>) => void }) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTask = tasks.find(t => t.id === selectedTaskId);
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const activeTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const velocityPerWeek = (doneTasks + activeTasks).toFixed(1);
  const efficiencyPct = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AnimatePresence>
        {selectedTaskId && selectedTask && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTaskId(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass w-full max-w-2xl rounded-2xl relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
                <div>
                  <h2 className="text-2xl font-bold">{selectedTask.title}</h2>
                  <div className="text-xs text-zinc-500 font-mono uppercase tracking-widest">{selectedTask.domainId}</div>
                </div>
                <button onClick={() => setSelectedTaskId(null)} className="p-2 hover:bg-zinc-800 rounded-full">
                  <X className="w-6 h-6 text-zinc-500" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                    <div className="text-[10px] text-zinc-500 uppercase mb-1">Status</div>
                    <div className="text-sm font-bold uppercase text-blue-400">{(selectedTask.status ?? 'not_started').replace('_', ' ')}</div>
                  </div>
                  <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                    <div className="text-[10px] text-zinc-500 uppercase mb-1">Priority</div>
                    <div className="text-sm font-bold">{selectedTask.priority}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase mb-2">Progress</div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${selectedTask.progress}%` }} />
                    </div>
                    <span className="text-sm font-mono font-bold">{selectedTask.progress}%</span>
                  </div>
                </div>
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <div className="text-[10px] text-emerald-400 uppercase mb-1">Strategic Convexity</div>
                  <div className="text-lg font-bold text-emerald-400">+{selectedTask.convexity || 0.0}</div>
                  <p className="text-xs text-zinc-500 mt-1 italic">This task contributes to positive exposure to volatility.</p>
                </div>
              </div>
              <div className="p-6 bg-zinc-900/80 border-t border-white/10 flex justify-end">
                <button 
                  onClick={() => setSelectedTaskId(null)}
                  className="px-8 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors text-white"
                >
                  CLOSE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Crosshair className="text-red-500" />
          Surgical Execution
        </h1>
        <div className="flex gap-4">
          <div className="text-right">
            <div className="text-[10px] text-zinc-500 uppercase">Velocity</div>
            <div className="text-lg font-mono font-bold text-emerald-400">{velocityPerWeek}/wk</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-zinc-500 uppercase">Efficiency</div>
            <div className="text-lg font-mono font-bold text-blue-400">{efficiencyPct}%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {['not_started', 'in_progress', 'done'].map(status => (
          <div key={status} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                {status.replace('_', ' ')}
              </h3>
              <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full">
                {tasks.filter(t => t.status === status).length}
              </span>
            </div>
            <div className="space-y-4">
              {tasks.filter(t => t.status === status).map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onUpdateTask={onUpdateTask} 
                  onClick={() => setSelectedTaskId(task.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


