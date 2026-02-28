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


