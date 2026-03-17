import React, { useMemo } from "react";
import { AlertTriangle, ArrowRight, Briefcase, Shield, Sparkles } from "lucide-react";
import { AppData, Domain, WarGameMode } from "./types";

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

function RowCard({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "risk" }) {
  const border = tone === "risk" ? "rgba(224,90,58,0.22)" : "var(--color-line)";
  const bg = tone === "risk" ? "rgba(224,90,58,0.08)" : "linear-gradient(180deg, rgba(18,18,31,0.82), rgba(10,10,18,0.9))";
  return (
    <div
      className="rounded-sm border p-4"
      style={{
        borderColor: border,
        background: bg,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 24px rgba(0,0,0,0.12)"
      }}
    >
      {children}
    </div>
  );
}

export const MissionCommand = ({
  data,
  onDomainClick,
  onWarGame
}: {
  data: AppData;
  onDomainClick: (d: Domain) => void;
  onWarGame: (mode: WarGameMode, targetId?: string) => void;
  onQueueAction?: () => Promise<void> | void;
}) => {
  const domainById = useMemo(() => new Map(data.domains.map((domain) => [domain.id, domain])), [data.domains]);

  const groupedAffairs = useMemo(() => {
    const groups = new Map<
      string,
      {
        domain: Domain;
        affairs: typeof data.affairs;
        openCount: number;
      }
    >();

    for (const affair of data.affairs) {
      const domain = domainById.get(affair.domainId);
      if (!domain) continue;
      const existing = groups.get(domain.id) ?? { domain, affairs: [], openCount: 0 };
      existing.affairs.push(affair);
      if (affair.status !== "done") existing.openCount += 1;
      groups.set(domain.id, existing);
    }

    return [...groups.values()].sort((left, right) => right.openCount - left.openCount || left.domain.name.localeCompare(right.domain.name));
  }, [data.affairs, domainById]);

  const openLineageRisks = useMemo(
    () => (data.lineageRisks ?? []).filter((risk) => risk.status !== "RESOLVED").sort((a, b) => (b.fragilityScore ?? 0) - (a.fragilityScore ?? 0)),
    [data.lineageRisks]
  );

  const unresolvedAffairs = useMemo(
    () =>
      data.affairs.filter((affair) => {
        const hasObjectives = (affair.plan?.objectives ?? []).length > 0;
        const hasCraft = Boolean(affair.means?.craftId);
        const hasDomain = Boolean(affair.domainId);
        return !(hasObjectives && hasCraft && hasDomain);
      }),
    [data.affairs]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-[var(--color-line)] pb-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Mission Command</div>
          <h2 className="khal-serif-hero mt-2 text-4xl text-[var(--color-text-strong)]">Organize affairs</h2>
          <p className="mt-3 max-w-3xl text-sm text-[var(--color-text-muted)]">
            Mission Command is the hierarchy of obligations. It should make fragility removal and sequencing obvious, not bury it under telemetry.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="khal-subtle-panel px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Affairs</div>
            <div className="mt-1 text-lg text-[var(--color-text)]">{data.affairs.length}</div>
          </div>
          <div className="khal-subtle-panel px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Open risks</div>
            <div className="mt-1 text-lg text-[var(--color-text)]">{openLineageRisks.length}</div>
          </div>
          <div className="khal-subtle-panel px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Incomplete</div>
            <div className="mt-1 text-lg text-[var(--color-text)]">{unresolvedAffairs.length}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="space-y-4">
          {groupedAffairs.length ? (
            groupedAffairs.map(({ domain, affairs, openCount }) => (
              <DeepPanel key={domain.id}>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-line)] pb-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Domain</div>
                    <div className="mt-1 text-2xl text-[var(--color-text-strong)]">{domain.name}</div>
                    <div className="mt-2 text-sm text-[var(--color-text-muted)]">
                      {domain.volatilitySourceName ?? domain.volatilitySource ?? domain.volatility ?? "No mapped source"}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex rounded-sm border border-[rgba(224,90,58,0.22)] bg-[rgba(224,90,58,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.08em] font-[var(--font-mono)] text-[var(--color-danger)]">
                      Open {openCount}
                    </div>
                    <button
                      onClick={() => onDomainClick(domain)}
                      className="rounded-sm border border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] px-3 py-1 text-[11px] uppercase tracking-[0.08em] font-[var(--font-mono)] text-[var(--color-text)]"
                    >
                      Open Domain
                    </button>
                    <button
                      onClick={() => onWarGame("domain", domain.id)}
                      className="rounded-sm border border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] px-3 py-1 text-[11px] uppercase tracking-[0.08em] font-[var(--font-mono)] text-[var(--color-text)]"
                    >
                      WarGame Domain
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {affairs.map((affair) => (
                    <RowCard key={affair.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base text-[var(--color-text-strong)]">{affair.title}</div>
                          <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                            {affair.status ?? "unknown"} | {affair.perspective ?? "scope undefined"}
                          </div>
                        </div>
                        <button
                          onClick={() => onWarGame("affair", affair.id)}
                          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-accent)] font-[var(--font-mono)]"
                        >
                          WarGame <ArrowRight size={12} />
                        </button>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm text-[var(--color-text-muted)]">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Objectives</div>
                          <div className="mt-1">{(affair.plan?.objectives ?? []).length || "None"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Craft</div>
                          <div className="mt-1">{affair.means?.craftId ?? "Unassigned"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Heuristics</div>
                          <div className="mt-1">{affair.means?.selectedHeuristicIds?.length ?? 0}</div>
                        </div>
                      </div>
                    </RowCard>
                  ))}
                </div>
              </DeepPanel>
            ))
          ) : (
            <div className="khal-chamber p-8 text-sm text-[var(--color-text-muted)]">No affairs are available to sequence yet.</div>
          )}
        </section>

        <aside className="space-y-4">
          <DeepPanel>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Mission rule</div>
            <div className="mt-3 space-y-3 text-sm text-[var(--color-text-muted)]">
              <div className="flex items-start gap-3">
                <Shield size={14} className="mt-1 text-[var(--color-danger)]" />
                <span>Remove fragility before expanding option space.</span>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase size={14} className="mt-1 text-[var(--color-danger)]" />
                <span>Affairs should be grouped by the domain pressure they actually resolve.</span>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles size={14} className="mt-1 text-[var(--color-success)]" />
                <span>Mission stays about obligation hierarchy, not global telemetry.</span>
              </div>
            </div>
          </DeepPanel>

          <DeepPanel>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Blocking risks</div>
            <div className="mt-3 space-y-3">
              {openLineageRisks.slice(0, 5).map((risk) => (
                <RowCard key={risk.id} tone="risk">
                  <div className="text-sm text-[var(--color-text-strong)]">{risk.title}</div>
                  <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {risk.domainId} | {risk.lineageNodeId} | fragility {risk.fragilityScore ?? "?"}
                  </div>
                </RowCard>
              ))}
              {!openLineageRisks.length ? <div className="text-sm text-[var(--color-text-muted)]">No open lineage blockers.</div> : null}
            </div>
          </DeepPanel>

          <DeepPanel>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Incomplete affairs</div>
            <div className="mt-3 space-y-3">
              {unresolvedAffairs.slice(0, 5).map((affair) => (
                <RowCard key={affair.id}>
                  <div className="text-sm text-[var(--color-text-strong)]">{affair.title}</div>
                  <div className="mt-1 text-xs text-[var(--color-text-muted)]">Missing one or more of: domain, means, objectives.</div>
                </RowCard>
              ))}
              {!unresolvedAffairs.length ? <div className="text-sm text-[var(--color-text-muted)]">All current affairs have the basic mission fields.</div> : null}
            </div>
          </DeepPanel>
        </aside>
      </div>
    </div>
  );
};
