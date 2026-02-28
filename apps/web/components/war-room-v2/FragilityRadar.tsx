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


