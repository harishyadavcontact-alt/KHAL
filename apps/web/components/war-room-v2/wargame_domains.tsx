import React, { useMemo, useState } from "react";
import { ArrowRight, Briefcase, Shield, Sparkles } from "lucide-react";
import { Affair, Craft, Domain, Interest, LineageRiskDto, StateOfArtProjection, VolatilitySourceDto } from "./types";
import { projectionsByDomain } from "../../lib/war-room/state-of-art";

interface WarGameDomainsProps {
  domainId?: string;
  domains: Domain[];
  sources: VolatilitySourceDto[];
  crafts: Craft[];
  affairs: Affair[];
  interests: Interest[];
  lineageRisks: LineageRiskDto[];
}

type DomainStepId = "state" | "affairs" | "lineage";

const DOMAIN_STEPS: Array<{ id: DomainStepId; label: string }> = [
  { id: "state", label: "State of the Art" },
  { id: "affairs", label: "State of Affairs" },
  { id: "lineage", label: "Lineage Register" }
];

function uniqueText(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}

function doctrineRows(
  projections: StateOfArtProjection[],
  selector: (projection: StateOfArtProjection) => string | undefined
) {
  return projections
    .map((projection) => ({
      sourceName: projection.sourceName,
      value: selector(projection)?.trim()
    }))
    .filter((row): row is { sourceName: string; value: string } => Boolean(row.value));
}

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">{children}</div>
      <div className="h-px flex-1 bg-[var(--color-editor-rule)]" />
    </div>
  );
}

function FieldBox({ label, rows, empty, tone = "default" }: { label: string; rows: Array<{ sourceName: string; value: string }>; empty: string; tone?: "default" | "risk" | "safe" | "watch" }) {
  const toneClass =
    tone === "risk"
      ? "text-[var(--color-danger)]"
      : tone === "safe"
        ? "text-[var(--color-success)]"
        : tone === "watch"
          ? "text-[var(--color-warning)]"
          : "text-[var(--color-text)]";

  return (
    <div className="khal-subtle-panel px-4 py-3">
      <div className="text-[9px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">{label}</div>
      <div className="mt-3 space-y-2 text-sm">
        {rows.length ? (
          rows.map((row) => (
            <div key={`${label}-${row.sourceName}`} className="border-b border-[var(--color-line-hairline)] pb-2 last:border-b-0 last:pb-0">
              <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-faint)] font-[var(--font-mono)]">{row.sourceName}</div>
              <div className={`mt-1 ${toneClass}`}>{row.value}</div>
            </div>
          ))
        ) : (
          <div className="text-[var(--color-text-muted)]">{empty}</div>
        )}
      </div>
    </div>
  );
}

function EntityCard({
  title,
  subtitle,
  tone = "default"
}: {
  title: string;
  subtitle: string;
  tone?: "default" | "affair" | "interest";
}) {
  const accent =
    tone === "affair"
      ? "border-[rgba(224,90,58,0.22)] bg-[rgba(224,90,58,0.08)]"
      : tone === "interest"
        ? "border-[rgba(48,224,176,0.22)] bg-[rgba(48,224,176,0.08)]"
        : "border-[var(--color-line)] bg-[var(--color-editor-bg-soft)]";

  return (
    <div className={`rounded-sm border p-4 ${accent}`}>
      <div className="text-base text-[var(--color-text-strong)]">{title}</div>
      <div className="mt-2 text-sm text-[var(--color-text-muted)]">{subtitle}</div>
    </div>
  );
}

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

