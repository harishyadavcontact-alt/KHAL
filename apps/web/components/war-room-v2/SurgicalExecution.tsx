import React, { useState, useEffect, useMemo } from 'react';
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
import {
  BlackSwanReadinessPanel,
  ConvexityPipelinePanel,
  DecisionLatencyMeterPanel,
  ExecutionDistributionPanel,
  NoRuinTripwirePanel,
  ViaNegativaPanel
} from './panels/RobustnessPanels';
import {
  computeBlackSwanReadiness,
  computeExecutionDistribution,
  computeViaNegativaQueue,
  isInterestProtocolReady
} from '../../lib/war-room/operational-metrics';
import { AlertQueuePanel } from './hud/AlertQueuePanel';
import { v03Flags } from '../../lib/war-room/feature-flags';
export const SurgicalExecution = ({
  tasks,
  affairs = [],
  interests = [],
  tripwire,
  latency,
  convexityPipeline,
  lineageRisks = [],
  violationFeed = [],
  user,
  onUpdateTask,
  onCreateTask
}: {
  tasks: Task[];
  affairs?: Affair[];
  interests?: Interest[];
  tripwire?: AppData["tripwire"];
  latency?: AppData["latency"];
  convexityPipeline?: AppData["convexityPipeline"];
  lineageRisks?: AppData["lineageRisks"];
  violationFeed?: AppData["violationFeed"];
  user?: AppData["user"];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onCreateTask: (task: {
    title: string;
    sourceType: string;
    sourceId: string;
    parentTaskId?: string;
    horizon?: string;
    dueDate?: string;
    notes?: string;
    dependencyIds?: string[];
    effortEstimate?: number;
  }) => Promise<void> | void;
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskDueAt, setSubtaskDueAt] = useState('');
  const [subtaskHorizon, setSubtaskHorizon] = useState<'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'>('WEEK');
  const [creatingSubtask, setCreatingSubtask] = useState(false);
  const selectedTask = tasks.find(t => t.id === selectedTaskId);
  const tripwireBlocked = Boolean(tripwire?.riskyActionBlocked);
  const selectedInterest = useMemo(() => {
    if (!selectedTask) return undefined;
    if (String(selectedTask.sourceType ?? '').toUpperCase() === 'INTEREST') {
      return interests.find((interest) => interest.id === selectedTask.sourceId);
    }
    return undefined;
  }, [interests, selectedTask]);
  const interestProtocolBlocked = Boolean(
    selectedInterest && ((selectedInterest.labStage ?? 'FORGE') !== 'WIELD' || !isInterestProtocolReady(selectedInterest))
  );
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const activeTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const velocityPerWeek = (doneTasks + activeTasks).toFixed(1);
  const efficiencyPct = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const readinessRows = useMemo(
    () =>
      affairs.slice(0, 6).map((affair) => {
        const linkedInterest = interests.find((interest) => interest.id === affair.interestId);
        return {
          id: affair.id,
          title: affair.title,
          craftId: affair.means?.craftId || "unassigned",
          posture: affair.strategy?.posture || "defense",
          ends: (affair.plan?.objectives ?? []).join(" | ") || "No ends defined",
          interest: linkedInterest?.title ?? "No linked interest"
        };
      }),
    [affairs, interests]
  );
  const childByParent = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.parentTaskId) continue;
      const list = map.get(task.parentTaskId) ?? [];
      list.push(task);
      map.set(task.parentTaskId, list);
    }
    return map;
  }, [tasks]);
  const rootTasks = useMemo(() => tasks.filter((task) => !task.parentTaskId), [tasks]);
  const alertData = useMemo(
    () =>
      ({
        user: user ?? { birthDate: "2000-01-01T00:00:00.000Z", lifeExpectancy: 80, name: "Operator", location: "Local" },
        strategyMatrix: { allies: 0, enemies: 0, overt: 0, covert: 0, offense: 0, defense: 0, conventional: 0, unconventional: 0 },
        laws: [],
        domains: [],
        crafts: [],
        interests,
        affairs,
        tasks,
        sources: [],
        missionGraph: { nodes: [], dependencies: [] },
        lineages: { nodes: [], entities: [] },
        lineageRisks: lineageRisks ?? [],
        doctrine: { rulebooks: [], rules: [], domainPnLLadders: [] },
        tripwire,
        violationFeed,
        decisionAccelerationMeta: {
          computedAtIso: new Date().toISOString(),
          dataQuality: "MEDIUM" as const,
          invariantViolations: [],
          fallbackUsed: false,
          protocolState:
            tripwire?.state === "BLOCK" ? "CRITICAL" : tripwire?.state === "WATCH" ? "WATCH" : "NOMINAL"
        }
      }) as AppData,
    [affairs, interests, lineageRisks, tasks, tripwire, user, violationFeed]
  );
  const viaNegativaQueue = useMemo(() => computeViaNegativaQueue(alertData, 5), [alertData]);
  const blackSwanReadiness = useMemo(() => computeBlackSwanReadiness(alertData), [alertData]);
  const executionDistribution = useMemo(() => computeExecutionDistribution(alertData), [alertData]);

  useEffect(() => {
    setSubtaskTitle('');
    setSubtaskDueAt('');
    setSubtaskHorizon('WEEK');
    setCreatingSubtask(false);
  }, [selectedTaskId]);

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
                <div className="p-4 bg-zinc-800/40 border border-white/10 rounded-xl space-y-3">
                  <div className="text-[10px] text-zinc-500 uppercase">Task Linkage</div>
                  <div className="text-xs text-zinc-300">Source: {selectedTask.sourceType ?? selectedTask.type ?? 'PLAN'} / {selectedTask.sourceId ?? 'unknown'}</div>
                  <div className="text-xs text-zinc-300">Horizon: {selectedTask.horizon ?? 'WEEK'}</div>
                  <div className="text-xs text-zinc-300">Due: {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleString() : 'Unscheduled'}</div>
                </div>
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-3">
                  <div className="text-[10px] text-blue-400 uppercase">Create Subtask</div>
                  <input
                    value={subtaskTitle}
                    onChange={(e) => setSubtaskTitle(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm"
                    placeholder="Subtask title"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="datetime-local"
                      value={subtaskDueAt}
                      onChange={(e) => setSubtaskDueAt(e.target.value)}
                      className="bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm"
                    />
                    <select
                      value={subtaskHorizon}
                      onChange={(e) => setSubtaskHorizon(e.target.value as 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR')}
                      className="bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm"
                    >
                      <option value="WEEK">WEEK</option>
                      <option value="MONTH">MONTH</option>
                      <option value="QUARTER">QUARTER</option>
                      <option value="YEAR">YEAR</option>
                    </select>
                  </div>
                  <button
                    disabled={!subtaskTitle.trim() || creatingSubtask}
                    onClick={async () => {
                      setCreatingSubtask(true);
                      try {
                        if (tripwireBlocked || interestProtocolBlocked) return;
                        await onCreateTask({
                          title: subtaskTitle.trim(),
                          sourceType: selectedTask.sourceType ?? String(selectedTask.type ?? 'PLAN').toUpperCase(),
                          sourceId: selectedTask.sourceId ?? selectedTask.domainId,
                          parentTaskId: selectedTask.id,
                          horizon: subtaskHorizon,
                          dueDate: subtaskDueAt ? new Date(subtaskDueAt).toISOString() : undefined
                        });
                        setSubtaskTitle('');
                        setSubtaskDueAt('');
                      } finally {
                        setCreatingSubtask(false);
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-semibold text-white disabled:bg-zinc-700"
                  >
                    {creatingSubtask ? 'Creating...' : 'Add Subtask'}
                  </button>
                  {interestProtocolBlocked && (
                    <div className="text-xs text-red-300">Blocked: linked Interest must be WIELD and protocol-ready.</div>
                  )}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <NoRuinTripwirePanel tripwire={tripwire} />
        <DecisionLatencyMeterPanel data={{ latency } as AppData} />
        <ConvexityPipelinePanel data={{ convexityPipeline } as AppData} />
      </div>
      {v03Flags.hud && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-1">
            <AlertQueuePanel data={alertData} />
          </div>
          <section className="glass p-4 rounded-xl border border-white/10 lg:col-span-2">
            <div className="text-[10px] uppercase text-zinc-500 tracking-widest mb-2">Execution Cue</div>
            <p className="text-xs text-zinc-400">
              Prioritize Affairs actions that remove near-term fragility first, then execute Interests with protocol-ready optionality.
            </p>
          </section>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <ExecutionDistributionPanel snapshot={executionDistribution} />
        <ViaNegativaPanel items={viaNegativaQueue} />
        <BlackSwanReadinessPanel snapshot={blackSwanReadiness} />
      </div>

      <div className="glass p-4 rounded-xl border border-white/10 mb-6">
        <div className="text-[10px] uppercase text-zinc-500 tracking-widest mb-2">Execution Readiness Aggregate</div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {readinessRows.map((row) => (
            <div key={row.id} className="p-3 rounded-lg border border-white/10 bg-zinc-900/50">
              <div className="text-sm font-semibold">{row.title}</div>
              <div className="text-[10px] text-zinc-500 uppercase mt-1">Interest</div>
              <div className="text-xs text-zinc-300">{row.interest}</div>
              <div className="text-[10px] text-zinc-500 uppercase mt-1">Means / Strategy</div>
              <div className="text-xs text-zinc-300">
                Craft: {row.craftId} | Posture: {row.posture}
              </div>
              <div className="text-[10px] text-zinc-500 uppercase mt-1">Ends</div>
              <div className="text-xs text-zinc-300">{row.ends}</div>
            </div>
          ))}
          {!readinessRows.length && <div className="text-sm text-zinc-500">No execution readiness rows mapped yet.</div>}
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
                {rootTasks.filter(t => t.status === status).length}
              </span>
            </div>
            <div className="space-y-4">
              {rootTasks
                .filter(t => t.status === status)
                .map(task => (
                  <div key={task.id} className="space-y-2">
                    <TaskCard
                      task={task}
                      onUpdateTask={onUpdateTask}
                      onClick={() => setSelectedTaskId(task.id)}
                    />
                    {(childByParent.get(task.id) ?? []).map((subtask) => (
                      <div key={subtask.id} className="ml-5 pl-3 border-l border-white/10">
                        <TaskCard
                          task={subtask}
                          onUpdateTask={onUpdateTask}
                          onClick={() => setSelectedTaskId(subtask.id)}
                        />
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


