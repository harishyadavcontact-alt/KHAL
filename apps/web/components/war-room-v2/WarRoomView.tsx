import React, { useMemo } from "react";
import { ArrowRight, Briefcase, Compass, Network, Shield, Sparkles, Swords } from "lucide-react";
import { Craft, Domain, Interest, VolatilitySourceDto, Affair } from "./types";
import { projectionsByDomain } from "../../lib/war-room/state-of-art";

type DomainSummary = {
  domain: Domain;
  sourceCount: number;
  affairCount: number;
  interestCount: number;
  craftNames: string[];
};

function distinctNonEmpty(values: Array<string | undefined>): string[] {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function summarizeDomain(
  domain: Domain,
  sources: VolatilitySourceDto[],
  crafts: Craft[],
  affairs: Affair[],
  interests: Interest[]
): DomainSummary {
  const projectionMap = projectionsByDomain({
    sources,
    domains: [domain],
    crafts: crafts.map((craft) => ({ id: craft.id, name: craft.name }))
  });
  const projections = projectionMap.get(domain.id) ?? [];
  return {
    domain,
    sourceCount: projections.length,
    affairCount: affairs.filter((affair) => affair.domainId === domain.id).length,
    interestCount: interests.filter((interest) => interest.domainId === domain.id).length,
    craftNames: distinctNonEmpty(projections.map((projection) => projection.means.primaryCraftName))
  };
}

function sourceLinkedCrafts(source: VolatilitySourceDto, crafts: Craft[]): string[] {
  const craftNames = (source.mapProfiles ?? [])
    .map((profile) => crafts.find((craft) => craft.id === profile.primaryCraftId)?.name)
    .filter(Boolean) as string[];
  return distinctNonEmpty(craftNames);
}

function sourceLinkedAffairs(source: VolatilitySourceDto): number {
  return (source.mapProfiles ?? []).filter((profile) => Boolean(profile.affairId)).length;
}

function sourceLinkedInterests(source: VolatilitySourceDto): number {
  return (source.mapProfiles ?? []).filter((profile) => Boolean(profile.interestId)).length;
}

function craftActiveDomains(craft: Craft, sources: VolatilitySourceDto[]): number {
  const ids = new Set(
    sources.flatMap((source) =>
      (source.mapProfiles ?? [])
        .filter((profile) => profile.primaryCraftId === craft.id)
        .map((profile) => profile.domainId)
    )
  );
  return ids.size;
}

function craftAdmissibilityHint(craft: Craft): string {
  const protocolCount = craft.knowledge?.protocols.length ?? 0;
  const heuristicCount = craft.knowledge?.heuristics.length ?? 0;
  const wargameCount = craft.knowledge?.wargames.length ?? 0;
  if (protocolCount > 0) return `${protocolCount} protocols`;
  if (heuristicCount > 0) return `${heuristicCount} heuristics`;
  if (wargameCount > 0) return `${wargameCount} wargames`;
  return "Doctrine not yet explicit";
}

function SectionHeader({
  icon: Icon,
  title,
  tone
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={15} className={tone} />
      <h3 className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-text-faint)]">{title}</h3>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line-hairline)] py-2 last:border-b-0">
      <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">{label}</div>
      <div className="text-sm text-[var(--color-text)]">{value}</div>
    </div>
  );
}

function SurfaceCard({
  children,
  accent = "var(--color-line)"
}: {
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      className="w-full rounded-xl border p-4 text-left transition hover:bg-white/5"
      style={{
        borderColor: "var(--color-line)",
        background: "linear-gradient(180deg, rgba(18,18,31,0.82), rgba(10,10,18,0.9))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 26px rgba(0,0,0,0.14)"
      }}
    >
      <div className="mb-3 h-px w-12" style={{ background: accent, opacity: 0.65 }} />
      {children}
    </div>
  );
}

