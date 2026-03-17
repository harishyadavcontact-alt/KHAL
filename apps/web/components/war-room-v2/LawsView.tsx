import React, { useMemo, useState } from "react";
import { ArrowRight, Shield, Sparkles } from "lucide-react";
import { AppData, Domain } from "./types";
import { LawCard } from "./LawCard";
import { LawDetail } from "./LawDetail";
import { canonicalSlotFromLabel, lawAliasForSlot, type CanonicalLawSlot } from "../../lib/war-room/law-aliases";

type LawSlot = {
  id: string;
  canonicalLabel: string;
  key: CanonicalLawSlot;
};

type SourceItem = NonNullable<AppData["sources"]>[number];

const LAW_SLOTS: LawSlot[] = [
  { id: "law-universe", canonicalLabel: "Law of Universe", key: "universe" },
  { id: "law-nature", canonicalLabel: "Law of Nature", key: "nature" },
  { id: "law-nurture", canonicalLabel: "Law of Nurture", key: "nurture" },
  { id: "law-land", canonicalLabel: "Law of Land", key: "land" },
  { id: "law-time", canonicalLabel: "Law of Time", key: "time" },
  { id: "law-6", canonicalLabel: "Law 6 (TBD)", key: "law6" }
];

const HARD_LAW_KEYS = new Set<LawSlot["key"]>(["universe", "nature", "time"]);

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
  return canonicalSlotFromLabel(sourceName) ?? "law6";
}

function slotDoctrineClass(slot: LawSlot): "hard" | "human" {
  return HARD_LAW_KEYS.has(slot.key) ? "hard" : "human";
}

function doctrineChipClass(kind: "hard" | "human"): string {
  if (kind === "hard") return "rounded-sm border border-[rgba(224,90,58,0.22)] bg-[rgba(224,90,58,0.08)] px-2 py-1 text-[10px] uppercase tracking-[0.12em] font-[var(--font-mono)] text-[var(--color-danger)]";
  return "rounded-sm border border-[rgba(48,224,176,0.22)] bg-[rgba(48,224,176,0.08)] px-2 py-1 text-[10px] uppercase tracking-[0.12em] font-[var(--font-mono)] text-[var(--color-success)]";
}

interface LawsViewProps {
  data: AppData;
  selectedLawId: string | null;
  onSelectLaw: (id: string | null) => void;
  onSelectDomain: (domain: Domain) => void;
  onWarGameSource: (sourceId: string) => void;
  onOpenCraftFromLaw: (craftId: string, lawId: string) => void;
}

function DeepPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="khal-chamber p-5"
      style={{
        background: "linear-gradient(180deg, rgba(18,18,31,0.88), rgba(10,10,18,0.94))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 30px rgba(0,0,0,0.18)"
      }}
    >
      {children}
    </div>
  );
}

