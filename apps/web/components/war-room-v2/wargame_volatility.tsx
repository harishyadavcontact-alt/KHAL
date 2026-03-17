import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { decisionTypeLabel, methodPostureForQuadrant, quadrantNarrative, tailClassLabel } from "../../lib/war-room/source-map";
import { buildSourceWarGameProtocol } from "../../lib/war-room/state-of-art";
import { Domain, LineageNodeDto, LineageRiskDto, SourceMapDecisionType, SourceMapProfileDto, SourceMapTailClass, VolatilitySourceDto } from "./types";
import type { WarGameDoctrineChain } from "../../lib/war-room/bootstrap";

interface WarGameVolatilityProps {
  sourceId?: string;
  sources: VolatilitySourceDto[];
  domains: Domain[];
  lineages: LineageNodeDto[];
  lineageRisks: LineageRiskDto[];
  crafts?: Array<{ id: string; name: string }>;
  responseLogic?: WarGameDoctrineChain[];
  onSourceMapSaved?: () => Promise<void> | void;
}

type SourceMapUpdate = Partial<
  Pick<
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
  >
>;

type SourceStepId = "source" | "domains" | "state" | "scenario" | "generate";

const SOURCE_STEPS: Array<{ id: SourceStepId; label: string }> = [
  { id: "source", label: "Source" },
  { id: "domains", label: "Domains" },
  { id: "state", label: "State of the Art" },
  { id: "scenario", label: "Scenario / Threat" },
  { id: "generate", label: "Generate" }
];

const isBlank = (value?: string | null) => !String(value ?? "").trim();

const splitLines = (value?: string | null) =>
  String(value ?? "")
    .split(/\n|;|\u2022/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);

const shortStateNarrative = (profile?: SourceMapProfileDto) => {
  if (!profile) return "Map the source-domain pair first. Posture and means should follow the field, not intuition.";
  const quadrant = profile.quadrant ?? "Q4";
  const posture = profile.methodPosture ?? methodPostureForQuadrant(quadrant);
  const stakes = profile.stakesText?.trim();
  const risks = profile.risksText?.trim();
  if (stakes && risks) return `${stakes}. The main break path is ${risks}. Current admissible posture: ${posture}.`;
  return quadrantNarrative({ decisionType: profile.decisionType, tailClass: profile.tailClass, quadrant });
};

function Pill({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "risk" | "watch" | "safe" }) {
  const toneClass =
    tone === "risk"
      ? "border-[rgba(224,90,58,0.28)] bg-[rgba(224,90,58,0.08)] text-[var(--color-danger)]"
      : tone === "watch"
        ? "border-[rgba(240,168,50,0.28)] bg-[rgba(240,168,50,0.08)] text-[var(--color-warning)]"
        : tone === "safe"
          ? "border-[rgba(48,224,176,0.24)] bg-[rgba(48,224,176,0.08)] text-[var(--color-success)]"
          : "border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] text-[var(--color-text-muted)]";
  return <div className={`inline-flex rounded-sm border px-3 py-1 text-[11px] uppercase tracking-[0.08em] font-[var(--font-mono)] ${toneClass}`}>{children}</div>;
}

const PanelLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4 flex items-center gap-3">
    <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">{children}</div>
    <div className="h-px flex-1 bg-[var(--color-editor-rule)]" />
  </div>
);

const AsidePanel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div
    className="khal-chamber p-5"
    style={{
      background: "linear-gradient(180deg, rgba(18,18,31,0.88), rgba(10,10,18,0.94))",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 10px 28px rgba(0,0,0,0.16)"
    }}
  >
    <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">{title}</div>
    {children}
  </div>
);

const FieldBox = ({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "risk" | "watch" | "safe" }) => {
  const toneClass =
    tone === "risk" ? "text-[var(--color-danger)]" : tone === "watch" ? "text-[var(--color-warning)]" : tone === "safe" ? "text-[var(--color-success)]" : "text-[var(--color-text)]";
  return (
    <div className="khal-subtle-panel px-4 py-3">
      <div className="text-[9px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">{label}</div>
      <div className={`mt-1 text-sm ${toneClass}`}>{value}</div>
    </div>
  );
};

