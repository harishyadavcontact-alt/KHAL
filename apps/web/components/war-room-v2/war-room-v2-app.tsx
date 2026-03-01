import React, { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Anchor, Briefcase, Clock, Crosshair, Database, Globe, LayoutDashboard, Map as MapIcon, Maximize2, Minimize2, User, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from './utils';
import { AppData, Domain, Task, WarGameMode, WarRoomViewState } from './types';
import { MissionCommand } from './MissionCommand';
import { WarGaming } from './WarGaming';
import { SurgicalExecution } from './SurgicalExecution';
import { DecisionChamber } from './DecisionChamber';
import { LawsView } from './LawsView';
import { InterestsView } from './InterestsView';
import { AffairsView } from './AffairsView';
import { CraftsView } from './CraftsView';
import { DomainModal } from './DomainModal';
import { TimeHorizonView } from './TimeHorizonView';
import { LineageMapView } from './LineageMapView';
import { KhalWordmark } from '../branding/KhalWordmark';
import { KhalFinalMark } from '../branding/KhalFinalMark';
import { DashboardView } from './DashboardView';
import { WarRoomView } from './WarRoomView';

const WAR_GAME_MODES: WarGameMode[] = ['source', 'domain', 'affair', 'interest', 'mission', 'lineage'];

const isWarGameMode = (value: string | null | undefined): value is WarGameMode => {
  return Boolean(value && WAR_GAME_MODES.includes(value as WarGameMode));
};

const modeToSourceType = (mode: WarGameMode): 'SOURCE' | 'DOMAIN' | 'AFFAIR' | 'INTEREST' | 'MISSION' | 'LINEAGE' => {
  if (mode === 'source') return 'SOURCE';
  if (mode === 'domain') return 'DOMAIN';
  if (mode === 'affair') return 'AFFAIR';
  if (mode === 'interest') return 'INTEREST';
  if (mode === 'mission') return 'MISSION';
  return 'LINEAGE';
};

const toApiTaskStatus = (status?: string) => {
  if (!status) return undefined;
  if (status === 'not_started') return 'NOT_STARTED';
  if (status === 'in_progress') return 'IN_PROGRESS';
  if (status === 'done') return 'DONE';
  if (status === 'parked') return 'PARKED';
  if (status === 'waiting') return 'WAITING';
  return status;
};

const ensureTaskSourceType = (sourceType?: string): 'AFFAIR' | 'INTEREST' | 'PLAN' | 'PREPARATION' => {
  if (sourceType === 'AFFAIR' || sourceType === 'INTEREST' || sourceType === 'PLAN' || sourceType === 'PREPARATION') return sourceType;
  return 'PLAN';
};

const pathToView = (pathname: string): WarRoomViewState | null => {
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/war-room')) return 'war-room';
  if (pathname.startsWith('/war-gaming')) return 'war-gaming';
  if (pathname.startsWith('/missionCommand') || pathname.startsWith('/mission-command')) return 'mission';
  return null;
};

const App = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [activeView, setActiveView] = useState<WarRoomViewState>('dashboard');
  const searchParams = useSearchParams();
  const [data, setData] = useState<AppData | null>(null);
  const [selectedAffairId, setSelectedAffairId] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [selectedCraftId, setSelectedCraftId] = useState<string | null>(null);
  const [selectedLawId, setSelectedLawId] = useState<string | null>(null);
  const [selectedInterestId, setSelectedInterestId] = useState<string | null>(null);
  const [returnPath, setReturnPath] = useState<{ view: string; id: string | null } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [warGameContext, setWarGameContext] = useState<{ mode: WarGameMode; targetId?: string }>({ mode: 'affair' });

  const handleWarGameContextChange = useCallback((mode: WarGameMode, targetId?: string) => {
    setWarGameContext((prev) => {
      if (prev.mode === mode && prev.targetId === targetId) return prev;
      return { mode, targetId };
    });
  }, []);

  useEffect(() => {
    fetch('/api/data')
      .then((res) => res.json())
      .then(setData);
  }, []);

  useEffect(() => {
    const view = searchParams.get('view');
    const wgMode = searchParams.get('wgMode');
    const wgTarget = searchParams.get('wgTarget') ?? undefined;
    const map: Record<string, WarRoomViewState> = {
      dashboard: 'dashboard',
      'war-room': 'war-room',
      mission: 'mission',
      laws: 'laws',
      interests: 'interests',
      affairs: 'affairs',
      'war-gaming': 'war-gaming',
      execution: 'execution',
      crafts: 'crafts',
      'time-horizon': 'time-horizon',
      lineages: 'lineages'
    };
    if (view && view in map) {
      setActiveView(map[view]);
    }
    if (isWarGameMode(wgMode)) {
      setWarGameContext({ mode: wgMode, targetId: wgTarget });
    }
  }, [searchParams]);

  useEffect(() => {
    const routeView = pathToView(pathname);
    if (routeView) {
      setActiveView(routeView);
    }
  }, [pathname]);

  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <div className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Initializing KHAL...</div>
        </div>
      </div>
    );
  }

  const navItems: Array<{ id: WarRoomViewState; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'war-room', label: 'War Room', icon: MapIcon },
    { id: 'mission', label: 'Mission Command', icon: LayoutDashboard },
    { id: 'laws', label: 'Source of Volatility', icon: Globe },
    { id: 'interests', label: 'Interests', icon: Anchor },
    { id: 'affairs', label: 'Affairs', icon: Briefcase },
    { id: 'war-gaming', label: 'War Gaming', icon: Zap },
    { id: 'execution', label: 'Surgical Execution', icon: Crosshair },
    { id: 'crafts', label: 'Crafts Library', icon: Database },
    { id: 'time-horizon', label: 'Time Horizon', icon: Clock },
    { id: 'lineages', label: 'Lineage Map', icon: User }
  ];

  const navigateView = (nextView: WarRoomViewState) => {
    if (nextView === 'dashboard') {
      router.push('/dashboard');
      return;
    }
    if (nextView === 'war-room') {
      router.push('/war-room');
      return;
    }
    if (nextView === 'mission') {
      router.push('/missionCommand');
      return;
    }
    if (nextView === 'war-gaming') {
      router.push('/war-gaming');
      return;
    }
    setActiveView(nextView);
  };

  const selectedAffair = data.affairs.find((a) => a.id === selectedAffairId);

  const resetSelections = () => {
    setSelectedAffairId(null);
    setSelectedDomain(null);
    setSelectedCraftId(null);
    setSelectedLawId(null);
    setSelectedInterestId(null);
    setReturnPath(null);
  };

  const openWarGame = (mode: WarGameMode, targetId?: string) => {
    setWarGameContext({ mode, targetId });
    setActiveView('war-gaming');
    setSelectedDomain(null);
    setSelectedAffairId(null);
    setSelectedInterestId(null);
    setSelectedLawId(null);
  };

  const refreshCraftFromDb = async (craftId: string) => {
    const craftRes = await fetch(`/api/crafts/${craftId}`);
    if (!craftRes.ok) throw new Error(`Failed to load craft ${craftId}`);
    const updatedCraft = await craftRes.json();
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        crafts: prev.crafts.map((c) => (c.id === craftId ? updatedCraft : c))
      };
    });
  };

  const saveCraftEntity = async (craftId: string, type: string, entityData: any) => {
    const apiType = type === 'barbellStrategies' ? 'barbell-strategies' : type;
    const payload = {
      ...entityData,
      title: (entityData.title ?? entityData.name ?? '').trim()
    };
    const res = await fetch(`/api/crafts/${craftId}/${apiType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Failed to save craft entity');
    }
    await refreshCraftFromDb(craftId);
  };

  const refreshAppData = async () => {
    const res = await fetch('/api/data');
    const payload = await res.json();
    setData(payload);
  };

  const updateDomainStrategy = async (domainId: string, updates: Record<string, string>) => {
    const response = await fetch(`/api/domains/${domainId}/strategy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      throw new Error('Failed to update domain strategy');
    }

    setData((prev) => {
      if (!prev) return prev;
      const nextDomains = prev.domains.map((domain) => {
        if (domain.id !== domainId) return domain;
        return {
          ...domain,
          stakesText: updates.stakesText ?? domain.stakesText,
          risksText: updates.risksText ?? domain.risksText,
          fragilityText: updates.fragilityText ?? domain.fragilityText,
          vulnerabilitiesText: updates.vulnerabilitiesText ?? domain.vulnerabilitiesText,
          hedge: updates.hedgeText ?? domain.hedge,
          edge: updates.edgeText ?? domain.edge,
          heuristics: updates.heuristicsText ?? domain.heuristics,
          tactics: updates.tacticsText ?? domain.tactics,
          interestsText: updates.interestsText ?? domain.interestsText,
          affairsText: updates.affairsText ?? domain.affairsText
        };
      });
      return { ...prev, domains: nextDomains };
    });

    setSelectedDomain((prev) => {
      if (!prev || prev.id !== domainId) return prev;
      return {
        ...prev,
        stakesText: updates.stakesText ?? prev.stakesText,
        risksText: updates.risksText ?? prev.risksText,
        fragilityText: updates.fragilityText ?? prev.fragilityText,
        vulnerabilitiesText: updates.vulnerabilitiesText ?? prev.vulnerabilitiesText,
        hedge: updates.hedgeText ?? prev.hedge,
        edge: updates.edgeText ?? prev.edge,
        heuristics: updates.heuristicsText ?? prev.heuristics,
        tactics: updates.tacticsText ?? prev.tactics,
        interestsText: updates.interestsText ?? prev.interestsText,
        affairsText: updates.affairsText ?? prev.affairsText
      };
    });
  };

  const createAffair = async (payload: { title: string; domainId: string }) => {
    await fetch('/api/affairs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: payload.title,
        domainId: payload.domainId,
        status: 'NOT_STARTED',
        stakes: 5,
        risk: 5
      })
    });
    await refreshAppData();
  };

  const createInterest = async (payload: { title: string; domainId: string }) => {
    await fetch('/api/interests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: payload.title,
        domainId: payload.domainId,
        status: 'NOT_STARTED',
        stakes: 5,
        risk: 5,
        convexity: 5
      })
    });
    await refreshAppData();
  };

  const updateAffairPlan = async (
    affairId: string,
    payload: { objectives: string[]; uncertainty?: string; timeHorizon?: string; lineageNodeId?: string; actorType?: 'personal' | 'private' | 'public' }
  ) => {
    await fetch(`/api/affairs/${affairId}/plan`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setData((prev) =>
      prev
        ? {
            ...prev,
            affairs: prev.affairs.map((affair) => (affair.id === affairId ? { ...affair, plan: payload } : affair))
          }
        : prev
    );
    await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceType: 'AFFAIR',
        sourceId: affairId,
        title: `Affair Plan: ${affairId}`,
        lineageNodeId: payload.lineageNodeId,
        actorType: payload.actorType,
        criteria: payload.objectives.map((objective) => ({ name: 'Objective', description: objective })),
        extras: {
          uncertainty: payload.uncertainty,
          timeHorizon: payload.timeHorizon
        }
      })
    });
  };

  const upsertLineageRisk = async (payload: {
    id?: string;
    sourceId: string;
    domainId: string;
    lineageNodeId: string;
    actorType: 'personal' | 'private' | 'public';
    title: string;
    exposure: number;
    dependency: number;
    irreversibility: number;
    optionality: number;
    responseTime: number;
    status: 'OPEN' | 'MITIGATING' | 'RESOLVED' | 'INCOMPLETE';
    notes?: string;
  }) => {
    const url = payload.id ? `/api/lineage-risks/${payload.id}` : '/api/lineage-risks';
    const method = payload.id ? 'PATCH' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to persist lineage risk');
    const risk = await response.json();
    setData((prev) => {
      if (!prev) return prev;
      const current = prev.lineageRisks ?? [];
      const exists = current.some((item) => item.id === risk.id);
      return {
        ...prev,
        lineageRisks: exists ? current.map((item) => (item.id === risk.id ? { ...item, ...risk } : item)) : [risk, ...current]
      };
    });
    return risk;
  };

  const updateAffairMeans = async (affairId: string, payload: { craftId: string; selectedHeuristicIds: string[] }) => {
    await fetch(`/api/affairs/${affairId}/means`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setData((prev) =>
      prev
        ? {
            ...prev,
            affairs: prev.affairs.map((affair) => (affair.id === affairId ? { ...affair, means: payload } : affair))
          }
        : prev
    );
  };

  const createExecutionTask = async (payload: {
    title: string;
    sourceType: string;
    sourceId: string;
    parentTaskId?: string;
    horizon?: string;
    dueDate?: string;
    notes?: string;
    dependencyIds?: string[];
    effortEstimate?: number;
  }) => {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceType: ensureTaskSourceType(payload.sourceType),
        sourceId: payload.sourceId,
        parentTaskId: payload.parentTaskId,
        title: payload.title,
        notes: payload.notes,
        horizon: payload.horizon ?? 'WEEK',
        dueDate: payload.dueDate,
        status: 'NOT_STARTED',
        dependencyIds: payload.dependencyIds ?? [],
        effortEstimate: payload.effortEstimate
      })
    });
    if (!response.ok) throw new Error('Failed creating execution task');
    await refreshAppData();
  };

  const handleWarGameProtocolSave = async (payload: any) => {
    const mode: WarGameMode = isWarGameMode(payload?.mode) ? payload.mode : warGameContext.mode;
    const sourceType = modeToSourceType(mode);
    const targetId = String(payload?.targetId ?? payload?.sourceId ?? warGameContext.targetId ?? '').trim();
    if (!targetId) {
      throw new Error('WarGame target is required.');
    }

    const title = String(payload?.title ?? '').trim() || `WarGame ${sourceType}`;
    const cadence = payload?.cadence ?? 'weekly';
    const scheduleEnd = payload?.targetDate || undefined;
    const criteria = Array.isArray(payload?.criteria)
      ? payload.criteria
      : Array.isArray(payload?.objectives)
        ? payload.objectives.map((objective: string) => ({ name: 'ORK', description: objective }))
        : [];
    const thresholds = Array.isArray(payload?.thresholds)
      ? payload.thresholds
      : payload?.thresholdNotes
        ? [{ name: 'KPI Threshold', value: String(payload.thresholdNotes) }]
        : [];
    const preparation =
      payload?.preparation && typeof payload.preparation === 'object'
        ? payload.preparation
        : payload?.preparationNotes
          ? { notes: String(payload.preparationNotes) }
          : {};
    const extras =
      payload?.extras && typeof payload.extras === 'object'
        ? payload.extras
        : {
            mode: sourceType,
            riskRewardSummary: payload?.riskRewardSummary ?? '',
            meansEndsMap: {
              means: payload?.meansText ?? '',
              ends: payload?.endsText ?? '',
              hedge: payload?.hedgeText ?? '',
              edge: payload?.edgeText ?? ''
            }
          };

    let riskRegisterIds: string[] = [];

    if (mode === 'domain') {
      const domainUpdates: Record<string, string> = {};
      if (payload?.fragilityNarrative?.trim()) domainUpdates.fragilityText = payload.fragilityNarrative.trim();
      if (payload?.riskRewardSummary?.trim()) domainUpdates.risksText = payload.riskRewardSummary.trim();
      if (payload?.hedgeText?.trim()) domainUpdates.hedgeText = payload.hedgeText.trim();
      if (payload?.edgeText?.trim()) domainUpdates.edgeText = payload.edgeText.trim();
      if (payload?.meansText?.trim()) domainUpdates.heuristicsText = payload.meansText.trim();
      if (payload?.endsText?.trim()) domainUpdates.tacticsText = payload.endsText.trim();
      if (payload?.thresholdNotes?.trim()) domainUpdates.vulnerabilitiesText = payload.thresholdNotes.trim();
      if (Object.keys(domainUpdates).length > 0) {
        await updateDomainStrategy(targetId, domainUpdates);
      }
    }

    if (mode === 'affair') {
      const affairPlanRes = await fetch(`/api/affairs/${targetId}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectives: Array.isArray(payload?.objectives) ? payload.objectives : [],
          uncertainty: payload?.fragilityNarrative ?? payload?.riskRewardSummary ?? '',
          timeHorizon: payload?.cadence ?? 'weekly'
        })
      });
      if (!affairPlanRes.ok) throw new Error('Failed updating affair plan.');
    }

    if (mode === 'lineage') {
      if (!payload?.sourceId || !payload?.domainId) {
        throw new Error('Lineage WarGame requires source and domain selection.');
      }
      const risk = await upsertLineageRisk({
        sourceId: String(payload?.sourceId ?? ''),
        domainId: String(payload?.domainId ?? ''),
        lineageNodeId: String(payload?.lineageNodeId ?? targetId),
        actorType: payload?.actorType ?? 'personal',
        title,
        exposure: Number(payload?.exposure ?? 5),
        dependency: Number(payload?.dependency ?? 5),
        irreversibility: Number(payload?.irreversibility ?? 5),
        optionality: Number(payload?.optionality ?? 5),
        responseTime: Number(payload?.responseTime ?? 7),
        status: payload?.riskStatus ?? 'INCOMPLETE',
        notes: payload?.riskNotes ?? payload?.fragilityNarrative ?? ''
      });
      if (risk?.id) riskRegisterIds = [risk.id];
    }

    if (mode === 'mission') {
      const missionId = targetId;
      const missionNodesFromPayload = Array.isArray(payload?.missionHierarchy?.nodes) ? payload.missionHierarchy.nodes : null;
      const graphNodes =
        missionNodesFromPayload ??
        (data?.missionGraph?.nodes ?? []).filter((node) => node.missionId === missionId && node.refType !== 'MISSION').map((node) => ({
          id: node.id,
          refType: node.refType,
          refId: node.refId,
          parentNodeId: node.parentNodeId,
          sortOrder: node.sortOrder,
          dependencyIds: [] as string[]
        }));
      const nodeIds = new Set(graphNodes.map((node: any) => String(node.id)));
      const dependencyMap = new Map<string, string[]>();
      for (const dep of data?.missionGraph?.dependencies ?? []) {
        if (!nodeIds.has(dep.missionNodeId) || !nodeIds.has(dep.dependsOnNodeId)) continue;
        const list = dependencyMap.get(dep.missionNodeId) ?? [];
        list.push(dep.dependsOnNodeId);
        dependencyMap.set(dep.missionNodeId, list);
      }
      const missionRes = await fetch(`/api/missions/${missionId}/hierarchy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId,
          nodes: graphNodes.map((node: any, index: number) => ({
            id: String(node.id),
            refType: node.refType,
            refId: String(node.refId),
            parentNodeId: node.parentNodeId ?? null,
            sortOrder: Number(node.sortOrder ?? index + 1),
            dependencyIds: Array.isArray(node.dependencyIds) ? node.dependencyIds.map(String) : dependencyMap.get(String(node.id)) ?? []
          }))
        })
      });
      if (!missionRes.ok) throw new Error('Failed persisting mission hierarchy.');
    }

    const planRes = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceType,
        sourceId: targetId,
        title,
        cadence,
        scheduleEnd,
        lineageNodeId: payload?.lineageNodeId || undefined,
        actorType: payload?.actorType || undefined,
        milestones: scheduleEnd ? [{ title: 'Target milestone', dueAt: scheduleEnd, status: 'OPEN' }] : [],
        criteria,
        thresholds,
        preparation,
        extras,
        riskRegisterIds
      })
    });
    if (!planRes.ok) throw new Error('Failed creating protocol plan blueprint');
    const plan = await planRes.json();

    const taskRes = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceType: 'PLAN',
        sourceId: plan.id,
        title,
        horizon: 'WEEK',
        dueDate: scheduleEnd,
        status: 'NOT_STARTED',
        effortEstimate: Number(payload?.priority ?? 50)
      })
    });
    if (!taskRes.ok) throw new Error('Failed creating execution task');

    await refreshAppData();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-zinc-900/50 backdrop-blur-xl border-r border-white/5 transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-56' : 'w-16'
        )}
      >
        <div className="p-4 flex items-center gap-3">
          <div className="w-7 h-7 rounded-md flex items-center justify-center text-[#ff8c00] shrink-0">
            <KhalFinalMark size={28} />
          </div>
          {sidebarOpen && (
            <div className="leading-none">
              <KhalWordmark size={24} variant="muted" />
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigateView(item.id);
                resetSelections();
              }}
              className={cn(
                'w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg transition-all group',
                'text-sm',
                activeView === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              )}
            >
              <item.icon size={20} className="shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center justify-center p-2 hover:bg-white/5 rounded-lg text-zinc-500">
            {sidebarOpen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </aside>

      <div className={cn('flex-1 transition-all duration-300', sidebarOpen ? 'ml-56' : 'ml-16')}>
        <header className="h-12 border-b border-white/5 flex items-center justify-between px-5 sticky top-0 bg-zinc-950/50 backdrop-blur-xl z-40">
          <div className="flex items-center gap-4">
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">{navItems.find((n) => n.id === activeView)?.label}</div>
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
              <motion.div key="chamber" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}>
                <DecisionChamber
                  affair={selectedAffair}
                  data={data}
                  onBack={() => setSelectedAffairId(null)}
                  onSavePlan={updateAffairPlan}
                  onSaveMeans={updateAffairMeans}
                />
              </motion.div>
            ) : (
              <motion.div key={activeView} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-5">
                {activeView === 'dashboard' && <DashboardView data={data} onSegmentClick={() => undefined} onOpenDomain={setSelectedDomain} />}
                {activeView === 'war-room' && <WarRoomView domains={data.domains} onDomainClick={setSelectedDomain} />}
                {activeView === 'mission' && <MissionCommand data={data} onDomainClick={setSelectedDomain} onWarGame={openWarGame} />}
                {activeView === 'laws' && (
                  <LawsView
                    data={data}
                    selectedLawId={selectedLawId}
                    onSelectLaw={setSelectedLawId}
                    onSelectDomain={setSelectedDomain}
                    onWarGameSource={(sourceId) => openWarGame('source', sourceId)}
                    onOpenCraftFromLaw={(craftId, lawId) => {
                      setReturnPath({ view: 'laws', id: lawId });
                      setSelectedCraftId(craftId);
                      setActiveView('crafts');
                      setSelectedLawId(null);
                    }}
                  />
                )}
                {activeView === 'interests' && (
                  <InterestsView
                    data={data}
                    selectedInterestId={selectedInterestId}
                    onSelectInterest={setSelectedInterestId}
                    onSelectAffair={setSelectedAffairId}
                    onCreateInterest={createInterest}
                    onWarGame={(interestId) => openWarGame('interest', interestId)}
                  />
                )}
                {activeView === 'affairs' && (
                  <AffairsView data={data} onSelectAffair={setSelectedAffairId} onCreateAffair={createAffair} onWarGame={(affairId) => openWarGame('affair', affairId)} />
                )}
                {activeView === 'war-gaming' && (
                  <WarGaming
                    user={data.user}
                    domains={data.domains}
                    sources={data.sources ?? []}
                    lineages={data.lineages?.nodes ?? []}
                    affairs={data.affairs}
                    interests={data.interests}
                    tasks={data.tasks}
                    lineageRisks={data.lineageRisks ?? []}
                    missionGraph={data.missionGraph}
                    doctrine={data.doctrine}
                    initialMode={warGameContext.mode}
                    initialTargetId={warGameContext.targetId}
                    onContextChange={handleWarGameContextChange}
                    onAddTask={handleWarGameProtocolSave}
                  />
                )}
                {activeView === 'execution' && (
                  <SurgicalExecution
                    tasks={data.tasks}
                    onCreateTask={createExecutionTask}
                    onUpdateTask={(id: string, updates: Partial<Task>) => {
                      const payload: Record<string, unknown> = { ...updates };
                      if (typeof payload.status === 'string') {
                        payload.status = toApiTaskStatus(payload.status);
                      }
                      fetch(`/api/tasks/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                      }).then((res) => {
                        if (!res.ok) throw new Error('Failed updating task');
                        setData((prev) =>
                          prev
                            ? {
                                ...prev,
                                tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
                              }
                            : null
                        );
                      }).catch(() => {
                        refreshAppData();
                      });
                    }}
                  />
                )}
                {activeView === 'crafts' && (
                  <CraftsView
                    data={data}
                    selectedCraftId={selectedCraftId}
                    returnPath={returnPath}
                    onSelectCraft={setSelectedCraftId}
                    onSetActiveView={setActiveView}
                    onRestoreLaw={setSelectedLawId}
                    onClearReturnPath={() => setReturnPath(null)}
                    onAddEntity={saveCraftEntity}
                  />
                )}
                {activeView === 'time-horizon' && <TimeHorizonView user={data.user} />}
                {activeView === 'lineages' && <LineageMapView data={data} />}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <DomainModal
        selectedDomain={selectedDomain}
        data={data}
        onClose={() => setSelectedDomain(null)}
        onOpenAffair={(id) => {
          setSelectedAffairId(id);
          setSelectedDomain(null);
        }}
        onNavigate={setActiveView}
        onWarGame={(domainId) => openWarGame('domain', domainId)}
        onSaveDomainStrategy={updateDomainStrategy}
        onUpsertLineageRisk={upsertLineageRisk}
      />
    </div>
  );
};

export default App;
