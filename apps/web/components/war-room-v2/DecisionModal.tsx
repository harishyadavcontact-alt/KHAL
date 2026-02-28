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


