import React, { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { AppData, Domain, DomainStrategyDetailDto, WarRoomViewState } from "./types";
import { HeatGrid } from "./charts/HeatGrid";
import { StackedBalanceBar } from "./charts/StackedBalanceBar";
import { MiniTrend } from "./charts/MiniTrend";
import { buildDomainVisualSnapshot } from "../../lib/war-room/visual-encodings";
import { projectionsByDomain } from "../../lib/war-room/state-of-art";

interface DomainModalProps {
  selectedDomain: Domain | null;
  data: AppData;
  onClose: () => void;
  onOpenAffair: (id: string) => void;
  onNavigate: (view: WarRoomViewState) => void;
  onWarGame: (domainId: string) => void;
  onSaveDomainStrategy: (domainId: string, updates: Partial<DomainStrategyDetailDto>) => Promise<void>;
  onUpsertLineageRisk: (payload: {
    id?: string;
    sourceId: string;
    domainId: string;
    lineageNodeId: string;
    actorType: "personal" | "private" | "public";
    title: string;
    exposure: number;
    dependency: number;
    irreversibility: number;
    optionality: number;
    responseTime: number;
    status: "OPEN" | "MITIGATING" | "RESOLVED" | "INCOMPLETE";
    notes?: string;
  }) => Promise<void>;
}

type EditSection = "philosopher" | "barbell" | "means" | "affairs" | "vulnerabilities" | null;

export function DomainModal({ selectedDomain, data, onClose, onOpenAffair, onNavigate, onWarGame, onSaveDomainStrategy, onUpsertLineageRisk }: DomainModalProps) {
  const [editingSection, setEditingSection] = useState<EditSection>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [riskSaving, setRiskSaving] = useState(false);
  const [riskDraft, setRiskDraft] = useState({
    title: "",
    lineageNodeId: data.lineages?.nodes?.[0]?.id ?? "ln-self",
    actorType: "personal" as "personal" | "private" | "public",
    exposure: 5,
    dependency: 5,
    irreversibility: 5,
    optionality: 5,
    responseTime: 7,
    status: "INCOMPLETE" as "OPEN" | "MITIGATING" | "RESOLVED" | "INCOMPLETE",
    notes: ""
  });

  const sourceLabel = selectedDomain?.volatilitySourceName ?? selectedDomain?.volatility ?? selectedDomain?.volatilitySource;
  const activeSource = (data.sources ?? []).find((source) => source.name === sourceLabel) ?? (data.sources ?? [])[0];
  const lineageRisksForDomain = (data.lineageRisks ?? []).filter((risk) => risk.domainId === selectedDomain?.id);
  const sourceBackedProjections = useMemo(() => {
    if (!selectedDomain) return [];
    return projectionsByDomain({ sources: data.sources ?? [], domains: data.domains, crafts: data.crafts }).get(selectedDomain.id) ?? [];
  }, [data.crafts, data.domains, data.sources, selectedDomain]);
  const domainVisual = useMemo(() => {
    if (!selectedDomain) return null;
    return buildDomainVisualSnapshot({ domainId: selectedDomain.id, data });
  }, [data, selectedDomain]);

  const sectionFields = useMemo(() => {
    if (!selectedDomain) return { title: "", fields: [] as Array<{ key: string; label: string; value: string }> };
    if (editingSection === "philosopher") {
      return {
        title: "Edit Philosopher's Stone",
        fields: [
          { key: "stakesText", label: "Stakes", value: selectedDomain.stakesText ?? "" },
          { key: "risksText", label: "Risk", value: selectedDomain.risksText ?? "" },
          { key: "fragilityText", label: "Fragility", value: selectedDomain.fragilityText ?? "" }
        ]
      };
    }
    if (editingSection === "barbell") {
      return {
        title: "Edit Barbell Strategy",
        fields: [
          { key: "hedgeText", label: "Hedge (90%)", value: selectedDomain.hedge ?? "" },
          { key: "edgeText", label: "Edge (10%)", value: selectedDomain.edge ?? "" }
        ]
      };
    }
    if (editingSection === "means") {
      return {
        title: "Edit Means",
        fields: [
          { key: "heuristicsText", label: "Heuristics", value: selectedDomain.heuristics ?? "" },
          { key: "tacticsText", label: "Tactics", value: selectedDomain.tactics ?? "" }
        ]
      };
    }
    if (editingSection === "affairs") {
      return {
        title: "Edit State of Affairs",
        fields: [
          { key: "interestsText", label: "Interests", value: selectedDomain.interestsText ?? "" },
          { key: "affairsText", label: "Affairs", value: selectedDomain.affairsText ?? "" }
        ]
      };
    }
    if (editingSection === "vulnerabilities") {
      return {
        title: "Edit Vulnerabilities",
        fields: [{ key: "vulnerabilitiesText", label: "Vulnerabilities", value: selectedDomain.vulnerabilitiesText ?? "" }]
      };
    }
    return { title: "", fields: [] };
  }, [editingSection, selectedDomain]);

  const openEditor = (section: EditSection) => {
    setEditingSection(section);
    setError(null);
    const next: Record<string, string> = {};
    const fields: Array<[string, string | undefined]> =
      section === "philosopher"
        ? [
            ["stakesText", selectedDomain?.stakesText],
            ["risksText", selectedDomain?.risksText],
            ["fragilityText", selectedDomain?.fragilityText]
          ]
        : section === "barbell"
          ? [
              ["hedgeText", selectedDomain?.hedge],
              ["edgeText", selectedDomain?.edge]
            ]
          : section === "means"
            ? [
                ["heuristicsText", selectedDomain?.heuristics],
                ["tacticsText", selectedDomain?.tactics]
              ]
            : section === "affairs"
              ? [
                  ["interestsText", selectedDomain?.interestsText],
                  ["affairsText", selectedDomain?.affairsText]
                ]
              : [["vulnerabilitiesText", selectedDomain?.vulnerabilitiesText]];
    fields.forEach(([key, value]) => {
      next[key] = value ?? "";
    });
    setDraft(next);
  };

  const saveDrawer = async () => {
    if (!selectedDomain || !editingSection) return;
    setSaving(true);
    setError(null);
    try {
      await onSaveDomainStrategy(selectedDomain.id, draft);
      setEditingSection(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save domain strategy");
    } finally {
      setSaving(false);
    }
  };

  const saveRisk = async () => {
    if (!selectedDomain || !activeSource) return;
    setRiskSaving(true);
    setError(null);
    try {
      await onUpsertLineageRisk({
        sourceId: activeSource.id,
        domainId: selectedDomain.id,
        lineageNodeId: riskDraft.lineageNodeId,
        actorType: riskDraft.actorType,
        title: riskDraft.title || `${selectedDomain.name} lineage risk`,
        exposure: riskDraft.exposure,
        dependency: riskDraft.dependency,
        irreversibility: riskDraft.irreversibility,
        optionality: riskDraft.optionality,
        responseTime: riskDraft.responseTime,
        status: riskDraft.status,
        notes: riskDraft.notes || undefined
      });
      setRiskDraft((prev) => ({ ...prev, title: "", notes: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save lineage risk");
    } finally {
      setRiskSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {selectedDomain && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl relative z-10 flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
              <div>
                <h2 className="text-2xl font-bold">{selectedDomain.name}</h2>
                <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">{sourceLabel}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full">
                <Plus className="w-6 h-6 rotate-45 text-zinc-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-mono uppercase text-zinc-500 tracking-widest">Domain Posture</h4>
                    <button onClick={() => openEditor("philosopher")} className="text-[10px] uppercase font-mono text-blue-400 hover:text-blue-300">
                      Edit
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(domainVisual?.posture ?? []).map((metric) => (
                      <div key={metric.id}>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-400 uppercase tracking-widest">{metric.label}</span>
                          <span className="font-mono text-zinc-200">{metric.value}</span>
                        </div>
                        <div className="h-2 mt-1 rounded-full bg-zinc-900/80 overflow-hidden">
                          <div
                            className={
                              metric.id === "fragility"
                                ? "h-full bg-red-500"
                                : metric.id === "risk"
                                  ? "h-full bg-amber-500"
                                  : "h-full bg-blue-500"
                            }
                            style={{ width: `${metric.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="xl:col-span-2 p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-mono uppercase text-zinc-500 tracking-widest">Barbell + Means Coverage</h4>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditor("barbell")} className="text-[10px] uppercase font-mono text-blue-400 hover:text-blue-300">
                        Barbell
                      </button>
                      <button onClick={() => openEditor("means")} className="text-[10px] uppercase font-mono text-blue-400 hover:text-blue-300">
                        Means
                      </button>
                    </div>
                  </div>
                  <StackedBalanceBar segments={domainVisual?.barbellSegments ?? []} emptyText="No hedge/edge mass." />
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">Means Coverage</div>
                      <div className="text-xl font-bold mt-1">{domainVisual?.meansCoveragePct ?? 0}%</div>
                      <div className="h-2 mt-2 rounded-full bg-zinc-900 overflow-hidden">
                        <div className="h-full bg-teal-500" style={{ width: `${domainVisual?.meansCoveragePct ?? 0}%` }} />
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Fragility Trend</div>
                      <MiniTrend values={domainVisual?.riskTrend ?? []} tone="risk" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5 mb-8">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Lineage Risk HeatGrid</div>
                <HeatGrid
                  columns={domainVisual?.riskColumns ?? []}
                  rows={domainVisual?.riskRows ?? []}
                  cells={domainVisual?.riskCells ?? []}
                  emptyText="No domain lineage risks mapped."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-mono uppercase text-zinc-500 tracking-widest">Source-Backed State of the Art</h4>
                  </div>
                  <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5 space-y-3">
                    {!sourceBackedProjections.length ? <div className="text-xs text-zinc-500">No source-map profile linked to this domain yet.</div> : null}
                    {sourceBackedProjections.map((projection) => (
                      <div key={projection.profileId} className="rounded-lg border border-white/10 bg-zinc-950/30 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold text-zinc-100">{projection.sourceName}</div>
                          <div className="text-[10px] uppercase tracking-widest text-zinc-500">{projection.quadrant}</div>
                        </div>
                        <div className="mt-2 text-xs text-zinc-300">Skin in the game: {projection.stone.asymmetry.skinInTheGame.stakes ?? "Undefined"}</div>
                        <div className="mt-1 text-xs text-zinc-400">Risks: {projection.stone.asymmetry.skinInTheGame.risks ?? "Undefined"}</div>
                        <div className="mt-1 text-xs text-zinc-400">Lineage: {projection.stone.asymmetry.skinInTheGame.lineage ?? "Undefined"}</div>
                        <div className="mt-1 text-xs text-zinc-400">Short volatility: {projection.stone.nonLinearity.shortVolatilityLabel ?? "Undefined"}</div>
                        <div className="mt-1 text-xs text-zinc-400">Hedge / Edge: {projection.ends.hedge ?? "Undefined"} / {projection.ends.edge ?? "Undefined"}</div>
                        <div className="mt-1 text-xs text-zinc-400">Means: {projection.means.primaryCraftName ?? projection.means.primaryCraftId ?? "Unassigned"}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-mono uppercase text-zinc-500 tracking-widest">State of Affairs</h4>
                    <button onClick={() => openEditor("affairs")} className="text-[10px] uppercase font-mono text-blue-400 hover:text-blue-300">
                      Edit
                    </button>
                  </div>
                  <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5 space-y-4">
                    <div>
                      <div className="text-[10px] text-emerald-400 uppercase mb-1">Interests</div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{selectedDomain.interestsText || "None defined"}</p>
                    </div>
                    <div>
                      <div className="text-[10px] text-blue-400 uppercase mb-1">Affairs</div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{selectedDomain.affairsText || "None defined"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-mono uppercase text-zinc-500 tracking-widest">Vulnerabilities</h4>
                    <button onClick={() => openEditor("vulnerabilities")} className="text-[10px] uppercase font-mono text-blue-400 hover:text-blue-300">
                      Edit
                    </button>
                  </div>
                  <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">{selectedDomain.vulnerabilitiesText ?? "None defined"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-xs font-mono uppercase text-zinc-500 mb-4 tracking-widest">Active Affairs in this Domain</h4>
                <div className="grid grid-cols-1 gap-4">
                  {data.affairs
                    .filter((a) => a.context?.associatedDomains?.includes(selectedDomain.id))
                    .map((a) => (
                      <div key={a.id} className="p-4 bg-zinc-800/50 rounded-xl border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold">{a.title}</div>
                          <div className="text-xs text-zinc-500 uppercase">{a.status}</div>
                        </div>
                        <button onClick={() => onOpenAffair(a.id)} className="text-xs font-bold text-blue-400 hover:text-blue-300">
                          OPEN CHAMBER
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-xs font-mono uppercase text-zinc-500 mb-4 tracking-widest">Lineage Risk Register</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <input
                    value={riskDraft.title}
                    onChange={(event) => setRiskDraft((prev) => ({ ...prev, title: event.target.value }))}
                    className="bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm"
                    placeholder="Risk title"
                  />
                  <select
                    value={riskDraft.lineageNodeId}
                    onChange={(event) => setRiskDraft((prev) => ({ ...prev, lineageNodeId: event.target.value }))}
                    className="bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm"
                  >
                    {(data.lineages?.nodes ?? []).map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.level} - {node.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  {(["exposure", "dependency", "irreversibility", "optionality"] as const).map((key) => (
                    <label key={key} className="text-xs text-zinc-400">
                      <span className="uppercase">{key}</span>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={riskDraft[key]}
                        onChange={(event) => setRiskDraft((prev) => ({ ...prev, [key]: Number(event.target.value) }))}
                        className="w-full mt-1"
                      />
                      <span className="font-mono text-[10px]">{riskDraft[key]}</span>
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={riskDraft.responseTime}
                    onChange={(event) => setRiskDraft((prev) => ({ ...prev, responseTime: Number(event.target.value || 7) }))}
                    className="bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm"
                    placeholder="Response time days"
                  />
                  <select value={riskDraft.actorType} onChange={(event) => setRiskDraft((prev) => ({ ...prev, actorType: event.target.value as "personal" | "private" | "public" }))} className="bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm">
                    <option value="personal">personal</option>
                    <option value="private">private</option>
                    <option value="public">public</option>
                  </select>
                  <select value={riskDraft.status} onChange={(event) => setRiskDraft((prev) => ({ ...prev, status: event.target.value as "OPEN" | "MITIGATING" | "RESOLVED" | "INCOMPLETE" }))} className="bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm">
                    <option value="INCOMPLETE">INCOMPLETE</option>
                    <option value="OPEN">OPEN</option>
                    <option value="MITIGATING">MITIGATING</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                  <button onClick={saveRisk} disabled={riskSaving || !activeSource} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-semibold text-white disabled:bg-zinc-700">
                    {riskSaving ? "Saving..." : "Add Risk"}
                  </button>
                </div>
                <textarea
                  value={riskDraft.notes}
                  onChange={(event) => setRiskDraft((prev) => ({ ...prev, notes: event.target.value }))}
                  className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm mb-4"
                  placeholder="Notes"
                />

                <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
                  <div className="space-y-2">
                    {lineageRisksForDomain.length === 0 && <div className="text-xs text-zinc-500">No lineage risks recorded yet.</div>}
                    {lineageRisksForDomain.map((risk) => (
                      <div key={risk.id} className="p-3 bg-zinc-900/50 rounded-lg border border-white/5">
                        <div className="flex justify-between items-center">
                          <div className="font-semibold text-sm">{risk.title}</div>
                          <div className="text-[10px] font-mono text-zinc-400">{risk.status}</div>
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-1">
                          E:{risk.exposure} D:{risk.dependency} I:{risk.irreversibility} O:{risk.optionality} R:{risk.responseTime} F:{risk.fragilityScore}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-zinc-900/50 rounded-lg border border-white/5">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Live Risk Trend</div>
                    <MiniTrend values={domainVisual?.riskTrend ?? []} tone="risk" width={150} height={50} />
                    <div className="mt-3">
                      <StackedBalanceBar segments={domainVisual?.barbellSegments ?? []} showLegend={false} emptyText="No mass data." />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-zinc-900/50 flex justify-end gap-3">
              <button
                onClick={() => {
                  onWarGame(selectedDomain.id);
                  onClose();
                }}
                className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-zinc-200"
              >
                WAR GAME
              </button>
              <button
                onClick={() => {
                  onNavigate("execution");
                  onClose();
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors text-white"
              >
                EXECUTE
              </button>
            </div>

            <AnimatePresence>
              {editingSection && (
                <motion.div initial={{ x: 380, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 380, opacity: 0 }} className="absolute top-0 right-0 h-full w-full max-w-md bg-zinc-900 border-l border-white/10 z-20 flex flex-col">
                  <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="font-semibold">{sectionFields.title}</h3>
                    <button className="text-zinc-400 hover:text-zinc-200 text-sm" onClick={() => setEditingSection(null)}>
                      Cancel
                    </button>
                  </div>
                  <div className="p-5 space-y-4 overflow-y-auto flex-1">
                    {sectionFields.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{field.label}</label>
                        <textarea
                          className="w-full min-h-24 bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm"
                          value={draft[field.key] ?? field.value}
                          onChange={(event) => setDraft((prev) => ({ ...prev, [field.key]: event.target.value }))}
                        />
                      </div>
                    ))}
                    {error && <div className="text-sm text-red-400">{error}</div>}
                  </div>
                  <div className="p-5 border-t border-white/10 flex justify-end gap-2">
                    <button className="px-4 py-2 text-sm text-zinc-300 hover:text-white" onClick={() => setEditingSection(null)}>
                      Cancel
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:bg-zinc-700" onClick={saveDrawer} disabled={saving}>
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
