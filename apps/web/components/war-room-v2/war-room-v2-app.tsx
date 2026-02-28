import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Anchor, Briefcase, Crosshair, Database, Globe, LayoutDashboard, Maximize2, Minimize2, User, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from './utils';
import { AppData, Domain, Task, WarRoomViewState } from './types';
import { MissionCommand } from './MissionCommand';
import { WarGaming } from './WarGaming';
import { SurgicalExecution } from './SurgicalExecution';
import { DecisionChamber } from './DecisionChamber';
import { LawsView } from './LawsView';
import { InterestsView } from './InterestsView';
import { AffairsView } from './AffairsView';
import { CraftsView } from './CraftsView';
import { DomainModal } from './DomainModal';

const App = () => {
  const [activeView, setActiveView] = useState<WarRoomViewState>('mission');
  const searchParams = useSearchParams();
  const [data, setData] = useState<AppData | null>(null);
  const [selectedAffairId, setSelectedAffairId] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [selectedCraftId, setSelectedCraftId] = useState<string | null>(null);
  const [selectedLawId, setSelectedLawId] = useState<string | null>(null);
  const [selectedInterestId, setSelectedInterestId] = useState<string | null>(null);
  const [returnPath, setReturnPath] = useState<{ view: string; id: string | null } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetch('/api/data')
      .then((res) => res.json())
      .then(setData);
  }, []);

  useEffect(() => {
    const view = searchParams.get('view');
    const map: Record<string, WarRoomViewState> = {
      mission: 'mission',
      laws: 'laws',
      interests: 'interests',
      affairs: 'affairs',
      'war-gaming': 'war-gaming',
      execution: 'execution',
      crafts: 'crafts'
    };
    if (view && view in map) {
      setActiveView(map[view]);
    }
  }, [searchParams]);

  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <div className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Initializing KHAL OS...</div>
        </div>
      </div>
    );
  }

  const navItems: Array<{ id: WarRoomViewState; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
    { id: 'mission', label: 'Mission Command', icon: LayoutDashboard },
    { id: 'laws', label: 'Laws of Volatility', icon: Globe },
    { id: 'interests', label: 'Interests', icon: Anchor },
    { id: 'affairs', label: 'Affairs', icon: Briefcase },
    { id: 'war-gaming', label: 'War Gaming', icon: Zap },
    { id: 'execution', label: 'Surgical Execution', icon: Crosshair },
    { id: 'crafts', label: 'Crafts Library', icon: Database }
  ];

  const selectedAffair = data.affairs.find((a) => a.id === selectedAffairId);

  const resetSelections = () => {
    setSelectedAffairId(null);
    setSelectedDomain(null);
    setSelectedCraftId(null);
    setSelectedLawId(null);
    setSelectedInterestId(null);
    setReturnPath(null);
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-zinc-900/50 backdrop-blur-xl border-r border-white/5 transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <div className="p-6 flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-xl italic shrink-0">K</div>
          {sidebarOpen && (
            <div className="font-bold tracking-tighter text-xl">
              KHAL <span className="text-zinc-500 font-normal">OS</span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id);
                resetSelections();
              }}
              className={cn(
                'w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all group',
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

      <div className={cn('flex-1 transition-all duration-300', sidebarOpen ? 'ml-64' : 'ml-20')}>
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 sticky top-0 bg-zinc-950/50 backdrop-blur-xl z-40">
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
                <DecisionChamber affair={selectedAffair} data={data} onBack={() => setSelectedAffairId(null)} />
              </motion.div>
            ) : (
              <motion.div key={activeView} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-8">
                {activeView === 'mission' && <MissionCommand data={data} onDomainClick={setSelectedDomain} />}
                {activeView === 'laws' && (
                  <LawsView
                    data={data}
                    selectedLawId={selectedLawId}
                    onSelectLaw={setSelectedLawId}
                    onSelectDomain={setSelectedDomain}
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
                  />
                )}
                {activeView === 'affairs' && <AffairsView data={data} onSelectAffair={setSelectedAffairId} />}
                {activeView === 'war-gaming' && (
                  <WarGaming
                    domains={data.domains}
                    onAddTask={(task: any) => {
                      fetch('/api/tasks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(task)
                      })
                        .then((res) => res.json())
                        .then((newTask) => {
                          setData((prev) => (prev ? { ...prev, tasks: [...prev.tasks, newTask] } : null));
                        });
                    }}
                  />
                )}
                {activeView === 'execution' && (
                  <SurgicalExecution
                    tasks={data.tasks}
                    onUpdateTask={(id: string, updates: Partial<Task>) => {
                      fetch(`/api/tasks/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updates)
                      }).then(() => {
                        setData((prev) =>
                          prev
                            ? {
                                ...prev,
                                tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
                              }
                            : null
                        );
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
      />
    </div>
  );
};

export default App;
