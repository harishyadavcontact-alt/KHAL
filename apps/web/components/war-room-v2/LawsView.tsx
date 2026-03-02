import React, { useMemo, useState } from "react";
import { Activity } from "lucide-react";
import { AppData, Domain } from "./types";
import { LawCard } from "./LawCard";
import { LawDetail } from "./LawDetail";
import { resolveMetric } from "./utils";

type LawSlot = {
  id: string;
  label: string;
  key: "universe" | "nature" | "nurture" | "land" | "time" | "law6";
};
type SourceItem = NonNullable<AppData["sources"]>[number];

const LAW_SLOTS: LawSlot[] = [
  { id: "law-universe", label: "Law of Universe", key: "universe" },
  { id: "law-nature", label: "Law of Nature", key: "nature" },
  { id: "law-nurture", label: "Law of Nurture", key: "nurture" },
  { id: "law-land", label: "Law of Land", key: "land" },
  { id: "law-time", label: "Law of Time", key: "time" },
  { id: "law-6", label: "Law 6 (TBD)", key: "law6" }
];

function resolveDomainSource(domain: Domain, laws: AppData["laws"]): string {
  if (domain.volatilitySourceName) return domain.volatilitySourceName;
  if (domain.volatilitySource) return domain.volatilitySource;
  if (domain.lawId) {
    const law = laws.find((item) => item.id === domain.lawId);
    if (law?.name) return law.name;
  }
  return "Unmapped";
}

function sourceToSlotKey(sourceName: string): LawSlot["key"] {
  const normalized = sourceName.toLowerCase();
  if (normalized.includes("universe")) return "universe";
  if (normalized.includes("nature")) return "nature";
  if (normalized.includes("nurture")) return "nurture";
  if (normalized.includes("land")) return "land";
  if (normalized.includes("time")) return "time";
  if (normalized.includes("jungle")) return "law6";
  if (normalized.includes("law 6") || normalized.includes("tbd")) return "law6";
  return "law6";
}

interface LawsViewProps {
  data: AppData;
  selectedLawId: string | null;
  onSelectLaw: (id: string | null) => void;
  onSelectDomain: (domain: Domain) => void;
  onWarGameSource: (sourceId: string) => void;
  onOpenCraftFromLaw: (craftId: string, lawId: string) => void;
}

