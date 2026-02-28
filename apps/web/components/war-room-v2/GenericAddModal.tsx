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
  const canSave = Boolean((formData.title ?? formData.name ?? '').trim());

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
              if (!canSave) return;
              onSave(formData);
              onClose();
            }}
            disabled={!canSave}
            className={cn(
              "px-6 py-2 rounded-lg text-xs font-bold transition-colors text-white",
              canSave ? "bg-blue-600 hover:bg-blue-500" : "bg-zinc-700 cursor-not-allowed"
            )}
          >
            SAVE ENTITY
          </button>
        </div>
      </motion.div>
    </div>
  );
};


