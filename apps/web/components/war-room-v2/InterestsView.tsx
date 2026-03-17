import React, { useMemo } from "react";
import { ArrowRight, Plus, Sparkles } from "lucide-react";
import { AppData, Interest, SourceMapProfileDto } from "./types";
import { InterestDetail } from "./InterestDetail";

interface InterestsViewProps {
  data: AppData;
  selectedInterestId: string | null;
  onSelectInterest: (id: string | null) => void;
  onSelectAffair: (id: string) => void;
  onCreateInterest: (payload: { title: string; domainId: string }) => Promise<void>;
  onWarGame: (interestId: string) => void;
  onOpenLab?: (interestId: string) => void;
  onOpenPortfolio?: (interestId: string) => void;
}

function buildDummyInterests(data: AppData): Interest[] {
  const firstDomain = data.domains[0]?.id ?? "general";
  return [
    { id: "dummy-interest-01", title: "Optionality Stack: Intelligence", domainId: firstDomain, perspective: "public", stakes: "Expand strategic foresight", objectives: ["Signal collection", "Early warning"] },
    { id: "dummy-interest-02", title: "Optionality Stack: Capital", domainId: firstDomain, perspective: "private", stakes: "Increase convex upside", objectives: ["Asymmetric entries", "Tail-risk hedges"] },
    { id: "dummy-interest-03", title: "Optionality Stack: Network", domainId: firstDomain, perspective: "personal", stakes: "Compound trusted alliances", objectives: ["Alliance map", "Cooperation leverage"] }
  ];
}

type InterestDoctrineContext = {
  profile?: SourceMapProfileDto;
  sourceName?: string;
  domainName?: string;
};

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

function InterestRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-sm border p-4"
      style={{
        borderColor: "rgba(48,224,176,0.18)",
        background: "linear-gradient(180deg, rgba(18,18,31,0.82), rgba(10,10,18,0.9))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 24px rgba(0,0,0,0.12)"
      }}
    >
      {children}
    </div>
  );
}