export function LawsView({ data, selectedLawId, onSelectLaw, onSelectDomain, onWarGameSource, onOpenCraftFromLaw }: LawsViewProps) {
  const [activeSlotId, setActiveSlotId] = useState<string>(LAW_SLOTS[0].id);

  const slotById = useMemo(() => new Map(LAW_SLOTS.map((slot) => [slot.id, slot])), []);
  const activeSlot = slotById.get(activeSlotId) ?? LAW_SLOTS[0];

  const sourceMap = useMemo(() => {
    const bySlot = new Map<LawSlot["key"], SourceItem | null>();
    for (const slot of LAW_SLOTS) bySlot.set(slot.key, null);
    for (const source of data.sources ?? []) {
      const key = sourceToSlotKey(source.name);
      if (!bySlot.get(key)) bySlot.set(key, source);
    }
    return bySlot;
  }, [data.sources]);

  const domainsBySlot = useMemo(() => {
    const grouped = new Map<string, Domain[]>();
    for (const slot of LAW_SLOTS) grouped.set(slot.id, []);
    for (const domain of data.domains) {
      const sourceName = resolveDomainSource(domain, data.laws);
      const slotKey = sourceToSlotKey(sourceName);
      const slot = LAW_SLOTS.find((item) => item.key === slotKey);
      if (!slot) continue;
      grouped.get(slot.id)?.push(domain);
    }
    return grouped;
  }, [data.domains, data.laws]);

  const filteredLaws = useMemo(() => {
    const byName = data.laws.filter((law) => sourceToSlotKey(law.volatilitySource ?? law.name) === activeSlot.key);
    if (byName.length) return byName;
    return data.laws.filter((law) => {
      const linkedDomain = data.domains.find((domain) => domain.lawId === law.id);
      return linkedDomain ? sourceToSlotKey(resolveDomainSource(linkedDomain, data.laws)) === activeSlot.key : false;
    });
  }, [activeSlot.key, data.domains, data.laws]);

  if (selectedLawId) {
    return (
      <LawDetail
        law={data.laws.find((law) => law.id === selectedLawId)!}
        domains={data.domains.filter((domain) => domain.lawId === selectedLawId)}
        crafts={data.crafts.filter((craft) => data.laws.find((law) => law.id === selectedLawId)?.associatedCrafts?.includes(craft.id))}
        onBack={() => onSelectLaw(null)}
        onDomainClick={onSelectDomain}
        onCraftClick={(id: string) => onOpenCraftFromLaw(id, selectedLawId)}
      />
    );
  }

  const activeDomains = domainsBySlot.get(activeSlot.id) ?? [];
  const activeSource = sourceMap.get(activeSlot.key);
  const warGameTarget = activeSource?.id ?? activeSlot.id;

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-3xl font-bold">Source of Volatility</h2>
          <span className="text-[10px] uppercase tracking-widest font-mono text-zinc-500">6 fixed law slots</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-5">
          {LAW_SLOTS.map((slot) => {
            const selected = slot.id === activeSlot.id;
            const linkedDomains = domainsBySlot.get(slot.id)?.length ?? 0;
            return (
              <button
                key={slot.id}
                onClick={() => setActiveSlotId(slot.id)}
                className={
                  selected
                    ? "glass p-4 rounded-xl border border-blue-500/60 text-left"
                    : "glass p-4 rounded-xl border border-white/10 hover:border-blue-500/30 text-left"
                }
              >
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Volatility Law</div>
                <div className="text-sm font-bold">{slot.label}</div>
                <div className="text-[11px] text-zinc-400 mt-2">Linked domains: {linkedDomains}</div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-2">Click to open narrative + analytics</div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 glass p-5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Source Narrative</h3>
              <button
                onClick={() => onWarGameSource(warGameTarget)}
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-[10px] font-bold uppercase tracking-widest text-white"
              >
                WarGame Source
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Subnodes</div>
                <p className="text-zinc-300">
                  {activeDomains.length ? `${activeDomains.length} domain subnodes currently mapped to this law.` : "No subnodes mapped yet."}
                </p>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Philosophy</div>
                <p className="text-zinc-300 italic">Remove fragility before optimizing upside. Narrative drives allocation.</p>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Strategies / State of Affairs</div>
                <p className="text-zinc-300">Linked strategic state is available through domain cards and law detail drill-down.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 glass p-5 rounded-xl border border-white/10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-3">Linked Domains</h3>
            <div className="space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
              {activeDomains.map((domain) => (
                <button
                  key={domain.id}
                  onClick={() => onSelectDomain(domain)}
                  className="w-full text-left p-3 rounded-lg bg-zinc-900/60 border border-white/5 hover:border-blue-500/40 transition-colors"
                >
                  <div className="text-sm font-semibold">{domain.name}</div>
                  <div className="text-[10px] mt-1 text-zinc-500 font-mono uppercase">Fragility: {domain.fragilityText ?? "Undefined"}</div>
                </button>
              ))}
              {!activeDomains.length && <div className="text-xs text-zinc-500">No linked domains.</div>}
            </div>
          </div>

          <div className="lg:col-span-3 glass p-5 rounded-xl border border-white/10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-3">Analytical Data</h3>
            <div className="space-y-2">
              <div className="p-2 rounded bg-zinc-900/60 border border-white/10 text-xs text-zinc-300">Law Slot: {activeSlot.label}</div>
              <div className="p-2 rounded bg-zinc-900/60 border border-white/10 text-xs text-zinc-300">
                Source ID: {activeSource?.id ?? "TBD slot"}
              </div>
              <div className="p-2 rounded bg-zinc-900/60 border border-white/10 text-xs text-zinc-300">Domains: {activeDomains.length}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
          {filteredLaws.map((law) => (
            <LawCard
              key={law.id}
              law={law}
              domains={data.domains.filter((domain) => domain.lawId === law.id)}
              onClick={() => onSelectLaw(law.id)}
            />
          ))}
        </div>
      </section>

      <section className="glass p-6 rounded-xl border border-white/10">
        <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
          <Activity className="text-red-500" />
          Volatility Heatmap
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {activeDomains.map((domain) => {
            const intensity = resolveMetric(undefined, { entityId: `${domain.id}:volatility`, min: 10, max: 95 });
            return (
              <div
                key={domain.id}
                onClick={() => onSelectDomain(domain)}
                className="aspect-square rounded-xl border border-white/5 flex flex-col items-center justify-center p-2 cursor-pointer hover:scale-105 transition-all"
                style={{ backgroundColor: `rgba(239, 68, 68, ${intensity / 200})` }}
              >
                <div className="text-[8px] font-mono text-zinc-400 uppercase text-center mb-1">{domain.name}</div>
                <div className="text-sm font-bold">{intensity}%</div>
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex justify-between text-[10px] font-mono text-zinc-500 uppercase">
          <span>Stable</span>
          <div className="flex-1 mx-4 h-1 bg-gradient-to-r from-emerald-500/20 via-yellow-500/20 to-red-500/50 rounded-full" />
          <span>Volatile</span>
        </div>
      </section>
    </div>
  );
}