export function WarGameDomains({ domainId, domains, sources, crafts, affairs, interests, lineageRisks }: WarGameDomainsProps) {
  const domain = domains.find((item) => item.id === domainId);
  const projections = useMemo(() => projectionsByDomain({ sources, domains, crafts }).get(domainId ?? "") ?? [], [crafts, domainId, domains, sources]);
  const linkedSourceNames = useMemo(
    () => uniqueText([...projections.map((item) => item.sourceName), domain?.volatilitySourceName, domain?.volatility, domain?.volatilitySource]),
    [domain?.volatility, domain?.volatilitySource, domain?.volatilitySourceName, projections]
  );

  const [activeStep, setActiveStep] = useState<DomainStepId>("state");
  const [lineageScope, setLineageScope] = useState<string>("all");

  const domainAffairs = affairs.filter((affair) => affair.domainId === domainId || affair.context?.associatedDomains?.includes(domainId ?? ""));
  const domainInterests = interests.filter((interest) => interest.domainId === domainId);
  const domainRisks = lineageRisks.filter((risk) => risk.domainId === domainId);
  const lineageOptions = Array.from(new Set(domainRisks.map((risk) => risk.lineageNodeId)));
  const scopedRisks = domainRisks.filter((risk) => lineageScope === "all" || risk.lineageNodeId === lineageScope);

  const stakesRows = doctrineRows(projections, (projection) => projection.stone.asymmetry.skinInTheGame.stakes);
  const risksRows = doctrineRows(projections, (projection) => projection.stone.asymmetry.skinInTheGame.risks);
  const oddsRows = doctrineRows(projections, (projection) => projection.stone.asymmetry.skinInTheGame.odds);
  const oddsBandRows = doctrineRows(projections, (projection) => projection.stone.asymmetry.skinInTheGame.oddsBand);
  const repeatRateRows = doctrineRows(projections, (projection) => projection.stone.asymmetry.skinInTheGame.repeatRate);
  const triggerRows = doctrineRows(projections, (projection) => projection.stone.asymmetry.skinInTheGame.triggerCondition);
  const survivalRows = doctrineRows(projections, (projection) => projection.stone.asymmetry.skinInTheGame.survivalImpact);
  const lineageRows = doctrineRows(projections, (projection) => projection.stone.asymmetry.skinInTheGame.lineage);
  const fragilityRows = doctrineRows(
    projections,
    (projection) => projection.stone.nonLinearity.fragilityPosture ?? projection.stone.nonLinearity.shortVolatilityLabel
  );
  const vulnerabilityRows = doctrineRows(projections, (projection) => projection.stone.nonLinearity.vulnerabilities);
  const hedgeRows = doctrineRows(projections, (projection) => projection.ends.hedge);
  const edgeRows = doctrineRows(projections, (projection) => projection.ends.edge);
  const craftRows = doctrineRows(projections, (projection) => projection.means.primaryCraftName ?? projection.means.primaryCraftId);
  const heuristicRows = doctrineRows(projections, (projection) => projection.means.heuristics);
  const topCraftName = craftRows[0]?.value ?? "No craft linked";

  if (!domain) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="khal-chamber p-8 text-sm text-[var(--color-text-muted)]">Select a domain to inspect its current decision structure.</div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="khal-chamber overflow-hidden" style={{ boxShadow: "0 18px 40px rgba(0,0,0,0.24)" }}>
        <div className="border-b border-[var(--color-line)] px-8 py-7">
          <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-faint)] font-[var(--font-mono)]">
            War Gaming / <span className="text-[var(--color-text-muted)]">Domain Chamber</span>
          </div>
          <div className="mt-2 khal-serif-hero text-4xl text-[var(--color-text-strong)]">{domain.name}</div>
          <div className="mt-3 max-w-3xl text-sm text-[var(--color-text-muted)]">
            State of the Art shows what kind of domain you are in. State of Affairs shows what obligations and options already follow from it.
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="inline-flex rounded-sm border border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] px-3 py-1 text-[11px] uppercase tracking-[0.08em] font-[var(--font-mono)] text-[var(--color-text-muted)]">
              Sources {linkedSourceNames.length}
            </div>
            <div className="inline-flex rounded-sm border border-[rgba(224,90,58,0.22)] bg-[rgba(224,90,58,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.08em] font-[var(--font-mono)] text-[var(--color-danger)]">
              Affairs {domainAffairs.length}
            </div>
            <div className="inline-flex rounded-sm border border-[rgba(48,224,176,0.22)] bg-[rgba(48,224,176,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.08em] font-[var(--font-mono)] text-[var(--color-success)]">
              Interests {domainInterests.length}
            </div>
            <div className="inline-flex rounded-sm border border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] px-3 py-1 text-[11px] uppercase tracking-[0.08em] font-[var(--font-mono)] text-[var(--color-text-muted)]">
              Lineage lens {lineageScope === "all" ? "All" : lineageScope}
            </div>
          </div>
        </div>

        <div className="border-b border-[var(--color-line)] px-8 overflow-x-auto">
          <div className="flex min-w-max items-center gap-0">
            {DOMAIN_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                {index > 0 ? <div className="px-5 text-[11px] text-[var(--color-text-faint)] font-[var(--font-mono)]">{"->"}</div> : null}
                <button
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={`khal-step-chip ${activeStep === step.id ? "text-[var(--color-text-strong)]" : ""}`}
                >
                  <span
                    className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border text-[10px] ${
                      activeStep === step.id
                        ? "border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-accent-contrast)]"
                        : "border-[var(--color-line)] text-[var(--color-text-faint)]"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span>{step.label}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-8 px-8 py-8 xl:grid-cols-[minmax(0,1fr)_250px]">
          <div className="min-w-0">
            {activeStep === "state" && (
              <div className="space-y-8">
                <div>
                  <PanelLabel>State of the Art</PanelLabel>
                  <p className="max-w-3xl text-[15px] italic leading-7 text-[var(--color-text-muted)]">
                    Read this domain through the sources currently mapped into it. Skin in the Game and fragility come first. Hedge and edge follow after that.
                  </p>
                </div>

                  <div>
                    <PanelLabel>Skin in the Game</PanelLabel>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
                      <FieldBox label="Stakes" rows={stakesRows} empty="No stakes written yet." />
                      <FieldBox label="Risks" rows={risksRows} empty="No risks written yet." tone="risk" />
                      <FieldBox label="Odds" rows={oddsRows} empty="No odds profile written yet." tone="watch" />
                      <FieldBox label="Odds band" rows={oddsBandRows} empty="No odds band set." tone="watch" />
                      <FieldBox label="Repeat rate" rows={repeatRateRows} empty="No exposure cadence written yet." tone="watch" />
                      <FieldBox label="Trigger" rows={triggerRows} empty="No trigger condition written yet." tone="watch" />
                      <FieldBox label="Survival" rows={survivalRows} empty="No survival impact set." tone="risk" />
                      <FieldBox label="Lineage" rows={lineageRows} empty="No lineage pressure written yet." tone="watch" />
                    </div>
                  </div>

                <div>
                  <PanelLabel>Philosopher's Stone</PanelLabel>
                  <div className="grid gap-3 md:grid-cols-2">
                    <FieldBox label="Fragility" rows={fragilityRows} empty="No fragility posture mapped yet." tone="risk" />
                    <FieldBox label="Vulnerabilities" rows={vulnerabilityRows} empty="No vulnerabilities mapped yet." />
                  </div>
                </div>

                <div>
                  <PanelLabel>Ends</PanelLabel>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-sm border border-[rgba(224,90,58,0.22)] bg-[rgba(224,90,58,0.08)] p-5">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-danger)] font-[var(--font-mono)]">Hedge</div>
                      <div className="mt-4 space-y-3 text-sm">
                        {hedgeRows.length ? hedgeRows.map((row) => <div key={`hedge-${row.sourceName}`}><div className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-faint)] font-[var(--font-mono)]">{row.sourceName}</div><div className="mt-1 text-[var(--color-text)]">{row.value}</div></div>) : <div className="text-[var(--color-text-muted)]">No hedge written yet.</div>}
                      </div>
                    </div>
                    <div className="rounded-sm border border-[rgba(48,224,176,0.22)] bg-[rgba(48,224,176,0.08)] p-5">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-success)] font-[var(--font-mono)]">Edge</div>
                      <div className="mt-4 space-y-3 text-sm">
                        {edgeRows.length ? edgeRows.map((row) => <div key={`edge-${row.sourceName}`}><div className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-faint)] font-[var(--font-mono)]">{row.sourceName}</div><div className="mt-1 text-[var(--color-text)]">{row.value}</div></div>) : <div className="text-[var(--color-text-muted)]">No edge written yet.</div>}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <PanelLabel>Means</PanelLabel>
                  <div className="grid gap-3 md:grid-cols-2">
                    <FieldBox label="Craft" rows={craftRows} empty="No primary craft linked yet." tone="safe" />
                    <FieldBox label="Heuristics" rows={heuristicRows} empty="No heuristics mapped yet." />
                  </div>
                </div>
              </div>
            )}

            {activeStep === "affairs" && (
              <div className="space-y-8">
                <div>
                  <PanelLabel>State of Affairs</PanelLabel>
                  <p className="max-w-3xl text-[15px] italic leading-7 text-[var(--color-text-muted)]">
                    Affairs are obligations that remove fragility. Interests are options that keep or create convex upside.
                  </p>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="space-y-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-danger)] font-[var(--font-mono)]">Affairs</div>
                    {domainAffairs.length ? (
                      domainAffairs.map((affair) => (
                        <EntityCard key={affair.id} title={affair.title} subtitle={affair.status ?? "unknown"} tone="affair" />
                      ))
                    ) : (
                      <EntityCard title="No affairs linked" subtitle="This domain does not yet have a registered obligation." />
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-success)] font-[var(--font-mono)]">Interests</div>
                    {domainInterests.length ? (
                      domainInterests.map((interest) => (
                        <EntityCard key={interest.id} title={interest.title} subtitle={interest.status ?? "unknown"} tone="interest" />
                      ))
                    ) : (
                      <EntityCard title="No interests linked" subtitle="This domain does not yet have a registered option." />
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeStep === "lineage" && (
              <div className="space-y-8">
                <div>
                  <PanelLabel>Lineage Register</PanelLabel>
                  <p className="max-w-3xl text-[15px] italic leading-7 text-[var(--color-text-muted)]">
                    Lineage is a lens on consequence scale. Use the selector on the right to tighten the register to one threatened layer if needed.
                  </p>
                </div>
                <div className="space-y-3">
                  {scopedRisks.length ? (
                    scopedRisks.map((risk) => (
                      <div key={risk.id} className="rounded-sm border border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] p-4" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-base text-[var(--color-text-strong)]">{risk.title}</div>
                            <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                              {risk.lineageNodeId} | actor {risk.actorType ?? "unknown"} | status {risk.status}
                            </div>
                          </div>
                          <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-danger)] font-[var(--font-mono)]">
                            fragility {risk.fragilityScore ?? "?"}
                          </div>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm text-[var(--color-text-muted)]">
                          <div>Exposure {risk.exposure ?? "?"}</div>
                          <div>Dependency {risk.dependency ?? "?"}</div>
                          <div>Irreversibility {risk.irreversibility ?? "?"}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-sm border border-dashed border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] px-4 py-4 text-sm text-[var(--color-text-muted)]">
                      No lineage risks are mapped for the current scope.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <AsidePanel title="Sources in domain">
              <div className="mt-3 space-y-2">
                {linkedSourceNames.length ? (
                  linkedSourceNames.map((name) => (
                    <div key={name} className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]">
                      <ArrowRight size={13} className="mt-1 text-[var(--color-accent)]" />
                      <span>{name}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-[var(--color-text-muted)]">No linked source names available.</div>
                )}
              </div>
            </AsidePanel>

            <AsidePanel title="Current lens">
              <div className="mt-3">
                <label className="block text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Lineage scope</label>
                <select
                  value={lineageScope}
                  onChange={(event) => setLineageScope(event.target.value)}
                  className="khal-select mt-2 px-4 py-3 text-sm"
                >
                  <option value="all">All lineage levels</option>
                  {lineageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4 text-sm text-[var(--color-text-muted)]">
                Active craft signal: <span className="text-[var(--color-text-strong)]">{topCraftName}</span>
              </div>
            </AsidePanel>

            <AsidePanel title="Reading order">
              <div className="mt-3 space-y-3 text-sm text-[var(--color-text-muted)]">
                <div className="flex items-start gap-3">
                  <Shield size={14} className="mt-1 text-[var(--color-danger)]" />
                  <span>Read the domain as consequence structure first, not as a task list.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Briefcase size={14} className="mt-1 text-[var(--color-danger)]" />
                  <span>Affairs show current obligations already generated from hedge logic.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles size={14} className="mt-1 text-[var(--color-success)]" />
                  <span>Interests show surviving option space after downside protection.</span>
                </div>
              </div>
            </AsidePanel>
          </aside>
        </div>
      </div>
    </section>
  );
}