export function InterestsView({ data, selectedInterestId, onSelectInterest, onSelectAffair, onCreateInterest, onWarGame, onOpenLab, onOpenPortfolio }: InterestsViewProps) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [domainId, setDomainId] = React.useState(data.domains[0]?.id ?? "general");
  const [saving, setSaving] = React.useState(false);

  const visualInterests = useMemo(() => (data.interests.length ? data.interests : buildDummyInterests(data)), [data]);
  const domainById = useMemo(() => new Map(data.domains.map((domain) => [domain.id, domain])), [data.domains]);

  const doctrineByInterestId = useMemo(() => {
    const lookup = new Map<string, InterestDoctrineContext>();
    for (const source of data.sources ?? []) {
      for (const profile of source.mapProfiles ?? []) {
        if (!profile.interestId) continue;
        lookup.set(profile.interestId, {
          profile,
          sourceName: source.name,
          domainName: domainById.get(profile.domainId)?.name
        });
      }
    }
    return lookup;
  }, [data.sources, domainById]);

  const groupedInterests = useMemo(() => {
    const groups = new Map<string, { domainName: string; sourceName?: string; items: Interest[] }>();
    for (const interest of visualInterests) {
      const domain = domainById.get(interest.domainId);
      const doctrine = doctrineByInterestId.get(interest.id);
      const key = domain?.id ?? interest.domainId;
      const existing = groups.get(key) ?? {
        domainName: domain?.name ?? interest.domainId,
        sourceName: doctrine?.sourceName,
        items: []
      };
      existing.items.push(interest);
      if (!existing.sourceName && doctrine?.sourceName) existing.sourceName = doctrine.sourceName;
      groups.set(key, existing);
    }
    return [...groups.values()].sort((left, right) => right.items.length - left.items.length || left.domainName.localeCompare(right.domainName));
  }, [doctrineByInterestId, domainById, visualInterests]);

  if (selectedInterestId) {
    const activeInterestId = selectedInterestId;
    return (
      <InterestDetail
        interest={visualInterests.find((interest) => interest.id === activeInterestId)!}
        affairs={data.affairs.filter((affair) => affair.interestId === activeInterestId)}
        doctrine={doctrineByInterestId.get(activeInterestId)}
        onBack={() => onSelectInterest(null)}
        onAffairClick={(id: string) => {
          onSelectAffair(id);
          onSelectInterest(null);
        }}
        onOpenLab={onOpenLab ? () => onOpenLab(activeInterestId) : undefined}
        onOpenPortfolio={onOpenPortfolio ? () => onOpenPortfolio(activeInterestId) : undefined}
        onWarGame={() => onWarGame(activeInterestId)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-[var(--color-line)] pb-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Vision Command</div>
          <h2 className="khal-serif-hero mt-2 text-4xl text-[var(--color-text-strong)]">Organize interests</h2>
          <p className="mt-3 max-w-3xl text-sm text-[var(--color-text-muted)]">
            Vision Command is the hierarchy of options. It should show where convexity lives, how it is scoped, and what can be explored safely.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="khal-subtle-panel px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Interests</div>
            <div className="mt-1 text-lg text-[var(--color-text)]">{visualInterests.length}</div>
          </div>
          <button onClick={() => setOpen(true)} className="khal-button-accent px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em]">
            <span className="inline-flex items-center gap-2">
              <Plus size={14} /> New Interest
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="khal-chamber mb-5 p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input className="khal-input px-4 py-3 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Interest title" />
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
                    await onCreateInterest({ title: title.trim(), domainId });
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
          {groupedInterests.length ? (
            groupedInterests.map((group) => (
              <DeepPanel key={group.domainName}>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-line)] pb-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Domain</div>
                    <div className="mt-1 text-2xl text-[var(--color-text-strong)]">{group.domainName}</div>
                    <div className="mt-2 text-sm text-[var(--color-text-muted)]">{group.sourceName ?? "No mapped source"}</div>
                  </div>
                  <div className="inline-flex rounded-sm border border-[rgba(48,224,176,0.22)] bg-[rgba(48,224,176,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.08em] font-[var(--font-mono)] text-[var(--color-success)]">
                    Options {group.items.length}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {group.items.map((interest) => {
                    const doctrine = doctrineByInterestId.get(interest.id);
                    return (
                      <InterestRow key={interest.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-base text-[var(--color-text-strong)]">{interest.title}</div>
                            <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                              {interest.perspective ?? "scope undefined"} | {doctrine?.profile?.quadrant ?? "quadrant unmapped"}
                            </div>
                          </div>
                          <button
                            onClick={() => onSelectInterest(interest.id)}
                            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-accent)] font-[var(--font-mono)]"
                          >
                            Open <ArrowRight size={12} />
                          </button>
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm text-[var(--color-text-muted)]">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Stakes</div>
                            <div className="mt-1">{String(interest.stakes ?? "Undefined")}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Edge</div>
                            <div className="mt-1 line-clamp-2">{doctrine?.profile?.edgeText ?? "Undefined"}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Avoid</div>
                            <div className="mt-1 line-clamp-2">{doctrine?.profile?.avoidText ?? "Undefined"}</div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                          {onOpenPortfolio ? (
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onOpenPortfolio(interest.id);
                              }}
                              className="rounded-sm border border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] px-3 py-2 text-[11px] uppercase tracking-[0.1em] font-[var(--font-mono)] text-[var(--color-text)]"
                            >
                              Portfolio
                            </button>
                          ) : null}
                          {onOpenLab ? (
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onOpenLab(interest.id);
                              }}
                              className="rounded-sm border border-[rgba(48,224,176,0.22)] bg-[rgba(48,224,176,0.08)] px-3 py-2 text-[11px] uppercase tracking-[0.1em] font-[var(--font-mono)] text-[var(--color-success)]"
                            >
                              Open Lab
                            </button>
                          ) : null}
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              onWarGame(interest.id);
                            }}
                            className="rounded-sm border border-[var(--color-line)] bg-[var(--color-editor-bg-soft)] px-3 py-2 text-[11px] uppercase tracking-[0.1em] font-[var(--font-mono)] text-[var(--color-text)]"
                          >
                            WarGame
                          </button>
                        </div>
                      </InterestRow>
                    );
                  })}
                </div>
              </DeepPanel>
            ))
          ) : (
            <div className="khal-chamber p-8 text-sm text-[var(--color-text-muted)]">No interests are available to organize yet.</div>
          )}
        </section>

        <aside className="space-y-4">
          <DeepPanel>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Vision rule</div>
            <div className="mt-3 space-y-3 text-sm text-[var(--color-text-muted)]">
              <div className="flex items-start gap-3">
                <Sparkles size={14} className="mt-1 text-[var(--color-success)]" />
                <span>Interests should express convexity, not disguised obligations.</span>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight size={14} className="mt-1 text-[var(--color-accent)]" />
                <span>Keep the option hierarchy grouped by the domain where upside actually lives.</span>
              </div>
            </div>
          </DeepPanel>

          <DeepPanel>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] font-[var(--font-mono)]">Mapped doctrine</div>
            <div className="mt-3 space-y-3">
              {[...doctrineByInterestId.entries()].slice(0, 5).map(([interestId, doctrine]) => (
                <InterestRow key={interestId}>
                  <div className="text-sm text-[var(--color-text-strong)]">{visualInterests.find((interest) => interest.id === interestId)?.title ?? interestId}</div>
                  <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {doctrine.sourceName ?? "Source"} | {doctrine.domainName ?? doctrine.profile?.domainId ?? "Domain"}
                  </div>
                </InterestRow>
              ))}
              {!doctrineByInterestId.size ? <div className="text-sm text-[var(--color-text-muted)]">No source-domain doctrine is linked to interests yet.</div> : null}
            </div>
          </DeepPanel>
        </aside>
      </div>
    </div>
  );
}
