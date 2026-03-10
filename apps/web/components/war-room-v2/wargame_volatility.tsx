import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { decisionTypeLabel, methodPostureForQuadrant, quadrantNarrative, tailClassLabel } from "../../lib/war-room/source-map";
import { Domain, LineageNodeDto, LineageRiskDto, SourceMapDecisionType, SourceMapProfileDto, SourceMapTailClass, VolatilitySourceDto } from "./types";

interface WarGameVolatilityProps {
  sourceId?: string;
  sources: VolatilitySourceDto[];
  domains: Domain[];
  lineages: LineageNodeDto[];
  lineageRisks: LineageRiskDto[];
  crafts?: Array<{ id: string; name: string }>;
  onSourceMapSaved?: () => Promise<void> | void;
}

type SourceMapUpdate = Partial<Pick<
  SourceMapProfileDto,
  | "decisionType"
  | "tailClass"
  | "notes"
  | "stakesText"
  | "risksText"
  | "playersText"
  | "lineageThreatText"
  | "fragilityPosture"
  | "vulnerabilitiesText"
  | "hedgeText"
  | "edgeText"
  | "primaryCraftId"
  | "heuristicsText"
  | "avoidText"
>>;

type StateOfArtStep = "map" | "stone" | "ends" | "means";

const STEP_ORDER: Array<{ id: StateOfArtStep; label: string; prompt: string }> = [
  { id: "map", label: "Map", prompt: "Classify decision structure, tail behavior, and quadrant." },
  { id: "stone", label: "Stone", prompt: "Diagnose stakes, risks, fragility, and lineage exposure." },
  { id: "ends", label: "Ends", prompt: "Set the barbell: hedge for robustness, edge for optionality." },
  { id: "means", label: "Means", prompt: "Choose craft, heuristics, and what to avoid." }
];