export function WarGameVolatility({ sourceId, sources, domains, lineages, lineageRisks, crafts = [], responseLogic = [], onSourceMapSaved }: WarGameVolatilityProps) {
  const router = useRouter();
  const source = sources.find((item) => item.id === sourceId);
  const [savingDomainId, setSavingDomainId] = useState<string | null>(null);
  const [creatingKind, setCreatingKind] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<SourceStepId>("state");
  const [openScenarioIds, setOpenScenarioIds] = useState<Record<string, boolean>>({});

  const linkedDomainIds = useMemo(() => {
    const fromLinks = (source?.domains ?? []).map((link) => link.domainId);
    if (fromLinks.length > 0) return new Set(fromLinks);
    return new Set(domains.filter((domain) => domain.volatilitySourceId === sourceId).map((domain) => domain.id));
  }, [domains, source?.domains, sourceId]);

  const linkedDomains = useMemo(() => domains.filter((domain) => linkedDomainIds.has(domain.id)), [domains, linkedDomainIds]);
  const [activeDomainId, setActiveDomainId] = useState<string>(linkedDomains[0]?.id ?? "");
  const mapProfilesByDomainId = new Map((source?.mapProfiles ?? []).map((profile) => [profile.domainId, profile]));
  const protocol = useMemo(() => buildSourceWarGameProtocol({ sourceId, sources, domains, lineages, lineageRisks, crafts, responseLogic }), [crafts, domains, lineages, lineageRisks, responseLogic, sourceId, sources]);

  useEffect(() => {
    if (activeDomainId && linkedDomains.some((domain) => domain.id === activeDomainId)) return;
    setActiveDomainId(linkedDomains[0]?.id ?? "");
  }, [activeDomainId, linkedDomains]);

  const activeDomain = linkedDomains.find((domain) => domain.id === activeDomainId) ?? linkedDomains[0];
  const profile = activeDomain ? mapProfilesByDomainId.get(activeDomain.id) : undefined;
  const domainProtocol = activeDomain ? protocol.domains.find((item) => item.domainId === activeDomain.id) : undefined;
  const doctrineChains = domainProtocol?.doctrineChains ?? [];
  const methodPosture = profile?.methodPosture ?? methodPostureForQuadrant(profile?.quadrant ?? "Q4");
  const activeCraft = crafts.find((craft) => craft.id === profile?.primaryCraftId);
  const heuristics = splitLines(profile?.heuristicsText);
  const avoid = splitLines(profile?.avoidText);
  const stepCompletion = domainProtocol?.stepCompletion ?? { map: false, stone: false, ends: false, means: false };
  const stepState: Record<SourceStepId, { done: boolean }> = {
    source: { done: Boolean(source?.id) },
    domains: { done: linkedDomains.length > 0 },
    state: { done: stepCompletion.map && stepCompletion.stone && stepCompletion.ends && stepCompletion.means },
    scenario: { done: doctrineChains.length > 0 },
    generate: { done: Boolean(profile?.affairId || profile?.interestId) }
  };

  const lineageRows = (lineages ?? [])
    .map((lineage) => {
      const matching = lineageRisks.filter((risk) => risk.sourceId === sourceId && risk.domainId === activeDomain?.id && risk.lineageNodeId === lineage.id);
      const exposure = matching.reduce((sum, risk) => sum + Number(risk.exposure ?? 0), 0);
      return { id: lineage.id, label: lineage.name, exposure };
    })
    .filter((row) => row.exposure > 0)
    .slice(0, 5);

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

  const renderTextarea = (domainId: string, label: string, placeholder: string, value: string | undefined, updateKey: keyof SourceMapUpdate, minHeight = 92) => (
    <label className="block space-y-2">
      <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">{label}</span>
      <textarea className="khal-textarea px-4 py-3 text-sm" style={{ minHeight }} defaultValue={value ?? ""} placeholder={placeholder} disabled={savingDomainId === domainId} onBlur={(event) => void saveProfile(domainId, { [updateKey]: event.target.value } as SourceMapUpdate)} />
    </label>
  );

  if (!source || !activeDomain) {
    return <section className="mx-auto max-w-7xl px-4 py-6"><div className="khal-chamber p-8 text-sm text-[var(--color-text-muted)]">Link this source to at least one domain before gaming posture.</div></section>;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="khal-chamber overflow-hidden" style={{ boxShadow: "0 18px 40px rgba(0,0,0,0.24)" }}>
        <div className="border-b border-[var(--color-line)] px-8 py-7">
          <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-faint)] font-[var(--font-mono)]">
            War Gaming / <span className="text-[var(--color-text-muted)]">Source Chamber</span>
          </div>
          <div className="mt-2 khal-serif-hero text-4xl text-[var(--color-text-strong)]">
            {source.name} {"->"} {activeDomain.name}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill tone={profile?.tailClass === "fat" ? "risk" : "watch"}>{tailClassLabel(profile?.tailClass ?? "unknown")}</Pill>
            <Pill tone={profile?.decisionType === "complex" ? "watch" : "default"}>{decisionTypeLabel(profile?.decisionType ?? "complex")}</Pill>
            <Pill>{profile?.quadrant ?? "Q4"}</Pill>
            <Pill tone="safe">{methodPosture}</Pill>
          </div>
          {error ? <div className="mt-4 text-sm text-[var(--color-danger)]">{error}</div> : null}
        </div>

        <div className="border-b border-[var(--color-line)] px-8 overflow-x-auto">
          <div className="flex min-w-max items-center gap-0">
            {SOURCE_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                {index > 0 ? <div className="px-5 text-[11px] text-[var(--color-text-faint)] font-[var(--font-mono)]">{"->"}</div> : null}
                <button type="button" onClick={() => setActiveStep(step.id)} className={`khal-step-chip ${activeStep === step.id ? "text-[var(--color-text-strong)]" : ""}`}>
                  <span
                    className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border text-[10px] ${
                      stepState[step.id].done
                        ? "border-[var(--color-success)] bg-[var(--color-success)] text-[var(--color-accent-contrast)]"
                        : activeStep === step.id
                          ? "border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-accent-contrast)]"
                          : "border-[var(--color-line)] text-[var(--color-text-faint)]"
                    }`}
                  >
                    {stepState[step.id].done ? <Check size={12} /> : index + 1}
                  </span>
                  <span>{step.label}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-8 px-8 py-8 xl:grid-cols-[minmax(0,1fr)_250px]">
          <div className="min-w-0">
            {activeStep === "source" && (
              <div className="space-y-5">
                <PanelLabel>Source</PanelLabel>
                <div className="khal-chamber p-5" style={{ background: "linear-gradient(180deg, rgba(18,18,31,0.84), rgba(10,10,18,0.92))" }}>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Source of volatility</div>
                  <div className="mt-2 text-2xl text-[var(--color-text-strong)]">{source.name}</div>
                  <div className="mt-2 text-sm text-[var(--color-text-muted)]">
                    {"Volatility source selected for doctrine and downstream generation."}
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <FieldBox label="Domains" value={String(protocol.linkedDomainCount)} />
                    <FieldBox label="Open risks" value={String(protocol.riskCount)} tone="watch" />
                    <FieldBox label="Affected lineages" value={protocol.affectedLineages.join(", ") || "None"} />
                  </div>
                </div>
              </div>
            )}

            {activeStep === "domains" && (
              <div className="space-y-5">
                <PanelLabel>Affected domains</PanelLabel>
                <div className="grid gap-3 md:grid-cols-2">
                  {linkedDomains.map((domain) => {
                    const selected = domain.id === activeDomain.id;
                    const itemProfile = mapProfilesByDomainId.get(domain.id);
                    return (
                      <button key={domain.id} onClick={() => setActiveDomainId(domain.id)} className={`rounded-sm border p-4 text-left transition ${selected ? "border-[var(--color-accent)] bg-[rgba(240,168,50,0.08)]" : "border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] hover:bg-white/5"}`} style={{ boxShadow: selected ? "0 8px 20px rgba(0,0,0,0.14)" : "inset 0 1px 0 rgba(255,255,255,0.03)" }}>
                        <div className="text-base text-[var(--color-text-strong)]">{domain.name}</div>
                        <div className="mt-1 text-xs text-[var(--color-text-muted)]">{itemProfile?.quadrant ?? "Quadrant not mapped"}</div>
                        <div className="mt-3 text-sm text-[var(--color-text-muted)] line-clamp-2">{itemProfile?.stakesText ?? "Select this domain to inspect its doctrine surface."}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeStep === "state" && (
              <div className="space-y-8">
                <div>
                  <PanelLabel>Viewing domain</PanelLabel>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {linkedDomains.map((domain) => (
                      <button
                        key={domain.id}
                        onClick={() => setActiveDomainId(domain.id)}
                        className={`rounded-sm border px-3 py-1.5 text-[11px] uppercase tracking-[0.06em] font-[var(--font-mono)] transition ${
                          domain.id === activeDomain?.id
                            ? "border-[var(--color-text-strong)] bg-[var(--color-text-strong)] text-[var(--color-accent-contrast)]"
                            : "border-[var(--color-line)] text-[var(--color-text-faint)] hover:bg-[var(--color-editor-bg-soft)] hover:text-[var(--color-text)]"
                        }`}
                      >
                        {domain.name}
                      </button>
                    ))}
                  </div>
                  <p className="max-w-3xl text-[15px] italic leading-7 text-[var(--color-text-muted)]">{shortStateNarrative(profile)}</p>
                </div>

                <div>
                  <PanelLabel>Map - field classification</PanelLabel>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <FieldBox label="Decision type" value={profile ? decisionTypeLabel(profile.decisionType) : "Unmapped"} />
                    <FieldBox label="Tail behavior" value={profile ? tailClassLabel(profile.tailClass) : "Unmapped"} tone={profile?.tailClass === "fat" ? "risk" : profile?.tailClass === "unknown" ? "watch" : "default"} />
                    <FieldBox label="Quadrant" value={profile?.quadrant ?? "Unmapped"} />
                    <FieldBox label="Posture" value={methodPosture} tone="safe" />
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Decision Type</span>
                      <select className="khal-select px-4 py-3 text-sm" value={profile?.decisionType ?? "complex"} disabled={savingDomainId === activeDomain.id} onChange={(event) => void saveProfile(activeDomain.id, { decisionType: event.target.value as SourceMapDecisionType })}>
                        <option value="simple">Clear structure</option>
                        <option value="complex">Opaque structure</option>
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Tail Behavior</span>
                      <select className="khal-select px-4 py-3 text-sm" value={profile?.tailClass ?? "unknown"} disabled={savingDomainId === activeDomain.id} onChange={(event) => void saveProfile(activeDomain.id, { tailClass: event.target.value as SourceMapTailClass })}>
                        <option value="thin">Stable variation</option>
                        <option value="fat">Explosive variation</option>
                        <option value="unknown">Unclear, treat cautiously</option>
                      </select>
                    </label>
                  </div>
                  <div className="mt-4">{renderTextarea(activeDomain.id, "Map Notes", "Why is this source-domain pair clear or opaque? Why does the tail behave this way?", profile?.notes, "notes", 100)}</div>
                </div>

                <div>
                  <PanelLabel>Stone - consequence structure</PanelLabel>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="khal-chamber p-5">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Skin in the Game</div>
                      <div className="mt-4 space-y-4">
                        {renderTextarea(activeDomain.id, "Stakes", "What is at risk here?", profile?.stakesText, "stakesText")}
                        {renderTextarea(activeDomain.id, "Risks", "How can this break or spread?", profile?.risksText, "risksText")}
                        {renderTextarea(activeDomain.id, "Lineage", "Which lineage layer is threatened?", profile?.lineageThreatText, "lineageThreatText")}
                        {renderTextarea(activeDomain.id, "Players / Fragilistas", "Who can worsen fragility?", profile?.playersText, "playersText")}
                      </div>
                    </div>
                    <div className="khal-chamber p-5">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Philosopher&apos;s Stone</div>
                      <div className="mt-4 space-y-4">
                        <label className="space-y-2">
                          <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Fragility posture</span>
                          <select className="khal-select px-4 py-3 text-sm" value={profile?.fragilityPosture ?? ""} disabled={savingDomainId === activeDomain.id} onChange={(event) => void saveProfile(activeDomain.id, { fragilityPosture: event.target.value })}>
                            <option value="">Select posture</option>
                            <option value="fragile">Fragile / short volatility</option>
                            <option value="robust">Robust / bounded</option>
                            <option value="antifragile">Antifragile / long volatility</option>
                          </select>
                        </label>
                        {renderTextarea(activeDomain.id, "Vulnerabilities", "Where is the system brittle, concave, or exposed?", profile?.vulnerabilitiesText, "vulnerabilitiesText", 180)}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <PanelLabel>Ends - barbell posture</PanelLabel>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-sm border border-[rgba(224,90,58,0.22)] bg-[rgba(224,90,58,0.08)] p-5">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-danger)] font-[var(--font-mono)]">Hedge - downside protected</div>
                      <div className="mt-4">{renderTextarea(activeDomain.id, "Hedge", "What protects downside here?", profile?.hedgeText, "hedgeText", 170)}</div>
                    </div>
                    <div className="rounded-sm border border-[rgba(48,224,176,0.22)] bg-[rgba(48,224,176,0.08)] p-5">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-success)] font-[var(--font-mono)]">Edge - convex upside</div>
                      <div className="mt-4">{renderTextarea(activeDomain.id, "Edge", "What optionality is worth keeping alive?", profile?.edgeText, "edgeText", 170)}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <PanelLabel>Means - admissible methods</PanelLabel>
                  <div className="space-y-4">
                    <label className="space-y-2">
                      <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Primary Craft</span>
                      <select className="khal-select px-4 py-3 text-sm" value={profile?.primaryCraftId ?? ""} disabled={savingDomainId === activeDomain.id} onChange={(event) => void saveProfile(activeDomain.id, { primaryCraftId: event.target.value })}>
                        <option value="">Select craft</option>
                        {crafts.map((craft) => (
                          <option key={craft.id} value={craft.id}>
                            {craft.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="grid gap-4 xl:grid-cols-2">
                      {renderTextarea(activeDomain.id, "Heuristics", "What judgment rules should dominate here?", profile?.heuristicsText, "heuristicsText", 180)}
                      {renderTextarea(activeDomain.id, "Avoid", "Which methods should be excluded here?", profile?.avoidText, "avoidText", 180)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === "scenario" && (
              <div className="space-y-4">
                <PanelLabel>Scenario / Threat / Response</PanelLabel>
                {!doctrineChains.length ? (
                  <div className="rounded-sm border border-dashed border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] px-4 py-4 text-sm text-[var(--color-text-muted)]">
                    No doctrine chains are mapped yet for this source-domain pair. Add scenarios, threats, and responses under the relevant craft.
                  </div>
                ) : (
                  doctrineChains.slice(0, 4).map((chain) => {
                    const open = openScenarioIds[chain.id] ?? true;
                    return (
                      <div key={chain.id} className="rounded-sm border border-[var(--color-line)] bg-[var(--color-editor-bg)]" style={{ boxShadow: open ? "0 10px 24px rgba(0,0,0,0.16)" : "none" }}>
                        <button type="button" onClick={() => setOpenScenarioIds((prev) => ({ ...prev, [chain.id]: !open }))} className="flex w-full items-center gap-3 border-b border-[var(--color-line)] px-4 py-3 text-left">
                          <div className="rounded-sm border border-[rgba(240,168,50,0.3)] bg-[rgba(240,168,50,0.08)] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[var(--color-warning)] font-[var(--font-mono)]">{chain.craftName}</div>
                          <div className="flex-1 text-sm text-[var(--color-text)]">{chain.name}</div>
                          <ChevronDown size={14} className={`text-[var(--color-text-faint)] transition-transform ${open ? "rotate-180" : ""}`} />
                        </button>
                        {open ? (
                          <div className="space-y-3 px-4 py-4 text-sm text-[var(--color-text-muted)]">
                            {chain.objective ? <div>{"->"}</div> : null}
                            <div className="grid gap-3 md:grid-cols-3">
                              <FieldBox label="Scenarios" value={String(chain.scenarioCount)} />
                              <FieldBox label="Threats" value={String(chain.threatCount)} tone="risk" />
                              <FieldBox label="Responses" value={String(chain.responseCount)} tone="safe" />
                            </div>
                            <div className="flex items-start gap-3 border-t border-[var(--color-line)] pt-3">
                              <ArrowRight size={14} className="mt-1 text-[var(--color-success)]" />
                              <div>Pressure-test this source-domain posture through the mapped craft chain before generating downstream branches.</div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeStep === "generate" && (
              <div className="space-y-4">
                <PanelLabel>Generate - State of Affairs</PanelLabel>
                <p className="max-w-3xl text-[15px] italic leading-7 text-[var(--color-text-muted)]">
                  The hEdge - convex upside.
                </p>
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-sm border border-[rgba(224,90,58,0.22)] bg-[rgba(224,90,58,0.08)] p-5" style={{ boxShadow: "0 10px 24px rgba(0,0,0,0.12)" }}>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-danger)] font-[var(--font-mono)]">Affair from Hedge</div>
                    <div className="mt-3 text-sm text-[var(--color-text-muted)]">{profile?.hedgeText?.trim() || "Write the hedge first to generate an obligation."}</div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button type="button" onClick={() => void deriveStateOfAffairs(activeDomain.id, "affair")} disabled={creatingKind === `${activeDomain.id}:affair` || isBlank(profile?.hedgeText)} className="rounded-sm border border-[rgba(224,90,58,0.26)] bg-[var(--color-danger)] px-4 py-2 text-[11px] uppercase tracking-[0.08em] text-white font-[var(--font-mono)] transition hover:opacity-90 disabled:opacity-50">
                        {profile?.affairId ? "Refresh Affair" : "Create Affair"}
                      </button>
                      {profile?.affairId ? <button type="button" onClick={() => router.push(`/war-gaming/affair?target=${encodeURIComponent(profile.affairId!)}`)} className="rounded-sm border border-[var(--color-line)] bg-[var(--color-editor-bg)] px-4 py-2 text-[11px] uppercase tracking-[0.08em] text-[var(--color-text)] font-[var(--font-mono)]">Open Affair</button> : null}
                    </div>
                  </div>
                  <div className="rounded-sm border border-[rgba(48,224,176,0.22)] bg-[rgba(48,224,176,0.08)] p-5" style={{ boxShadow: "0 10px 24px rgba(0,0,0,0.12)" }}>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-success)] font-[var(--font-mono)]">Interest from Edge</div>
                    <div className="mt-3 text-sm text-[var(--color-text-muted)]">{profile?.edgeText?.trim() || "Write the edge first to generate an option."}</div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button type="button" onClick={() => void deriveStateOfAffairs(activeDomain.id, "interest")} disabled={creatingKind === `${activeDomain.id}:interest` || isBlank(profile?.edgeText)} className="rounded-sm border border-[rgba(48,224,176,0.26)] bg-[var(--color-success)] px-4 py-2 text-[11px] uppercase tracking-[0.08em] text-[var(--color-accent-contrast)] font-[var(--font-mono)] transition hover:opacity-90 disabled:opacity-50">
                        {profile?.interestId ? "Refresh Interest" : "Create Interest"}
                      </button>
                      {profile?.interestId ? <button type="button" onClick={() => router.push(`/war-gaming/interest?target=${encodeURIComponent(profile.interestId!)}`)} className="rounded-sm border border-[var(--color-line)] bg-[var(--color-editor-bg)] px-4 py-2 text-[11px] uppercase tracking-[0.08em] text-[var(--color-text)] font-[var(--font-mono)]">Open Interest</button> : null}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <AsidePanel title="Active craft">
              <div className="mt-2 text-xl text-[var(--color-text-strong)]">{activeCraft?.name ?? "No craft selected"}</div>
              <div className="mt-2 text-sm text-[var(--color-text-muted)]">{activeCraft ? "Selected means for this source-domain regime." : "Choose a craft under Means to make doctrine chains explicit."}</div>
            </AsidePanel>

            <AsidePanel title="Heuristics">
              <div className="mt-3 space-y-2">
                {heuristics.length ? heuristics.map((item, index) => <div key={`${item}-${index}`} className="flex gap-2 text-sm text-[var(--color-text-muted)]"><div className="mt-[6px] text-[10px] text-[var(--color-text-faint)] font-[var(--font-mono)]">-</div><div>{item}</div></div>) : <div className="text-sm text-[var(--color-text-muted)]">No heuristics written yet.</div>}
              </div>
            </AsidePanel>

            <AsidePanel title="Avoid">
              <div className="mt-3 space-y-2">
                {avoid.length ? avoid.map((item, index) => <div key={`${item}-${index}`} className="flex gap-2 text-sm text-[var(--color-danger)]"><div className="mt-[4px] text-[11px] font-[var(--font-mono)]">x</div><div>{item}</div></div>) : <div className="text-sm text-[var(--color-text-muted)]">No avoid list written yet.</div>}
              </div>
            </AsidePanel>

            <AsidePanel title="Lineage exposure">
              <div className="mt-3 space-y-2">
                {lineageRows.length ? lineageRows.map((row) => (
                  <div key={row.id} className="flex items-center gap-3">
                    <div className="w-16 text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-faint)] font-[var(--font-mono)]">{row.label}</div>
                    <div className="h-[3px] flex-1 rounded bg-[var(--color-line)]">
                      <div className="h-[3px] rounded bg-[var(--color-danger)]" style={{ width: `${Math.min(100, row.exposure)}%` }} />
                    </div>
                  </div>
                )) : <div className="text-sm text-[var(--color-text-muted)]">No lineage exposure recorded for this source-domain pair.</div>}
              </div>
            </AsidePanel>
          </aside>
        </div>
      </div>
    </section>
  );
}


