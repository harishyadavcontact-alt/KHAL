import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, differenceInSeconds, addYears } from 'date-fns';
import { AppData, Law, Domain, Craft, Interest, Affair, Entity, Perspective, Task } from './types';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

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

export const StrategyCircle = ({ matrix, onSegmentClick }: { matrix: AppData['strategyMatrix'], onSegmentClick: (segment: string) => void }) => {
  const data = [
    { name: 'Allies', value: matrix.allies, color: '#10b981' },
    { name: 'Enemies', value: matrix.enemies, color: '#ef4444' },
    { name: 'Overt', value: matrix.overt, color: '#3b82f6' },
    { name: 'Covert', value: matrix.covert, color: '#8b5cf6' },
    { name: 'Offense', value: matrix.offense, color: '#f59e0b' },
    { name: 'Defense', value: matrix.defense, color: '#6366f1' },
    { name: 'Conventional', value: matrix.conventional, color: '#a1a1aa' },
    { name: 'Unconventional', value: matrix.unconventional, color: '#d946ef' },
  ];

  return (
    <div className="glass p-6 rounded-xl h-full">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
        <Target className="text-blue-400" />
        Strategic Posture (8 Fronts)
      </h3>
      <div className="h-[250px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              onClick={(entry) => onSegmentClick(entry.name)}
              className="cursor-pointer"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold">90/10</div>
            <div className="text-[10px] uppercase text-zinc-500 font-mono">Barbell</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-[10px] font-mono">
        {data.map(d => (
          <div 
            key={d.name} 
            className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
            onClick={() => onSegmentClick(d.name)}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-zinc-400 truncate">{d.name}:</span>
            <span className="font-bold">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const FragilityRadar = ({ domains, affairs }: { domains: Domain[], affairs: Affair[] }) => {
  // Map domains to fragility based on affairs
  const data = domains.map(d => {
    const domainAffairs = affairs.filter(a => a.context.associatedDomains.includes(d.id));
    const avgFragility = domainAffairs.reduce((acc, a) => {
      const fragileCount = a.entities.filter(e => e.fragility === 'fragile').length;
      return acc + (fragileCount * 20);
    }, 20);
    
    return {
      subject: d.name,
      A: Math.min(100, avgFragility),
      fullMark: 100,
    };
  });

  return (
    <div className="glass p-6 rounded-xl h-full">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
        <AlertTriangle className="text-red-400" />
        Fragility Mapping
      </h3>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#3f3f46" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
            <Radar
              name="Fragility"
              dataKey="A"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

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

export const DecisionChamber = ({ affair, data, onBack }: { affair: Affair, data: AppData, onBack: () => void }) => {
  const interest = data.interests.find(i => i.id === affair.interestId);
  const craft = data.crafts.find(c => c.id === affair.means.craftId);
  const selectedHeuristics = craft?.heuristics.filter(h => affair.means.selectedHeuristicIds.includes(h.id)) || [];

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
                  {affair.context.associatedDomains.map(d => (
                    <span key={d} className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 uppercase font-mono">{d}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase mb-1">Volatility Exposure</div>
                <p className="text-sm text-zinc-300">{affair.context.volatilityExposure}</p>
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
                  {affair.plan.objectives.map((o, i) => <li key={i} className="flex items-start gap-2"><ArrowRight size={12} className="mt-1 text-blue-500" /> {o}</li>)}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase mb-1">Uncertainty</div>
                  <div className="text-sm font-mono text-red-400">{affair.plan.uncertainty}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase mb-1">Horizon</div>
                  <div className="text-sm font-mono text-emerald-400">{affair.plan.timeHorizon}</div>
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
                  affair.strategy.posture === 'offense' ? "text-red-400" : "text-blue-400"
                )}>
                  {affair.strategy.posture}
                </div>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                <div className="text-[10px] text-zinc-500 uppercase mb-2">Positioning</div>
                <div className="text-lg font-bold uppercase tracking-widest text-zinc-300">
                  {affair.strategy.positioning}
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-zinc-800/50 rounded-xl border border-white/5">
              <div className="text-[10px] text-zinc-500 uppercase mb-2">Allies & Enemies</div>
              <div className="flex justify-between">
                <div className="text-xs text-emerald-400">Allies: {affair.strategy.mapping.allies.join(', ')}</div>
                <div className="text-xs text-red-400">Enemies: {affair.strategy.mapping.enemies.join(', ')}</div>
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
              {affair.entities.map(e => (
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

export const SurgicalExecution = ({ tasks, onUpdateTask }: { tasks: Task[], onUpdateTask: (id: string, updates: Partial<Task>) => void }) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTask = tasks.find(t => t.id === selectedTaskId);

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
            <div className="text-lg font-mono font-bold text-emerald-400">12.5/wk</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-zinc-500 uppercase">Efficiency</div>
            <div className="text-lg font-mono font-bold text-blue-400">92%</div>
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

export const DecisionModal = ({ isOpen, onClose, domains, onSave }: { isOpen: boolean, onClose: () => void, domains: Domain[], onSave: (task: any) => void }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    domainId: domains[0]?.id || '',
    type: 'interest',
    upside: '',
    downside: '',
    ergodicity: false,
    jensen: false,
    barbell: false,
    priority: 50
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass w-full max-w-2xl rounded-2xl relative z-10 overflow-hidden"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="text-amber-400 w-5 h-5" />
            Decision Chamber: New Scenario
          </h2>
          <div className="text-xs font-mono text-zinc-500">STEP {step} OF 3</div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Target Domain</label>
                <select 
                  className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm"
                  value={formData.domainId}
                  onChange={e => setFormData({...formData, domainId: e.target.value})}
                >
                  {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-500 mb-2">Scenario Title</label>
                <input 
                  type="text"
                  placeholder="e.g., Supply Chain Fracture"
                  className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-zinc-300 mb-4">Strategic Filters</h4>
              <div 
                className={cn("p-4 rounded-xl border transition-all cursor-pointer", formData.ergodicity ? "bg-blue-500/10 border-blue-500/50" : "bg-zinc-800/50 border-white/5")}
                onClick={() => setFormData({...formData, ergodicity: !formData.ergodicity})}
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className={cn("w-4 h-4 rounded border flex items-center justify-center", formData.ergodicity ? "bg-blue-500 border-blue-500" : "border-zinc-500")}>
                    {formData.ergodicity && <ChevronRight className="w-3 h-3 text-white" />}
                  </div>
                  <span className="font-bold text-sm">Ergodicity Check</span>
                </div>
                <p className="text-xs text-zinc-500 ml-7">Survival is priority. No absorbing barriers.</p>
              </div>
              <div 
                className={cn("p-4 rounded-xl border transition-all cursor-pointer", formData.jensen ? "bg-emerald-500/10 border-emerald-500/50" : "bg-zinc-800/50 border-white/5")}
                onClick={() => setFormData({...formData, jensen: !formData.jensen})}
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className={cn("w-4 h-4 rounded border flex items-center justify-center", formData.jensen ? "bg-emerald-500 border-emerald-500" : "border-zinc-500")}>
                    {formData.jensen && <ChevronRight className="w-3 h-3 text-white" />}
                  </div>
                  <span className="font-bold text-sm">Convexity Check</span>
                </div>
                <p className="text-xs text-zinc-500 ml-7">Gain from volatility. Capped downside, unlimited upside.</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="p-6 bg-zinc-800/50 rounded-xl border border-white/5">
                <h4 className="text-sm font-bold mb-4">Execution Parameters</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase mb-1">Priority</label>
                    <input type="number" className="w-full bg-zinc-900 border border-white/5 rounded p-2 text-xs" value={formData.priority} onChange={e => setFormData({...formData, priority: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase mb-1">Type</label>
                    <select className="w-full bg-zinc-900 border border-white/5 rounded p-2 text-xs" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                      <option value="interest">Interest</option>
                      <option value="affair">Affair</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-zinc-900/80 border-t border-white/10 flex justify-between">
          <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} className="px-6 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-300">
            {step === 1 ? 'CANCEL' : 'BACK'}
          </button>
          <button 
            onClick={() => {
              if (step < 3) setStep(step + 1);
              else {
                onSave(formData);
                onClose();
              }
            }}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors text-white"
          >
            {step === 3 ? 'EXECUTE' : 'NEXT'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

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

export const MissionCommand = ({ data, onDomainClick }: { data: AppData, onDomainClick: (d: Domain) => void }) => {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  const getSegmentEntities = (segment: string) => {
    const allEntities = data.affairs.flatMap(a => a.entities);
    if (segment === 'Allies') return allEntities.filter(e => e.type === 'ally');
    if (segment === 'Enemies') return []; // We don't have enemy entities in the schema yet, but we could filter by something else
    return [];
  };

  const segmentEntities = selectedSegment ? getSegmentEntities(selectedSegment) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AnimatePresence>
        {selectedSegment && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSegment(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass w-full max-w-md rounded-2xl relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
                <h2 className="text-xl font-bold uppercase tracking-widest text-sm">{selectedSegment} Analysis</h2>
                <button onClick={() => setSelectedSegment(null)} className="p-1 hover:bg-white/10 rounded-full">
                  <X size={18} className="text-zinc-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {segmentEntities.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 italic">No detailed data for this segment</div>
                ) : (
                  segmentEntities.map(entity => (
                    <div key={entity.id} className="p-4 bg-zinc-800/50 rounded-xl border border-white/5 flex justify-between items-center">
                      <div>
                        <div className="font-bold">{entity.name}</div>
                        <div className="text-[10px] text-zinc-500 uppercase">{entity.type}</div>
                      </div>
                      <div className={cn(
                        "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                        entity.fragility === 'fragile' ? "bg-red-500/10 text-red-400" :
                        entity.fragility === 'robust' ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"
                      )}>
                        {entity.fragility}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <HUD user={data.user} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <StrategyCircle matrix={data.strategyMatrix} onSegmentClick={setSelectedSegment} />
        <FragilityRadar domains={data.domains} affairs={data.affairs} />
        <TaskKillChain tasks={data.tasks} />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MapIcon className="text-blue-400" />
          Macro Domains
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.domains.map(domain => (
          <DomainCard key={domain.id} domain={domain} onClick={() => onDomainClick(domain)} />
        ))}
      </div>
    </div>
  );
};

// --- Main App ---

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

export const GenericAddModal = ({ isOpen, onClose, type, onSave, craft }: { isOpen: boolean, onClose: () => void, type: string, onSave: (data: any) => void, craft: Craft }) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        name: '',
        description: '',
        content: '',
        url: '',
        type: 'link',
        hedge: '90% Safe',
        edge: '10% Speculative',
        heapIds: [],
        modelIds: [],
        frameworkIds: [],
        barbellStrategyIds: []
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isHeap = type === 'heaps';
  const isModel = type === 'models';
  const isFramework = type === 'frameworks';
  const isBarbell = type === 'barbellStrategies';
  const isHeuristic = type === 'heuristics';

  const toggleSelection = (field: string, id: string) => {
    const current = formData[field] || [];
    if (current.includes(id)) {
      setFormData({ ...formData, [field]: current.filter((i: string) => i !== id) });
    } else {
      setFormData({ ...formData, [field]: [...current, id] });
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass w-full max-w-md rounded-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
          <h2 className="text-xl font-bold flex items-center gap-2 uppercase tracking-widest text-sm">
            <Plus className="text-blue-400 w-4 h-4" />
            Add New {type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
            <X size={18} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          <div>
            <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Title / Name</label>
            <input 
              type="text"
              className="w-full bg-zinc-800 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
              value={formData.title || formData.name}
              onChange={e => setFormData({...formData, title: e.target.value, name: e.target.value})}
              autoFocus
            />
          </div>

          {isHeap && (
            <>
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Type</label>
                <select 
                  className="w-full bg-zinc-800 border border-white/10 rounded-lg p-2 text-sm text-white"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="link">Link</option>
                  <option value="file">File</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">URL / File Path</label>
                <input 
                  type="text"
                  className="w-full bg-zinc-800 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  value={formData.url}
                  onChange={e => setFormData({...formData, url: e.target.value})}
                />
              </div>
            </>
          )}

          {(isModel || isFramework) && (
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Description</label>
              <textarea 
                className="w-full bg-zinc-800 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500 h-24"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
          )}

          {isModel && (
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-2">Build from Heaps</label>
              <div className="grid grid-cols-1 gap-2">
                {craft.heaps.map(heap => (
                  <div 
                    key={heap.id} 
                    onClick={() => toggleSelection('heapIds', heap.id)}
                    className={cn(
                      "p-2 rounded-lg border text-xs cursor-pointer transition-all",
                      formData.heapIds?.includes(heap.id) ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-zinc-800/50 border-white/5 text-zinc-500"
                    )}
                  >
                    {heap.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isFramework && (
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-2">Build from Models</label>
              <div className="grid grid-cols-1 gap-2">
                {craft.models.map(model => (
                  <div 
                    key={model.id} 
                    onClick={() => toggleSelection('modelIds', model.id)}
                    className={cn(
                      "p-2 rounded-lg border text-xs cursor-pointer transition-all",
                      formData.modelIds?.includes(model.id) ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-zinc-800/50 border-white/5 text-zinc-500"
                    )}
                  >
                    {model.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isBarbell && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Hedge (90%)</label>
                  <input 
                    type="text"
                    className="w-full bg-zinc-800 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    value={formData.hedge}
                    onChange={e => setFormData({...formData, hedge: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Edge (10%)</label>
                  <input 
                    type="text"
                    className="w-full bg-zinc-800 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    value={formData.edge}
                    onChange={e => setFormData({...formData, edge: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-2">Apply to Frameworks</label>
                <div className="grid grid-cols-1 gap-2">
                  {craft.frameworks.map(fw => (
                    <div 
                      key={fw.id} 
                      onClick={() => toggleSelection('frameworkIds', fw.id)}
                      className={cn(
                        "p-2 rounded-lg border text-xs cursor-pointer transition-all",
                        formData.frameworkIds?.includes(fw.id) ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-zinc-800/50 border-white/5 text-zinc-500"
                      )}
                    >
                      {fw.title}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {isHeuristic && (
            <>
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">Content / Rule</label>
                <textarea 
                  className="w-full bg-zinc-800 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500 h-24"
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-2">Derived from Barbells</label>
                <div className="grid grid-cols-1 gap-2">
                  {craft.barbellStrategies.map(bb => (
                    <div 
                      key={bb.id} 
                      onClick={() => toggleSelection('barbellStrategyIds', bb.id)}
                      className={cn(
                        "p-2 rounded-lg border text-xs cursor-pointer transition-all",
                        formData.barbellStrategyIds?.includes(bb.id) ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-zinc-800/50 border-white/5 text-zinc-500"
                      )}
                    >
                      {bb.title}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 bg-zinc-900/80 border-t border-white/10 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300">
            CANCEL
          </button>
          <button 
            onClick={() => {
              onSave(formData);
              onClose();
            }}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-colors text-white"
          >
            SAVE ENTITY
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const CraftDetail = ({ craft, onBack, onAddEntity }: { craft: Craft, onBack: () => void, onAddEntity: (type: string, data: any) => void }) => {
  const [expandedHeuristic, setExpandedHeuristic] = useState<string | null>(null);
  const [addModal, setAddModal] = useState<{ isOpen: boolean, type: string }>({ isOpen: false, type: '' });

  const EntitySection = ({ title, icon: Icon, items, type, renderItem }: { title: string, icon: any, items: any[], type: string, renderItem: (item: any) => React.ReactNode }) => (
    <div className="glass p-6 rounded-2xl border border-white/5 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
          <Icon size={16} /> {title}
        </h3>
        <button 
          onClick={() => setAddModal({ isOpen: true, type })}
          className="p-1 hover:bg-white/5 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
        {items.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-600 italic">No {title.toLowerCase()} defined</div>
        ) : (
          items.map(renderItem)
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <GenericAddModal 
        isOpen={addModal.isOpen} 
        onClose={() => setAddModal({ ...addModal, isOpen: false })} 
        type={addModal.type}
        onSave={(data) => onAddEntity(addModal.type, data)}
        craft={craft}
      />
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400">
          <ChevronRight className="rotate-180" />
        </button>
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-widest font-mono mb-1">
            <Database size={12} />
            Crafts Library / {craft.name}
          </div>
          <h1 className="text-3xl font-bold">{craft.name}</h1>
        </div>
      </div>

      <div className="crafts-entity-grid">
        {/* Heaps */}
        <EntitySection 
          title="Knowledge Heaps" 
          icon={Database} 
          items={craft.heaps} 
          type="heaps"
          renderItem={(heap) => (
            <div key={heap.id} className="p-3 bg-zinc-800/50 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all group">
              <div className="flex items-center gap-3">
                {heap.type === 'link' ? <LinkIcon size={14} className="text-blue-400" /> : <FileIcon size={14} className="text-emerald-400" />}
                <div className="text-xs font-medium truncate">{heap.title}</div>
              </div>
              {heap.url && <div className="text-[10px] text-zinc-500 truncate ml-6 mt-1">{heap.url}</div>}
            </div>
          )}
        />

        {/* Models */}
        <EntitySection 
          title="Models" 
          icon={Cpu} 
          items={craft.models} 
          type="models"
          renderItem={(model) => (
            <div key={model.id} className="p-3 bg-zinc-800/50 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all">
              <div className="text-xs font-bold mb-1">{model.title}</div>
              <p className="text-[10px] text-zinc-500 line-clamp-2">{model.description}</p>
              <div className="mt-2 flex gap-1">
                {model.heapIds.map((hId: string) => (
                  <div key={hId} className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                ))}
              </div>
            </div>
          )}
        />

        {/* Frameworks */}
        <EntitySection 
          title="Frameworks" 
          icon={Layers} 
          items={craft.frameworks} 
          type="frameworks"
          renderItem={(framework) => (
            <div key={framework.id} className="p-3 bg-zinc-800/50 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all">
              <div className="text-xs font-bold mb-1">{framework.title}</div>
              <p className="text-[10px] text-zinc-500 line-clamp-2">{framework.description}</p>
            </div>
          )}
        />

        {/* Barbell Strategies */}
        <EntitySection 
          title="Barbell Strategies" 
          icon={Scale} 
          items={craft.barbellStrategies} 
          type="barbellStrategies"
          renderItem={(barbell) => (
            <div key={barbell.id} className="p-3 bg-zinc-800/50 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all">
              <div className="text-xs font-bold mb-2">{barbell.title}</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden flex">
                  <div className="h-full bg-blue-500" style={{ width: '90%' }} />
                  <div className="h-full bg-red-500" style={{ width: '10%' }} />
                </div>
              </div>
              <div className="flex justify-between text-[8px] font-mono text-zinc-500 mt-1 uppercase">
                <span>90% Hedge</span>
                <span>10% Edge</span>
              </div>
            </div>
          )}
        />

        {/* Heuristics */}
        <EntitySection 
          title="Heuristics" 
          icon={Zap} 
          items={craft.heuristics} 
          type="heuristics"
          renderItem={(heuristic) => (
            <div 
              key={heuristic.id} 
              className="p-3 bg-zinc-800/50 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer"
              onClick={() => setExpandedHeuristic(expandedHeuristic === heuristic.id ? null : heuristic.id)}
            >
              <div className="flex justify-between items-center">
                <div className="text-xs font-bold">{heuristic.title}</div>
                <ChevronDown size={12} className={cn("text-zinc-500 transition-transform", expandedHeuristic === heuristic.id && "rotate-180")} />
              </div>
              {expandedHeuristic === heuristic.id && (
                <motion.p 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="text-[10px] text-zinc-400 mt-2 border-t border-white/5 pt-2"
                >
                  {heuristic.content}
                </motion.p>
              )}
            </div>
          )}
        />
      </div>
    </div>
  );
};

const App = () => {
  const [activeView, setActiveView] = useState('mission');
  const searchParams = useSearchParams();
  const [data, setData] = useState<AppData | null>(null);
  const [selectedAffairId, setSelectedAffairId] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [selectedCraftId, setSelectedCraftId] = useState<string | null>(null);
  const [selectedLawId, setSelectedLawId] = useState<string | null>(null);
  const [selectedInterestId, setSelectedInterestId] = useState<string | null>(null);
  const [returnPath, setReturnPath] = useState<{ view: string, id: string | null } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);

  useEffect(() => {
    const view = searchParams.get('view');
    const map: Record<string, typeof activeView> = {
      mission: 'mission',
      laws: 'laws',
      interests: 'interests',
      affairs: 'affairs',
      'war-gaming': 'war-gaming',
      execution: 'execution',
      crafts: 'crafts',
    };
    if (view && view in map) {
      setActiveView(map[view]);
    }
  }, [searchParams, activeView]);

  if (!data) return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="text-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
        />
        <div className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Initializing KHAL OS...</div>
      </div>
    </div>
  );

  const navItems = [
    { id: 'mission', label: 'Mission Command', icon: LayoutDashboard },
    { id: 'laws', label: 'Laws of Volatility', icon: Globe },
    { id: 'interests', label: 'Interests', icon: Anchor },
    { id: 'affairs', label: 'Affairs', icon: Briefcase },
    { id: 'war-gaming', label: 'War Gaming', icon: Zap },
    { id: 'execution', label: 'Surgical Execution', icon: Crosshair },
    { id: 'crafts', label: 'Crafts Library', icon: Database },
  ];

  const selectedAffair = data.affairs.find(a => a.id === selectedAffairId);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 bg-zinc-900/50 backdrop-blur-xl border-r border-white/5 transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-xl italic shrink-0">K</div>
          {sidebarOpen && <div className="font-bold tracking-tighter text-xl">KHAL <span className="text-zinc-500 font-normal">OS</span></div>}
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id);
                setSelectedAffairId(null);
                setSelectedDomain(null);
                setSelectedCraftId(null);
                setSelectedLawId(null);
                setSelectedInterestId(null);
                setReturnPath(null);
              }}
              className={cn(
                "w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all group",
                activeView === item.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              )}
            >
              <item.icon size={20} className="shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 hover:bg-white/5 rounded-lg text-zinc-500"
          >
            {sidebarOpen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        sidebarOpen ? "ml-64" : "ml-20"
      )}>
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 sticky top-0 bg-zinc-950/50 backdrop-blur-xl z-40">
          <div className="flex items-center gap-4">
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
              {navItems.find(n => n.id === activeView)?.label}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Operator</div>
              <div className="text-xs font-bold">{data.user.name}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
              <User size={20} className="text-zinc-400" />
            </div>
          </div>
        </header>

        <main>
          <AnimatePresence mode="wait">
            {selectedAffairId && selectedAffair ? (
              <motion.div
                key="chamber"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
              >
                <DecisionChamber 
                  affair={selectedAffair} 
                  data={data} 
                  onBack={() => setSelectedAffairId(null)} 
                />
              </motion.div>
            ) : (
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8"
              >
                {activeView === 'mission' && <MissionCommand data={data} onDomainClick={setSelectedDomain} />}
                
                {activeView === 'laws' && (
                  selectedLawId ? (
                    <LawDetail 
                      law={data.laws.find(l => l.id === selectedLawId)!}
                      domains={data.domains.filter(d => d.lawId === selectedLawId)}
                      crafts={data.crafts.filter(c => data.laws.find(l => l.id === selectedLawId)?.associatedCrafts?.includes(c.id))}
                      onBack={() => setSelectedLawId(null)}
                      onDomainClick={setSelectedDomain}
                      onCraftClick={(id) => {
                        setReturnPath({ view: 'laws', id: selectedLawId });
                        setSelectedCraftId(id);
                        setActiveView('crafts');
                        setSelectedLawId(null);
                      }}
                    />
                  ) : (
                    <div className="space-y-12">
                      <section>
                        <h2 className="text-3xl font-bold mb-8">Laws of Volatility</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {data.laws.map(law => (
                            <LawCard 
                              key={law.id} 
                              law={law} 
                              domains={data.domains.filter(d => d.lawId === law.id)} 
                              onClick={() => setSelectedLawId(law.id)}
                            />
                          ))}
                        </div>
                      </section>

                      <section className="glass p-8 rounded-3xl border border-white/5">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                          <Activity className="text-red-500" />
                          Volatility Heatmap
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                          {data.domains.map(domain => {
                            const intensity = Math.floor(Math.random() * 100);
                            return (
                              <div 
                                key={domain.id} 
                                onClick={() => setSelectedDomain(domain)}
                                className="aspect-square rounded-xl border border-white/5 flex flex-col items-center justify-center p-2 cursor-pointer hover:scale-105 transition-all"
                                style={{ backgroundColor: `rgba(239, 68, 68, ${intensity / 200})` }}
                              >
                                <div className="text-[8px] font-mono text-zinc-400 uppercase text-center mb-1">{domain.name}</div>
                                <div className="text-sm font-bold">{intensity}%</div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-6 flex justify-between text-[10px] font-mono text-zinc-500 uppercase">
                          <span>Stable</span>
                          <div className="flex-1 mx-4 h-1 bg-gradient-to-r from-emerald-500/20 via-yellow-500/20 to-red-500/50 rounded-full" />
                          <span>Volatile</span>
                        </div>
                      </section>
                    </div>
                  )
                )}

                {activeView === 'interests' && (
                  selectedInterestId ? (
                    <InterestDetail 
                      interest={data.interests.find(i => i.id === selectedInterestId)!}
                      affairs={data.affairs.filter(a => a.interestId === selectedInterestId)}
                      onBack={() => setSelectedInterestId(null)}
                      onAffairClick={(id) => {
                        setSelectedAffairId(id);
                        setSelectedInterestId(null);
                      }}
                    />
                  ) : (
                    <div className="space-y-8">
                      <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-bold">Long-term Interests</h2>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-bold text-white">
                          <Plus size={16} /> New Interest
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data.interests.map(interest => (
                          <div 
                            key={interest.id} 
                            onClick={() => setSelectedInterestId(interest.id)}
                            className="glass p-6 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-mono text-zinc-400 uppercase">{interest.perspective}</div>
                              <span className="text-[10px] font-mono text-zinc-500 uppercase">{interest.domainId}</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{interest.title}</h3>
                            <div className="text-sm text-zinc-400 mb-4">Stakes: <span className="text-zinc-200">{interest.stakes}</span></div>
                            <div className="space-y-2">
                              {(interest.objectives ?? []).map((o, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-zinc-500">
                                  <div className="w-1 h-1 bg-blue-500 rounded-full" />
                                  {o}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}

                {activeView === 'affairs' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h2 className="text-3xl font-bold">Active Affairs</h2>
                      <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-bold text-white">
                        <Plus size={16} /> New Affair
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {data.affairs.map(affair => (
                        <div 
                          key={affair.id} 
                          onClick={() => setSelectedAffairId(affair.id)}
                          className="glass p-6 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className={cn(
                              "px-2 py-1 rounded text-[10px] font-mono uppercase",
                              affair.status === 'execution' ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
                            )}>
                              {affair.status}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-500 uppercase">{affair.perspective}</div>
                          </div>
                          <h3 className="text-xl font-bold mb-4 group-hover:text-blue-400 transition-colors">{affair.title}</h3>
                          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                            <span>Domains: {affair.context.associatedDomains.length}</span>
                            <span>Heuristics: {affair.means.selectedHeuristicIds.length}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeView === 'war-gaming' && <WarGaming domains={data.domains} onAddTask={(task) => {
                  fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(task)
                  }).then(res => res.json()).then(newTask => {
                    setData(prev => prev ? ({ ...prev, tasks: [...prev.tasks, newTask] }) : null);
                  });
                }} />}

                {activeView === 'execution' && <SurgicalExecution 
                  tasks={data.tasks} 
                  onUpdateTask={(id, updates) => {
                    fetch(`/api/tasks/${id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(updates)
                    }).then(() => {
                      setData(prev => prev ? ({
                        ...prev,
                        tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
                      }) : null);
                    });
                  }}
                />}

                {activeView === 'crafts' && (
                  selectedCraftId ? (
                    <CraftDetail 
                      craft={data.crafts.find(c => c.id === selectedCraftId)!} 
                      onBack={() => {
                        if (returnPath) {
                          setActiveView(returnPath.view);
                          if (returnPath.view === 'laws') setSelectedLawId(returnPath.id);
                          setReturnPath(null);
                        } else {
                          setSelectedCraftId(null);
                        }
                      }}
                      onAddEntity={(type, entityData) => {
                        // In a real app, this would open a modal to fill the data
                        // For now, we'll just send a mock request to demonstrate functionality
                        const mockData: any = {
                          heaps: { title: "New Knowledge Heap", type: "link", url: "https://example.com" },
                          models: { title: "New Model", description: "A new mental model", heapIds: [] },
                          frameworks: { title: "New Framework", description: "A new strategic framework", modelIds: [] },
                          barbellStrategies: { title: "New Barbell", hedge: "90% Safe", edge: "10% Speculative", frameworkIds: [] },
                          heuristics: { title: "New Heuristic", content: "A new rule of thumb", barbellStrategyIds: [] }
                        };
                        
                        fetch(`/api/crafts/${selectedCraftId}/${type}`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(mockData[type])
                        }).then(res => res.json()).then(newEntity => {
                          setData(prev => {
                            if (!prev) return null;
                            const newCrafts = prev.crafts.map(c => {
                              if (c.id === selectedCraftId) {
                                return { ...c, [type]: [...(c as any)[type], newEntity] };
                              }
                              return c;
                            });
                            return { ...prev, crafts: newCrafts };
                          });
                        });
                      }}
                    />
                  ) : (
                    <div className="space-y-8">
                      <h2 className="text-3xl font-bold">Crafts Library</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {data.crafts.map(craft => (
                          <div 
                            key={craft.id} 
                            onClick={() => setSelectedCraftId(craft.id)}
                            className="glass p-8 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-4 mb-6">
                              <div className="p-4 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500/20 transition-colors">
                                <Box size={32} className="text-blue-400" />
                              </div>
                              <div>
                                <h3 className="text-2xl font-bold">{craft.name}</h3>
                                <p className="text-sm text-zinc-500">{craft.description}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                              {[
                                { label: 'Heaps', count: craft.heaps.length, icon: Database },
                                { label: 'Models', count: craft.models.length, icon: Cpu },
                                { label: 'Frameworks', count: craft.frameworks.length, icon: Layers },
                                { label: 'Barbells', count: craft.barbellStrategies.length, icon: Scale },
                                { label: 'Heuristics', count: craft.heuristics.length, icon: Zap }
                              ].map(stat => (
                                <div key={stat.label} className="text-center p-2 bg-zinc-800/50 rounded-xl border border-white/5">
                                  <stat.icon size={12} className="mx-auto mb-1 text-zinc-500" />
                                  <div className="text-xs font-bold">{stat.count}</div>
                                  <div className="text-[8px] text-zinc-500 uppercase">{stat.label}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Domain Modal */}
      <AnimatePresence>
        {selectedDomain && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDomain(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl relative z-10 flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
                <div>
                  <h2 className="text-2xl font-bold">{selectedDomain.name}</h2>
                  <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">{selectedDomain.volatilitySource}</p>
                </div>
                <button onClick={() => setSelectedDomain(null)} className="p-2 hover:bg-zinc-800 rounded-full">
                  <X className="w-6 h-6 text-zinc-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                  <div className="space-y-6">
                    <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                      <div className="text-[10px] text-zinc-500 mb-1 uppercase">Volatility Source</div>
                      <div className="text-sm font-medium text-zinc-200">{selectedDomain.volatilitySource}</div>
                    </div>
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <div className="text-[10px] text-blue-400 mb-1 uppercase">Associated Law</div>
                      <div className="text-sm font-medium text-blue-400">
                        {data.laws.find(l => l.id === selectedDomain.lawId)?.name}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <h4 className="text-xs font-mono uppercase text-zinc-500 mb-4 tracking-widest">Active Affairs in this Domain</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {data.affairs.filter(a => a.context.associatedDomains.includes(selectedDomain.id)).map(a => (
                        <div key={a.id} className="p-4 bg-zinc-800/50 rounded-xl border border-white/5 flex justify-between items-center">
                          <div>
                            <div className="font-bold">{a.title}</div>
                            <div className="text-xs text-zinc-500 uppercase">{a.status}</div>
                          </div>
                          <button 
                            onClick={() => {
                              setSelectedAffairId(a.id);
                              setSelectedDomain(null);
                            }}
                            className="text-xs font-bold text-blue-400 hover:text-blue-300"
                          >
                            OPEN CHAMBER
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;


