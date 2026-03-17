import React, { useMemo } from "react";
import { AlertTriangle, ArrowRight, Plus, Shield } from "lucide-react";
import { AppData } from "./types";

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

function AffairRow({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "watch" }) {
  return (
    <div
      className="rounded-sm border p-4"
      style={{
        borderColor: tone === "watch" ? "rgba(240,168,50,0.22)" : "var(--color-line)",
        background:
          tone === "watch"
            ? "rgba(240,168,50,0.08)"
            : "linear-gradient(180deg, rgba(18,18,31,0.82), rgba(10,10,18,0.9))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 24px rgba(0,0,0,0.12)"
      }}
    >
      {children}
    </div>
  );
}

interface AffairsViewProps {
  data: AppData;
  onSelectAffair: (id: string) => void;
  onCreateAffair: (payload: { title: string; domainId: string }) => Promise<void>;
  onWarGame: (affairId: string) => void;
}

export function AffairsView({ data, onSelectAffair, onCreateAffair, onWarGame }: AffairsViewProps) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [domainId, setDomainId] = React.useState(data.domains[0]?.id ?? "general");
  const [saving, setSaving] = React.useState(false);

  const domainById = useMemo(() => new Map(data.domains.map((domain) => [domain.id, domain])), [data.domains]);

  const groupedAffairs = useMemo(() => {
    const groups = new Map<
      string,
      {
        domainId: string;
        domainName: string;
        sourceName: string;
        affairs: typeof data.affairs;
      }
    >();

    for (const affair of data.affairs) {
      const domain = domainById.get(affair.domainId);
      if (!domain) continue;
      const key = domain.id;
      const existing = groups.get(key) ?? {
        domainId: domain.id,
        domainName: domain.name,
        sourceName: domain.volatilitySourceName ?? domain.volatilitySource ?? domain.volatility ?? "No mapped source",
        affairs: []
      };
      existing.affairs.push(affair);
      groups.set(key, existing);
    }

    return [...groups.values()].sort((left, right) => right.affairs.length - left.affairs.length || left.domainName.localeCompare(right.domainName));
  }, [data.affairs, domainById]);

  const incompleteAffairs = useMemo(
    () =>
      data.affairs.filter((affair) => {
        const hasObjectives = (affair.plan?.objectives ?? []).length > 0;
        const hasCraft = Boolean(affair.means?.craftId);
        return !(hasObjectives && hasCraft);
      }),
    [data.affairs]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-[var(--color-line)] pb-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Affairs</div>
          <h2 className="khal-serif-hero mt-2 text-4xl text-[var(--color-text-strong)]">Obligation register</h2>
          <p className="mt-3 max-w-3xl text-sm text-[var(--color-text-muted)]">
            This is the operational register of affairs. It should make current obligations legible by domain and expose which ones are still structurally incomplete.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="khal-subtle-panel px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Affairs</div>
            <div className="mt-1 text-lg text-[var(--color-text)]">{data.affairs.length}</div>
          </div>
          <div className="khal-subtle-panel px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Incomplete</div>
            <div className="mt-1 text-lg text-[var(--color-text)]">{incompleteAffairs.length}</div>
          </div>
          <button onClick={() => setOpen(true)} className="khal-button-accent px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em]">
            <span className="inline-flex items-center gap-2">
              <Plus size={14} /> New Affair
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="khal-chamber mb-5 p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              className="khal-input px-4 py-3 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Affair title"
            />
            <select className="khal-select px-4 py-3 text-sm" value={domainId} onChange={(e) => setDomainId(e.target.value)}>
              {data.domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                className="khal-button-accent flex-1 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] disabled:opacity-50"
                disabled={!title.trim() || saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await onCreateAffair({ title: title.trim(), domainId });
                    setTitle("");
                    setOpen(false);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Save
              </button>
              <button className="rounded-sm border border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] px-4 py-3 text-[11px] uppercase tracking-[0.12em] font-[var(--font-mono)] text-[var(--color-text)]" onClick={() => setOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="space-y-4">
          {groupedAffairs.length ? (
            groupedAffairs.map((group) => (
              <DeepPanel key={group.domainId}>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-line)] pb-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Domain</div>
                    <div className="mt-1 text-2xl text-[var(--color-text-strong)]">{group.domainName}</div>
                    <div className="mt-2 text-sm text-[var(--color-text-muted)]">{group.sourceName}</div>
                  </div>
                  <div className="inline-flex rounded-sm border border-[rgba(224,90,58,0.22)] bg-[rgba(224,90,58,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.08em] font-[var(--font-mono)] text-[var(--color-danger)]">
                    Obligations {group.affairs.length}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {group.affairs.map((affair) => {
                    const incomplete = !(affair.means?.craftId && (affair.plan?.objectives ?? []).length > 0);
                    return (
                      <AffairRow key={affair.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-base text-[var(--color-text-strong)]">{affair.title}</div>
                            <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                              {affair.status ?? "unknown"} | {affair.perspective ?? "scope undefined"}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {incomplete ? (
                              <span className="inline-flex rounded-sm border border-[rgba(240,168,50,0.22)] bg-[rgba(240,168,50,0.08)] px-2 py-1 text-[10px] uppercase tracking-[0.12em] font-[var(--font-mono)] text-[var(--color-warning)]">
                                Incomplete
                              </span>
                            ) : null}
                            <button
                              onClick={() => onSelectAffair(affair.id)}
                              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-accent)] font-[var(--font-mono)]"
                            >
                              Open <ArrowRight size={12} />
                            </button>
                          </div>
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

                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              onWarGame(affair.id);
                            }}
                            className="rounded-sm border border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] px-3 py-2 text-[11px] uppercase tracking-[0.1em] font-[var(--font-mono)] text-[var(--color-text)]"
                          >
                            WarGame
                          </button>
                        </div>
                      </AffairRow>
                    );
                  })}
                </div>
              </DeepPanel>
            ))
          ) : (
            <div className="khal-chamber p-8 text-sm text-[var(--color-text-muted)]">No affairs are registered yet.</div>
          )}
        </section>

        <aside className="space-y-4">
          <DeepPanel>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Affair rule</div>
            <div className="mt-3 space-y-3 text-sm text-[var(--color-text-muted)]">
              <div className="flex items-start gap-3">
                <Shield size={14} className="mt-1 text-[var(--color-danger)]" />
                <span>Affairs are obligations to remove fragility, not generic tasks.</span>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle size={14} className="mt-1 text-[var(--color-warning)]" />
                <span>If means or objectives are missing, the obligation is not ready for confident execution.</span>
              </div>
            </div>
          </DeepPanel>

          <DeepPanel>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Incomplete register</div>
            <div className="mt-3 space-y-3">
              {incompleteAffairs.slice(0, 6).map((affair) => (
                <AffairRow key={affair.id} tone="watch">
                  <div className="text-sm text-[var(--color-text-strong)]">{affair.title}</div>
                  <div className="mt-1 text-xs text-[var(--color-text-muted)]">Missing one or more of: craft, objectives.</div>
                </AffairRow>
              ))}
              {!incompleteAffairs.length ? <div className="text-sm text-[var(--color-text-muted)]">All current affairs have basic doctrine structure.</div> : null}
            </div>
          </DeepPanel>
        </aside>
      </div>
    </div>
  );
}