export function WarRoomView({
  sources,
  domains,
  crafts,
  affairs,
  interests,
  onDomainClick,
  onOpenSource,
  onOpenCraft
}: {
  sources: VolatilitySourceDto[];
  domains: Domain[];
  crafts: Craft[];
  affairs: Affair[];
  interests: Interest[];
  onDomainClick: (domain: Domain) => void;
  onOpenSource: (sourceId: string) => void;
  onOpenCraft: (craftId: string) => void;
}) {
  const domainSummaries = useMemo(
    () => domains.map((domain) => summarizeDomain(domain, sources, crafts, affairs, interests)),
    [affairs, crafts, domains, interests, sources]
  );

  const sourceSummaries = useMemo(
    () =>
      sources.map((source) => ({
        source,
        linkedCrafts: sourceLinkedCrafts(source, crafts),
        linkedAffairs: sourceLinkedAffairs(source),
        linkedInterests: sourceLinkedInterests(source)
      })),
    [crafts, sources]
  );

  const craftSummaries = useMemo(
    () =>
      crafts.map((craft) => ({
        craft,
        activeDomainCount: craftActiveDomains(craft, sources),
        heuristicCount: craft.knowledge?.heuristics.length ?? craft.heuristics.length,
        protocolCount: craft.knowledge?.protocols.length ?? 0,
        hint: craftAdmissibilityHint(craft)
      })),
    [crafts, sources]
  );

  const topSource = sourceSummaries[0];
  const topDomain = domainSummaries[0];
  const topCraft = craftSummaries[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-[var(--color-line)] pb-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-faint)] font-[var(--font-mono)]">War Room</div>
          <h2 className="khal-serif-hero mt-2 text-4xl text-[var(--color-text-strong)]">See the decision</h2>
          <p className="mt-3 max-w-3xl text-sm text-[var(--color-text-muted)]">
            Volatility sources create pressure. Domains show where it lands. Crafts show what means exist before moving into War Gaming.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="khal-subtle-panel px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Sources</div>
            <div className="mt-1 text-lg text-[var(--color-text)]">{sources.length}</div>
          </div>
          <div className="khal-subtle-panel px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Domains</div>
            <div className="mt-1 text-lg text-[var(--color-text)]">{domains.length}</div>
          </div>
          <div className="khal-subtle-panel px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Crafts</div>
            <div className="mt-1 text-lg text-[var(--color-text)]">{crafts.length}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr_1fr_280px]">
        <section className="khal-chamber p-5">
          <SectionHeader icon={Compass} title="Sources of Volatility" tone="text-[var(--color-accent)]" />
          <div className="mt-4 space-y-3">
            {sourceSummaries.map(({ source, linkedCrafts, linkedAffairs, linkedInterests }) => (
              <button key={source.id} onClick={() => onOpenSource(source.id)} className="w-full text-left">
                <SurfaceCard accent="var(--color-accent)">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">
                      {source.code}
                    </div>
                    <div className="mt-1 text-base text-[var(--color-text-strong)]">{source.name}</div>
                  </div>
                  <ArrowRight size={14} className="mt-1 text-[var(--color-text-faint)]" />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[var(--color-text-muted)]">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Domains</div>
                    <div className="mt-1 text-[var(--color-text)]">{source.domainCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Affairs</div>
                    <div className="mt-1 text-[var(--color-text)]">{linkedAffairs}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Interests</div>
                    <div className="mt-1 text-[var(--color-text)]">{linkedInterests}</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-[var(--color-text-muted)]">
                  {linkedCrafts.length ? `Means in play: ${linkedCrafts.slice(0, 3).join(" | ")}` : "No primary craft mapped yet"}
                </div>
                </SurfaceCard>
              </button>
            ))}
          </div>
        </section>

        <section className="khal-chamber p-5">
          <SectionHeader icon={Network} title="Domains" tone="text-[var(--color-accent-cool)]" />
          <div className="mt-4 space-y-3">
            {domainSummaries.map(({ domain, sourceCount, affairCount, interestCount, craftNames }) => (
              <button key={domain.id} onClick={() => onDomainClick(domain)} className="w-full text-left">
                <SurfaceCard accent="var(--color-accent-cool)">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base text-[var(--color-text-strong)]">{domain.name}</div>
                    <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {domain.volatilitySourceName ?? domain.volatilitySource ?? domain.volatility ?? "Source not mapped"}
                    </div>
                  </div>
                  <ArrowRight size={14} className="mt-1 text-[var(--color-text-faint)]" />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[var(--color-text-muted)]">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Sources</div>
                    <div className="mt-1 text-[var(--color-text)]">{sourceCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Affairs</div>
                    <div className="mt-1 text-[var(--color-text)]">{affairCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Interests</div>
                    <div className="mt-1 text-[var(--color-text)]">{interestCount}</div>
                  </div>
                </div>
                <div className="mt-3 border-t border-[var(--color-line-hairline)] pt-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">State of the Art</div>
                  <div className="mt-1 text-sm text-[var(--color-text-muted)] line-clamp-2">
                    {domain.stakesText ?? "Stakes and risk posture are not written yet."}
                  </div>
                </div>
                <div className="mt-3 text-xs text-[var(--color-text-muted)]">
                  {craftNames.length ? `Linked crafts: ${craftNames.slice(0, 3).join(" | ")}` : "No primary craft linked yet"}
                </div>
                </SurfaceCard>
              </button>
            ))}
          </div>
        </section>

        <section className="khal-chamber p-5">
          <SectionHeader icon={Swords} title="Crafts" tone="text-[var(--color-success)]" />
          <div className="mt-4 space-y-3">
            {craftSummaries.map(({ craft, activeDomainCount, heuristicCount, protocolCount, hint }) => (
              <button key={craft.id} onClick={() => onOpenCraft(craft.id)} className="w-full text-left">
                <SurfaceCard accent="var(--color-success)">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base text-[var(--color-text-strong)]">{craft.name}</div>
                    <div className="mt-1 text-xs text-[var(--color-text-muted)] line-clamp-2">
                      {craft.description || "Means, heuristics, and doctrine chains for admissible action."}
                    </div>
                  </div>
                  <ArrowRight size={14} className="mt-1 text-[var(--color-text-faint)]" />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[var(--color-text-muted)]">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Domains</div>
                    <div className="mt-1 text-[var(--color-text)]">{activeDomainCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Heuristics</div>
                    <div className="mt-1 text-[var(--color-text)]">{heuristicCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Protocols</div>
                    <div className="mt-1 text-[var(--color-text)]">{protocolCount}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                  <Shield size={12} className="text-[var(--color-text-faint)]" />
                  <span>{hint}</span>
                </div>
                </SurfaceCard>
              </button>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="khal-chamber p-5" style={{ background: "linear-gradient(180deg, rgba(18,18,31,0.88), rgba(10,10,18,0.94))" }}>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Orientation</div>
            <div className="mt-3 text-lg text-[var(--color-text-strong)]">Current reading order</div>
            <div className="mt-3 text-sm text-[var(--color-text-muted)]">
              Source pressure first, domain consequence second, admissible means third.
            </div>
            <div className="mt-5 space-y-2">
              <StatRow label="Sources live" value={sources.length} />
              <StatRow label="Affairs" value={affairs.length} />
              <StatRow label="Interests" value={interests.length} />
            </div>
          </div>

          <div className="khal-chamber p-5" style={{ background: "linear-gradient(180deg, rgba(18,18,31,0.88), rgba(10,10,18,0.94))" }}>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Featured source</div>
            <div className="mt-3 text-xl text-[var(--color-text-strong)]">{topSource?.source.name ?? "No source"}</div>
            <div className="mt-2 text-sm text-[var(--color-text-muted)]">
              {topSource?.linkedCrafts.length
                ? `Means in play: ${topSource.linkedCrafts.slice(0, 2).join(" | ")}`
                : "No mapped means yet."}
            </div>
            {topSource ? (
              <button
                onClick={() => onOpenSource(topSource.source.id)}
                className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--color-accent)] font-[var(--font-mono)]"
              >
                Game source <ArrowRight size={12} />
              </button>
            ) : null}
          </div>

          <div className="khal-chamber p-5" style={{ background: "linear-gradient(180deg, rgba(18,18,31,0.88), rgba(10,10,18,0.94))" }}>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Feature route</div>
            <div className="mt-3 space-y-3 text-sm text-[var(--color-text-muted)]">
              <div className="flex items-start gap-3">
                <Sparkles size={14} className="mt-1 text-[var(--color-accent)]" />
                <span>{topDomain ? `Open ${topDomain.domain.name} to inspect State of the Art and State of Affairs.` : "Open a domain to inspect doctrine."}</span>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase size={14} className="mt-1 text-[var(--color-danger)]" />
                <span>Affairs stay attached to domains so current obligations remain visible in the map.</span>
              </div>
              <div className="flex items-start gap-3">
                <Shield size={14} className="mt-1 text-[var(--color-success)]" />
                <span>{topCraft ? `${topCraft.craft.name} is currently one of the strongest available means libraries.` : "Select a craft to inspect admissible means."}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