function SurfaceRow({ children, accent = "var(--color-line)" }: { children: React.ReactNode; accent?: string }) {
  return (
    <div
      className="rounded-sm border p-4"
      style={{
        borderColor: accent,
        background: "linear-gradient(180deg, rgba(18,18,31,0.82), rgba(10,10,18,0.9))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 24px rgba(0,0,0,0.12)"
      }}
    >
      {children}
    </div>
  );
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
  const activeSlotClass = slotDoctrineClass(activeSlot);
  const hardLawCount = LAW_SLOTS.filter((slot) => slotDoctrineClass(slot) === "hard").length;
  const humanLawCount = LAW_SLOTS.length - hardLawCount;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-[var(--color-line)] pb-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Sources of Volatility</div>
          <h2 className="khal-serif-hero mt-2 text-4xl text-[var(--color-text-strong)]">Volatility laws</h2>
          <p className="mt-3 max-w-3xl text-sm text-[var(--color-text-muted)]">
            This surface should answer one question: what class of volatility is this, and which domains currently live under it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={doctrineChipClass("hard")}>Hard laws {hardLawCount}</span>
          <span className={doctrineChipClass("human")}>Human laws {humanLawCount}</span>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="space-y-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {LAW_SLOTS.map((slot) => {
              const selected = slot.id === activeSlot.id;
              const linkedDomains = domainsBySlot.get(slot.id)?.length ?? 0;
              const doctrineClass = slotDoctrineClass(slot);
              return (
                <button
                  key={slot.id}
                  onClick={() => setActiveSlotId(slot.id)}
                  className="text-left"
                >
                  <SurfaceRow accent={selected ? "var(--color-accent)" : "var(--color-line)"}>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Volatility law</div>
                    <div className="mt-1 text-lg text-[var(--color-text-strong)]">{lawAliasForSlot(slot.key) ?? slot.canonicalLabel}</div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={doctrineChipClass(doctrineClass)}>
                        {doctrineClass === "hard" ? "Hard law" : "Human law"}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-[var(--color-text-muted)]">Linked domains: {linkedDomains}</div>
                  </SurfaceRow>
                </button>
              );
            })}
          </div>

          <DeepPanel>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-line)] pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Active law</div>
                <div className="mt-1 text-2xl text-[var(--color-text-strong)]">{lawAliasForSlot(activeSlot.key) ?? activeSlot.canonicalLabel}</div>
                <div className="mt-2 text-sm text-[var(--color-text-muted)]">{activeSource?.name ?? "No mapped runtime source yet"}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={doctrineChipClass(activeSlotClass)}>
                  {activeSlotClass === "hard" ? "Hard law" : "Human law"}
                </span>
                <button
                  onClick={() => onWarGameSource(warGameTarget)}
                  className="rounded-sm border border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] px-3 py-2 text-[11px] uppercase tracking-[0.1em] font-[var(--font-mono)] text-[var(--color-text)]"
                >
                  WarGame Source
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {activeDomains.map((domain) => (
                <button
                  key={domain.id}
                  onClick={() => onSelectDomain(domain)}
                  className="text-left"
                >
                  <SurfaceRow>
                    <div className="text-base text-[var(--color-text-strong)]">{domain.name}</div>
                    <div className="mt-1 text-xs text-[var(--color-text-muted)]">{domain.fragilityText ?? "Fragility undefined"}</div>
                  </SurfaceRow>
                </button>
              ))}
              {!activeDomains.length ? <div className="rounded-sm border border-dashed border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] px-4 py-4 text-sm text-[var(--color-text-muted)]">No linked domains.</div> : null}
            </div>
          </DeepPanel>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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

        <aside className="space-y-4">
          <DeepPanel>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Source rule</div>
            <div className="mt-3 space-y-3 text-sm text-[var(--color-text-muted)]">
              <div className="flex items-start gap-3">
                <Shield size={14} className="mt-1 text-[var(--color-danger)]" />
                <span>Use this surface to classify volatility source families, not to work local doctrine.</span>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles size={14} className="mt-1 text-[var(--color-success)]" />
                <span>Move into Domain or Source War Gaming once the family is clear.</span>
              </div>
            </div>
          </DeepPanel>

          <DeepPanel>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Entry routes</div>
            <div className="mt-3 space-y-3">
              {activeDomains.slice(0, 5).map((domain) => (
                <button
                  key={domain.id}
                  onClick={() => onSelectDomain(domain)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <SurfaceRow>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm text-[var(--color-text-strong)]">{domain.name}</div>
                        <div className="mt-1 text-xs text-[var(--color-text-muted)]">{resolveDomainSource(domain, data.laws)}</div>
                      </div>
                      <ArrowRight size={13} className="text-[var(--color-accent)]" />
                    </div>
                  </SurfaceRow>
                </button>
              ))}
              {!activeDomains.length ? <div className="text-sm text-[var(--color-text-muted)]">No domain entry routes yet.</div> : null}
            </div>
          </DeepPanel>
        </aside>
      </div>
    </div>
  );
}