export function WarGameVolatility({
  sourceId,
  sources,
  domains,
  lineages,
  lineageRisks,
  crafts = [],
  onSourceMapSaved
}: WarGameVolatilityProps) {
  const router = useRouter();
  const source = sources.find((item) => item.id === sourceId);
  const [savingDomainId, setSavingDomainId] = useState<string | null>(null);
  const [creatingKind, setCreatingKind] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<StateOfArtStep>("map");
  const linkedDomainIds = useMemo(() => {
    const fromLinks = (source?.domains ?? []).map((link) => link.domainId);
    if (fromLinks.length > 0) return new Set(fromLinks);
    return new Set(domains.filter((domain) => domain.volatilitySourceId === sourceId).map((domain) => domain.id));
  }, [domains, source?.domains, sourceId]);
  const linkedDomains = domains.filter((domain) => linkedDomainIds.has(domain.id));
  const sourceRisks = lineageRisks.filter((risk) => risk.sourceId === sourceId);
  const affectedLineages = lineages.filter((lineage) => sourceRisks.some((risk) => risk.lineageNodeId === lineage.id));
  const mapProfilesByDomainId = new Map((source?.mapProfiles ?? []).map((profile) => [profile.domainId, profile]));
  const completedMapCount = linkedDomains.filter((domain) => mapProfilesByDomainId.has(domain.id)).length;
  const stepCoverage = {
    map: linkedDomains.filter((domain) => {
      const profile = mapProfilesByDomainId.get(domain.id);
      return Boolean(profile?.decisionType && profile?.tailClass && profile?.quadrant && profile?.methodPosture);
    }).length,
    stone: linkedDomains.filter((domain) => {
      const profile = mapProfilesByDomainId.get(domain.id);
      return Boolean(profile?.stakesText?.trim() && profile?.risksText?.trim() && profile?.fragilityPosture?.trim() && profile?.vulnerabilitiesText?.trim());
    }).length,
    ends: linkedDomains.filter((domain) => {
      const profile = mapProfilesByDomainId.get(domain.id);
      return Boolean(profile?.hedgeText?.trim() && profile?.edgeText?.trim());
    }).length,
    means: linkedDomains.filter((domain) => {
      const profile = mapProfilesByDomainId.get(domain.id);
      return Boolean(profile?.primaryCraftId?.trim() && profile?.heuristicsText?.trim() && profile?.avoidText?.trim());
    }).length
  } satisfies Record<StateOfArtStep, number>;

  const saveProfile = async (domainId: string, updates: SourceMapUpdate) => {
    if (!sourceId) return;
    const existing = mapProfilesByDomainId.get(domainId);
    setSavingDomainId(domainId);
    setError(null);
    try {
      const response = await fetch(`/api/volatility-sources/${encodeURIComponent(sourceId)}/map`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainId,
          decisionType: updates.decisionType ?? existing?.decisionType ?? "complex",
          tailClass: updates.tailClass ?? existing?.tailClass ?? "unknown",
          notes: updates.notes ?? existing?.notes ?? "",
          stakesText: updates.stakesText ?? existing?.stakesText ?? "",
          risksText: updates.risksText ?? existing?.risksText ?? "",
          playersText: updates.playersText ?? existing?.playersText ?? "",
          lineageThreatText: updates.lineageThreatText ?? existing?.lineageThreatText ?? "",
          fragilityPosture: updates.fragilityPosture ?? existing?.fragilityPosture ?? "",
          vulnerabilitiesText: updates.vulnerabilitiesText ?? existing?.vulnerabilitiesText ?? "",
          hedgeText: updates.hedgeText ?? existing?.hedgeText ?? "",
          edgeText: updates.edgeText ?? existing?.edgeText ?? "",
          primaryCraftId: updates.primaryCraftId ?? existing?.primaryCraftId ?? "",
          heuristicsText: updates.heuristicsText ?? existing?.heuristicsText ?? "",
          avoidText: updates.avoidText ?? existing?.avoidText ?? ""
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to save source map profile.");
      }
      await onSourceMapSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save source map profile.");
    } finally {
      setSavingDomainId(null);
    }
  };

  const renderTextarea = (
    domainId: string,
    label: string,
    placeholder: string,
    value: string | undefined,
    updateKey: keyof SourceMapUpdate,
    minHeight = 88
  ) => (
    <label className="block text-xs text-[var(--color-text-muted)]">
      <span className="mb-1 block uppercase tracking-[0.16em] text-[10px] text-[var(--color-text-faint)]">{label}</span>
      <textarea
        className="khal-textarea"
        style={{ minHeight }}
        defaultValue={value ?? ""}
        placeholder={placeholder}
        disabled={savingDomainId === domainId}
        onBlur={(event) => void saveProfile(domainId, { [updateKey]: event.target.value } as SourceMapUpdate)}
      />
    </label>
  );

  const deriveStateOfAffairs = async (domainId: string, kind: "affair" | "interest") => {
    if (!sourceId) return;
    setCreatingKind(`${domainId}:${kind}`);
    setError(null);
    try {
      const response = await fetch(`/api/volatility-sources/${encodeURIComponent(sourceId)}/map/state-of-affairs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId, kind })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? `Failed to create ${kind}.`);
      }
      const payload = (await response.json()) as { route?: string };
      await onSourceMapSaved?.();
      if (payload.route) router.push(payload.route);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to create ${kind}.`);
    } finally {
      setCreatingKind(null);
    }
  };

  return (
    <section className="glass p-5 rounded-xl border border-white/10 mb-6">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Source WarGame Protocol</h3>
        <span className="text-[10px] font-mono text-zinc-500 uppercase">State of the Art</span>
      </div>
      <div className="text-lg font-semibold mb-3">{source?.name ?? "Select a source"}</div>
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Map Coverage</div>
          <div className="text-zinc-200">{completedMapCount}/{linkedDomains.length || 0} linked domains classified</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Current Step</div>
          <div className="text-zinc-200">{STEP_ORDER.find((step) => step.id === activeStep)?.label}</div>
          <div className="mt-1 text-zinc-400">{STEP_ORDER.find((step) => step.id === activeStep)?.prompt}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Means Rule</div>
          <div className="text-zinc-200">Quadrant determines admissible means; crafts and heuristics refine the posture.</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Linked Domains</div>
          <div className="text-zinc-200">{linkedDomains.map((item) => item.name).join(", ") || "None mapped"}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Affected Lineages</div>
          <div className="text-zinc-200">{affectedLineages.map((item) => item.level).join(", ") || "None mapped"}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Risk Rows</div>
          <div className="text-zinc-200">{sourceRisks.length}</div>
        </div>
      </div>
      {error ? <div className="mt-4 text-sm text-red-300">{error}</div> : null}
      <div className="mt-4 rounded-xl border border-white/10 bg-zinc-950/35 p-3">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">State of the Art Flow</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          {STEP_ORDER.map((step) => {
            const active = step.id === activeStep;
            const completed = stepCoverage[step.id];
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`rounded-lg border px-3 py-2 text-left transition ${
                  active
                    ? "border-blue-400/50 bg-blue-500/10"
                    : completed === linkedDomains.length && linkedDomains.length > 0
                      ? "border-emerald-400/30 bg-emerald-500/8"
                      : "border-white/10 bg-zinc-900/30 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-200">{step.label}</div>
                  <div className="text-[10px] text-zinc-500">{completed}/{linkedDomains.length || 0}</div>
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">{step.prompt}</div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {linkedDomains.map((domain) => {
          const profile = mapProfilesByDomainId.get(domain.id);
          const methodPosture = profile?.methodPosture ?? methodPostureForQuadrant(profile?.quadrant ?? "Q4");
          return (
            <div key={domain.id} className="khal-editor-block p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">Semantic Domain</div>
                  <div className="mt-1 text-sm font-semibold text-[var(--color-text-strong)]">{domain.name}</div>
                </div>
                {profile ? (
                  <div className="rounded-full border border-[var(--color-line-strong)] px-2 py-1 text-[10px] uppercase tracking-widest text-[var(--color-text-faint)]">
                    {profile.quadrant}
                  </div>
                ) : (
                  <div className="rounded-full border border-amber-500/40 px-2 py-1 text-[10px] uppercase tracking-widest text-amber-300">unmapped</div>
                )}
              </div>

              {activeStep === "map" ? (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="text-xs text-[var(--color-text-muted)]">
                      <span className="mb-1 block uppercase tracking-[0.16em] text-[10px] text-[var(--color-text-faint)]">Decision Type</span>
                      <select
                        className="khal-select"
                        value={profile?.decisionType ?? "complex"}
                        disabled={savingDomainId === domain.id}
                        onChange={(event) => void saveProfile(domain.id, { decisionType: event.target.value as SourceMapDecisionType })}
                      >
                        <option value="simple">Clear structure</option>
                        <option value="complex">Opaque structure</option>
                      </select>
                    </label>
                    <label className="text-xs text-[var(--color-text-muted)]">
                      <span className="mb-1 block uppercase tracking-[0.16em] text-[10px] text-[var(--color-text-faint)]">Tail Behavior</span>
                      <select
                        className="khal-select"
                        value={profile?.tailClass ?? "unknown"}
                        disabled={savingDomainId === domain.id}
                        onChange={(event) => void saveProfile(domain.id, { tailClass: event.target.value as SourceMapTailClass })}
                      >
                        <option value="thin">Stable variation</option>
                        <option value="fat">Explosive variation</option>
                        <option value="unknown">Unclear, treat cautiously</option>
                      </select>
                    </label>
                  </div>
                  {renderTextarea(
                    domain.id,
                    "Map Notes",
                    "Why is this domain clear or opaque? Why does the tail behave this way?",
                    profile?.notes,
                    "notes",
                    96
                  )}
                  <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4 text-xs">
                    {profile ? (
                      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] p-3">
                        <div className="uppercase tracking-widest text-[10px] text-[var(--color-text-faint)]">Quadrant Reading</div>
                        <div className="mt-1 text-[var(--color-text-strong)]">
                          {quadrantNarrative({ decisionType: profile.decisionType, tailClass: profile.tailClass, quadrant: profile.quadrant })}
                        </div>
                        <div className="mt-1 text-[var(--color-text-muted)]">
                          {decisionTypeLabel(profile.decisionType)} | {tailClassLabel(profile.tailClass)}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {[
                            { id: "Q1", title: "Q1", detail: "clear + stable" },
                            { id: "Q2", title: "Q2", detail: "clear + explosive" },
                            { id: "Q3", title: "Q3", detail: "opaque + stable" },
                            { id: "Q4", title: "Q4", detail: "opaque + explosive" }
                          ].map((quadrant) => (
                            <div
                              key={quadrant.id}
                              className={`rounded-lg border px-3 py-2 ${
                                profile.quadrant === quadrant.id ? "border-blue-400/50 bg-blue-500/10 text-blue-100" : "border-white/10 bg-zinc-950/30 text-zinc-400"
                              }`}
                            >
                              <div className="text-[11px] font-semibold uppercase tracking-widest">{quadrant.title}</div>
                              <div className="mt-1 text-[11px]">{quadrant.detail}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-amber-500/35 bg-amber-500/5 p-3 text-amber-200">
                        Complete decision type and tail behavior to derive the quadrant.
                      </div>
                    )}
                    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] p-3">
                      <div className="uppercase tracking-widest text-[10px] text-[var(--color-text-faint)]">Admissible Means</div>
                      <div className="mt-1 text-[var(--color-text-strong)]">{methodPosture}</div>
                      <div className="mt-3 text-[11px] text-[var(--color-text-muted)]">
                        This posture governs what kinds of methods are prudent before you move into stakes, hedge, and craft.
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeStep === "stone" ? (
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] p-3">
                    <div className="mb-3 text-[10px] uppercase tracking-widest text-[var(--color-text-faint)]">Asymmetry / Skin in the Game</div>
                    <div className="space-y-3">
                      {renderTextarea(domain.id, "Stakes", "What is at risk in this source-domain pair?", profile?.stakesText, "stakesText")}
                      {renderTextarea(domain.id, "Risks", "What can go wrong, and how does it propagate?", profile?.risksText, "risksText")}
                      {renderTextarea(domain.id, "Players / Fragilistas", "Who can worsen fragility through incentives, interventions, or naive action?", profile?.playersText, "playersText")}
                      {renderTextarea(domain.id, "Lineage at Threat", "Which lineage levels absorb the damage first if this breaks?", profile?.lineageThreatText, "lineageThreatText")}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] p-3">
                    <div className="mb-3 text-[10px] uppercase tracking-widest text-[var(--color-text-faint)]">Nonlinearity / Fragility</div>
                    <div className="space-y-3">
                      <label className="block text-xs text-[var(--color-text-muted)]">
                        <span className="mb-1 block uppercase tracking-[0.16em] text-[10px] text-[var(--color-text-faint)]">Fragility Posture</span>
                        <select
                          className="khal-select"
                          value={profile?.fragilityPosture ?? ""}
                          disabled={savingDomainId === domain.id}
                          onChange={(event) => void saveProfile(domain.id, { fragilityPosture: event.target.value })}
                        >
                          <option value="">Select posture</option>
                          <option value="fragile">Fragile / short volatility</option>
                          <option value="robust">Robust / bounded</option>
                          <option value="antifragile">Antifragile / long volatility</option>
                        </select>
                      </label>
                      {renderTextarea(domain.id, "Vulnerabilities", "Where is the system concave, exposed, or brittle?", profile?.vulnerabilitiesText, "vulnerabilitiesText")}
                    </div>
                  </div>
                </div>
              ) : null}

              {activeStep === "ends" ? (
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] p-3">
                    <div className="mb-3 text-[10px] uppercase tracking-widest text-[var(--color-text-faint)]">Barbell Ends</div>
                    <div className="space-y-3">
                      {renderTextarea(domain.id, "Hedge", "What obligation or robust baseline protects downside here?", profile?.hedgeText, "hedgeText")}
                      {renderTextarea(domain.id, "Edge", "What option or asymmetric upside is worth keeping alive?", profile?.edgeText, "edgeText")}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] p-3">
                    <div className="mb-3 text-[10px] uppercase tracking-widest text-[var(--color-text-faint)]">State of Affairs Bridge</div>
                    <div className="space-y-3 text-xs text-[var(--color-text-muted)]">
                      <div className="rounded-lg border border-white/10 bg-zinc-950/30 px-3 py-2">
                        <div className="uppercase tracking-widest text-[10px] text-[var(--color-text-faint)]">Affair Signal</div>
                        <div className="mt-1 text-[var(--color-text-strong)]">Hedge outputs become obligations that remove fragility and move toward robustness.</div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-zinc-950/30 px-3 py-2">
                        <div className="uppercase tracking-widest text-[10px] text-[var(--color-text-faint)]">Interest Signal</div>
                        <div className="mt-1 text-[var(--color-text-strong)]">Edge outputs become options that preserve convex upside beyond robustness.</div>
                      </div>
                      <div className="rounded-lg border border-dashed border-amber-500/35 bg-amber-500/5 px-3 py-2 text-amber-200">
                        State of Affairs comes after Ends. Do not open Affairs or Interests until the hedge and edge are explicit.
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeStep === "means" ? (
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] p-3">
                    <div className="mb-3 text-[10px] uppercase tracking-widest text-[var(--color-text-faint)]">Means Stack</div>
                    <div className="space-y-3">
                      <label className="block text-xs text-[var(--color-text-muted)]">
                        <span className="mb-1 block uppercase tracking-[0.16em] text-[10px] text-[var(--color-text-faint)]">Primary Craft</span>
                        <select
                          className="khal-select"
                          value={profile?.primaryCraftId ?? ""}
                          disabled={savingDomainId === domain.id}
                          onChange={(event) => void saveProfile(domain.id, { primaryCraftId: event.target.value })}
                        >
                          <option value="">Select craft</option>
                          {crafts.map((craft) => (
                            <option key={craft.id} value={craft.id}>
                              {craft.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      {renderTextarea(domain.id, "Heuristics", "What judgment rules, protocols, or practical rules should dominate here?", profile?.heuristicsText, "heuristicsText")}
                      {renderTextarea(domain.id, "Avoid", "Which methods, interventions, or bureaucratic habits should be avoided?", profile?.avoidText, "avoidText")}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] p-3">
                    <div className="mb-3 text-[10px] uppercase tracking-widest text-[var(--color-text-faint)]">Next Move</div>
                    <div className="space-y-3 text-xs text-[var(--color-text-muted)]">
                      <div className="rounded-lg border border-white/10 bg-zinc-950/30 px-3 py-2">
                        <div className="uppercase tracking-widest text-[10px] text-[var(--color-text-faint)]">State of the Art Exit</div>
                        <div className="mt-1 text-[var(--color-text-strong)]">Once means are explicit, convert hedge outputs into Affairs and edge outputs into Interests under State of Affairs.</div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-zinc-950/30 px-3 py-2">
                        <div className="uppercase tracking-widest text-[10px] text-[var(--color-text-faint)]">Operator Rule</div>
                        <div className="mt-1 text-[var(--color-text-strong)]">Be judicious about obligations and expeditious only where downside is capped.</div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-zinc-950/30 px-3 py-3">
                        <div className="uppercase tracking-widest text-[10px] text-[var(--color-text-faint)]">Generate State of Affairs</div>
                        <div className="mt-1 text-[var(--color-text-muted)]">
                          Use the current hedge to seed an Affair and the current edge to seed an Interest. You can generate both from the same source-domain pair.
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void deriveStateOfAffairs(domain.id, "affair")}
                            disabled={creatingKind === `${domain.id}:affair` || !profile?.hedgeText?.trim()}
                            className="khal-button-accent px-3 py-2 text-xs font-semibold disabled:opacity-50"
                          >
                            {profile?.affairId ? "Refresh Affair" : "Create Affair"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void deriveStateOfAffairs(domain.id, "interest")}
                            disabled={creatingKind === `${domain.id}:interest` || !profile?.edgeText?.trim()}
                            className="rounded-lg border border-white/10 bg-zinc-900/40 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/5 disabled:opacity-50"
                          >
                            {profile?.interestId ? "Refresh Interest" : "Create Interest"}
                          </button>
                        </div>
                        <div className="mt-3 space-y-2">
                          {profile?.affairId ? (
                            <button
                              type="button"
                              onClick={() => router.push(`/war-gaming/affair?target=${encodeURIComponent(profile.affairId!)}`)}
                              className="block text-left text-[11px] text-blue-300 hover:text-blue-200"
                            >
                              Open linked Affair
                            </button>
                          ) : null}
                          {profile?.interestId ? (
                            <button
                              type="button"
                              onClick={() => router.push(`/war-gaming/interest?target=${encodeURIComponent(profile.interestId!)}`)}
                              className="block text-left text-[11px] text-emerald-300 hover:text-emerald-200"
                            >
                              Open linked Interest
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
        {!linkedDomains.length ? (
          <div className="khal-editor-block p-4 text-sm text-[var(--color-text-muted)]">
            Link this source to at least one semantic domain before mapping the quadrant.
          </div>
        ) : null}
      </div>
    </section>
  );
}
