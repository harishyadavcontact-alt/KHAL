"use client";

import { useEffect, useMemo, useState } from "react";
import { KhalOpsShell } from "../../components/ops-shell/KhalOpsShell";
import {
  compileDraft,
  inferDraftStructure,
  type DraftEntityLink,
  type PromotionEvent,
  type StructuralAnchor
} from "../../lib/drafts/parser";

const STORAGE_KEY = "khal.drafts.v4";
const SAMPLE = `Looxmax mostly comes down to sleep, training, and diet.
Grooming stack: beard, hair, eyebrows, hygiene.
Never make appearance changes right before important events.
If travel disrupts sleep then reduce intensity and protect recovery.`;

type AnchorState = Record<string, "open" | "accepted" | "dismissed">;

type PersistedDraftBundle = {
  draft: {
    id: string;
    title: string;
    rawText: string;
    inferredStructure: Record<string, unknown>;
    selectedAnchorId?: string;
    uiState: {
      anchorState?: AnchorState;
      showDebug?: boolean;
    };
    createdAt: string;
    updatedAt: string;
  };
  blocks: unknown[];
  anchors: StructuralAnchor[];
  entityLinks: DraftEntityLink[];
  promotionEvents: PromotionEvent[];
};

function statusTone(status: StructuralAnchor["status"]) {
  if (status === "accepted") return "border-emerald-500/40 bg-emerald-500/10";
  if (status === "dismissed") return "border-zinc-700 bg-zinc-900/70 opacity-60";
  return "border-white/10 bg-zinc-950/70";
}

function formatSavedAt(value: string | null) {
  if (!value) return "Not yet persisted";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Persisted" : `Persisted ${date.toLocaleString()}`;
}

export default function DraftsPage() {
  const [draftId, setDraftId] = useState<string | null>(null);
  const [text, setText] = useState(SAMPLE);
  const [anchorState, setAnchorState] = useState<AnchorState>({});
  const [promotions, setPromotions] = useState<PromotionEvent[]>([]);
  const [links, setLinks] = useState<DraftEntityLink[]>([]);
  const [selectedAnchorId, setSelectedAnchorId] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyAnchorId, setBusyAnchorId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const inference = useMemo(() => inferDraftStructure(text), [text]);
  const compileReadable = useMemo(() => compileDraft(text), [text]);

  const resolvedAnchors = useMemo(
    () =>
      inference.anchors.map((anchor) => ({
        ...anchor,
        status: anchorState[anchor.id] ?? anchor.status
      })),
    [anchorState, inference.anchors]
  );

  const selectedAnchor = selectedAnchorId ? resolvedAnchors.find((anchor) => anchor.id === selectedAnchorId) ?? null : null;
  const suggestedLinks = useMemo(
    () => links.filter((link) => link.anchorId === selectedAnchorId && link.linkStatus === "suggested"),
    [links, selectedAnchorId]
  );
  const persistedLinks = useMemo(
    () => links.filter((link) => link.linkStatus !== "suggested"),
    [links]
  );

  function applyPersistedDraft(bundle: PersistedDraftBundle) {
    setDraftId(bundle.draft.id);
    setText(bundle.draft.rawText || SAMPLE);
    setAnchorState(bundle.draft.uiState?.anchorState ?? {});
    setShowDebug(Boolean(bundle.draft.uiState?.showDebug));
    setSelectedAnchorId(bundle.draft.selectedAnchorId ?? bundle.anchors[0]?.id ?? null);
    setPromotions(bundle.promotionEvents ?? []);
    setLinks(bundle.entityLinks ?? []);
    setLastSavedAt(bundle.draft.updatedAt ?? null);
  }

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          text?: string;
          anchorState?: AnchorState;
          promotions?: PromotionEvent[];
          links?: DraftEntityLink[];
          showDebug?: boolean;
          selectedAnchorId?: string | null;
        };
        if (typeof parsed.text === "string") setText(parsed.text);
        if (parsed.anchorState) setAnchorState(parsed.anchorState);
        if (Array.isArray(parsed.promotions)) setPromotions(parsed.promotions);
        if (Array.isArray(parsed.links)) setLinks(parsed.links);
        if (typeof parsed.showDebug === "boolean") setShowDebug(parsed.showDebug);
        if (typeof parsed.selectedAnchorId === "string") setSelectedAnchorId(parsed.selectedAnchorId);
      }
    } catch {
      // Ignore local storage parse failures.
    }

    void (async () => {
      try {
        const response = await fetch("/api/drafts", { method: "GET", cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { draft?: PersistedDraftBundle | null };
        if (payload.draft) applyPersistedDraft(payload.draft);
      } catch {
        // Local fallback is acceptable.
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    const payload = { text, anchorState, promotions, links, showDebug, selectedAnchorId };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [anchorState, links, promotions, selectedAnchorId, showDebug, text]);

  useEffect(() => {
    const open = resolvedAnchors.find((anchor) => anchor.status !== "dismissed");
    if (!selectedAnchorId && open) setSelectedAnchorId(open.id);
  }, [resolvedAnchors, selectedAnchorId]);

  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(async () => {
      setSaving(true);
      try {
        const response = await fetch("/api/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: draftId, input: text, anchorState, selectedAnchorId, showDebug })
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? `Failed to persist draft (${response.status})`);
        }
        const payload = (await response.json()) as { draft: PersistedDraftBundle };
        applyPersistedDraft(payload.draft);
        setError(null);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Failed to persist draft.");
      } finally {
        setSaving(false);
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [anchorState, draftId, loaded, selectedAnchorId, showDebug, text]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.target instanceof HTMLElement)) return;
      if (!event.target.closest("[data-drafts-root='true']")) return;
      const editable = event.target.tagName === "TEXTAREA" || event.target.tagName === "INPUT";
      if (!editable) return;

      const visibleAnchors = resolvedAnchors.filter((anchor) => anchor.status !== "dismissed");
      if (!visibleAnchors.length) return;
      const currentIndex = visibleAnchors.findIndex((anchor) => anchor.id === selectedAnchorId);

      if (event.altKey && event.key.toLowerCase() === "j") {
        event.preventDefault();
        const next = visibleAnchors[(currentIndex + 1 + visibleAnchors.length) % visibleAnchors.length];
        if (next) setSelectedAnchorId(next.id);
      }

      if (event.altKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const prev = visibleAnchors[(currentIndex - 1 + visibleAnchors.length) % visibleAnchors.length];
        if (prev) setSelectedAnchorId(prev.id);
      }

      if (event.altKey && event.key.toLowerCase() === "a" && selectedAnchorId) {
        event.preventDefault();
        setAnchorState((current) => ({ ...current, [selectedAnchorId]: "accepted" }));
      }

      if (event.altKey && event.key.toLowerCase() === "d" && selectedAnchorId) {
        event.preventDefault();
        setAnchorState((current) => ({ ...current, [selectedAnchorId]: "dismissed" }));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [resolvedAnchors, selectedAnchorId]);

  async function promoteAnchor(anchor: StructuralAnchor) {
    setBusyAnchorId(anchor.id);
    setError(null);
    try {
      const response = await fetch("/api/drafts/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draftId, input: text, anchorState, selectedAnchorId, showDebug, anchorId: anchor.id })
      });
      const payload = (await response.json()) as {
        error?: string;
        draft?: PersistedDraftBundle;
      };
      if (!response.ok || payload.error) throw new Error(payload.error ?? `Promotion failed (${response.status})`);
      if (payload.draft) applyPersistedDraft(payload.draft);
      setAnchorState((current) => ({ ...current, [anchor.id]: "accepted" }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Promotion failed.");
    } finally {
      setBusyAnchorId(null);
    }
  }

  const structureCards = [
    { label: "Affairs", values: inference.inferred.affairs },
    { label: "Interests", values: inference.inferred.interests },
    { label: "Crafts", values: inference.inferred.crafts },
    { label: "Power laws", values: inference.inferred.powerLaws },
    { label: "Rules", values: inference.inferred.rules },
    { label: "Heuristics", values: inference.inferred.heuristics },
    { label: "Scenarios", values: inference.inferred.scenarios },
    { label: "Threats", values: inference.inferred.threats },
    { label: "Responses", values: inference.inferred.responses }
  ];

  return (
    <KhalOpsShell title="Drafts" subtitle="Prose-first structural thinking">
      <div data-drafts-root="true" className="grid gap-4 p-4 xl:grid-cols-[1.35fr,1fr]">
        <section className="space-y-4">
          <article className="rounded-3xl border border-white/10 bg-zinc-950/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">Writing canvas</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
                  Brain-dump in plain English. Drafts should pull thought toward usable structure without forcing syntax.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-zinc-400">
                <div>{saving ? "Persisting..." : formatSavedAt(lastSavedAt)}</div>
                <div className="mt-1">Alt+J / Alt+K move, Alt+A accept, Alt+D dismiss</div>
              </div>
            </div>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              spellCheck={false}
              aria-label="Draft writing canvas"
              className="h-[560px] w-full resize-none rounded-2xl border border-white/10 bg-zinc-900/80 p-5 text-[15px] leading-8 text-zinc-100 outline-none transition focus:border-blue-500"
              placeholder="Write naturally. Drafts will infer structure as you think."
            />
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
              <span className="rounded-full border border-white/10 px-3 py-1">Human-readable first</span>
              <span className="rounded-full border border-white/10 px-3 py-1">Anchors are intermediate structure</span>
              <span className="rounded-full border border-white/10 px-3 py-1">SQLite-backed persistence</span>
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Draft map</h3>
                <p className="mt-1 text-xs text-zinc-500">Navigate the draft through structure, not just raw text.</p>
              </div>
              <div className="text-xs text-zinc-500">{inference.blockLenses.length} blocks</div>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {inference.blockLenses.map((lens, index) => {
                const firstAnchorId = lens.anchorIds[0] ?? null;
                const active = firstAnchorId && firstAnchorId === selectedAnchorId;
                return (
                  <button
                    key={lens.blockId}
                    type="button"
                    onClick={() => firstAnchorId && setSelectedAnchorId(firstAnchorId)}
                    className={`rounded-2xl border p-3 text-left transition ${active ? "border-blue-400 bg-blue-500/10" : "border-white/10 bg-zinc-950/70 hover:border-white/20"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Block {index + 1}</span>
                      <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{lens.dominantSignal}</span>
                    </div>
                    <div className="mt-2 text-sm font-medium text-zinc-100">{lens.title}</div>
                    <div className="mt-1 text-xs leading-5 text-zinc-400">{lens.summary}</div>
                    <div className="mt-2 text-[11px] text-zinc-500">{lens.anchorIds.length} anchors</div>
                  </button>
                );
              })}
              {inference.blockLenses.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">Start writing to generate a draft map.</div>}
            </div>
          </article>
        </section>

        <section className="space-y-3">
          <article className="rounded-3xl border border-white/10 bg-zinc-900/70 p-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Structure panel</h3>
              <p className="mt-1 text-xs text-zinc-500">Human-readable structural feedback, not machine output.</p>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {structureCards.map((card) => (
                <div key={card.label} className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{card.label}</div>
                  {card.values.length ? (
                    <ul className="mt-2 space-y-1 text-sm text-zinc-200">
                      {card.values.slice(0, 4).map((value) => (
                        <li key={`${card.label}-${value}`}>{value}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-2 text-sm text-zinc-600">None yet</div>
                  )}
                </div>
              ))}
            </div>
            {inference.inferred.stacks.length > 0 && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-zinc-950/70 p-3">
                <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Candidate stacks</div>
                <div className="mt-2 space-y-2 text-sm text-zinc-200">
                  {inference.inferred.stacks.map((stack) => (
                    <div key={stack.name}>
                      <div className="font-medium text-zinc-100">{stack.name}</div>
                      <div className="text-zinc-400">{stack.items.join(", ")}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>

          <article className="rounded-3xl border border-white/10 bg-zinc-900/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Structural anchors</h3>
                <p className="mt-1 text-xs text-zinc-500">Intermediate handles between prose and canonical entities.</p>
              </div>
              <div className="text-xs text-zinc-500">{resolvedAnchors.length} detected</div>
            </div>
            <div className="mt-3 space-y-2">
              {resolvedAnchors.map((anchor) => (
                <div
                  key={anchor.id}
                  className={`rounded-2xl border p-3 transition ${statusTone(anchor.status)} ${selectedAnchorId === anchor.id ? "ring-1 ring-blue-400/60" : ""}`}
                  onMouseEnter={() => setSelectedAnchorId(anchor.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{anchor.anchorType} / {anchor.candidateEntityType.replace("_", " ")}</div>
                      <div className="mt-1 text-sm font-medium text-zinc-100">{anchor.title}</div>
                      <div className="mt-1 text-xs leading-5 text-zinc-400">{anchor.notes}</div>
                    </div>
                    <div className="text-xs text-zinc-500">{Math.round(anchor.confidence * 100)}%</div>
                  </div>
                  <div className="mt-2 rounded-xl bg-black/20 px-3 py-2 text-xs leading-5 text-zinc-300">{anchor.sourcePreview}</div>
                  {anchor.relatedValues?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-300">
                      {anchor.relatedValues.map((value) => (
                        <span key={`${anchor.id}-${value}`} className="rounded-full border border-white/10 px-2 py-1">{value}</span>
                      ))}
                    </div>
                  ) : null}
                  {anchor.linkedParentCandidate ? <div className="mt-2 text-xs text-amber-300">Parent hint: {anchor.linkedParentCandidate}</div> : null}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setAnchorState((current) => ({ ...current, [anchor.id]: "accepted" }))}
                      className="rounded-full border border-emerald-500/40 px-3 py-1 text-emerald-200"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnchorState((current) => ({ ...current, [anchor.id]: "dismissed" }))}
                      className="rounded-full border border-white/10 px-3 py-1 text-zinc-300"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      disabled={busyAnchorId === anchor.id}
                      onClick={() => promoteAnchor(anchor)}
                      className="rounded-full border border-blue-500/50 px-3 py-1 text-blue-200 disabled:opacity-40"
                    >
                      {busyAnchorId === anchor.id ? "Promoting..." : "Promote"}
                    </button>
                  </div>
                </div>
              ))}
              {resolvedAnchors.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">Keep writing. Anchors appear as structure becomes legible.</div>}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-zinc-900/70 p-4 text-sm">
            <h3 className="text-sm font-semibold text-zinc-100">Map-aware links</h3>
            <div className="mt-3 space-y-2 text-zinc-300">
              {suggestedLinks.map((item) => (
                <div key={`${item.entityType}-${item.entityId}`} className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{item.entityType}</div>
                  <div className="mt-1 font-medium text-zinc-100">{item.entityId}</div>
                  <div className="mt-1 text-xs text-zinc-400">{item.matchReason ?? "Persisted structural suggestion."}</div>
                </div>
              ))}
              {suggestedLinks.length === 0 && <div className="text-zinc-500">No persisted domain/law/lineage/entity suggestions for the selected anchor.</div>}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-zinc-900/70 p-4 text-sm">
            <h3 className="text-sm font-semibold text-zinc-100">Weak links and open questions</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3">
                <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Weak links</div>
                <ul className="mt-2 space-y-2 text-zinc-300">
                  {inference.weakLinks.map((item) => (
                    <li key={item.code}>{item.message}</li>
                  ))}
                  {inference.weakLinks.length === 0 && <li className="text-emerald-300">No structural weak links detected.</li>}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3">
                <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Open questions</div>
                <ul className="mt-2 space-y-2 text-zinc-300">
                  {inference.openQuestions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                  {inference.openQuestions.length === 0 && <li className="text-emerald-300">No major structural ambiguity right now.</li>}
                </ul>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-zinc-900/70 p-4 text-sm">
            <h3 className="text-sm font-semibold text-zinc-100">Promotions and provenance</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3">
                <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Persisted links</div>
                <div className="mt-2 space-y-2 text-zinc-300">
                  {persistedLinks.map((link) => (
                    <div key={link.id}>{link.entityType} to {link.entityId} ({link.linkStatus})</div>
                  ))}
                  {persistedLinks.length === 0 && <div className="text-zinc-500">Nothing promoted or linked yet.</div>}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3">
                <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Promotion events</div>
                <div className="mt-2 space-y-2 text-zinc-300">
                  {promotions.map((event) => (
                    <div key={event.id}>Promoted {event.createdEntityType} from "{event.sourceText.slice(0, 72)}"</div>
                  ))}
                  {promotions.length === 0 && <div className="text-zinc-500">No promotions yet.</div>}
                </div>
              </div>
            </div>
            {error ? <div className="mt-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}
          </article>

          <article className="rounded-3xl border border-white/10 bg-zinc-900/70 p-4 text-sm">
            <button type="button" onClick={() => setShowDebug((value) => !value)} className="rounded-full border border-white/20 px-3 py-1 text-zinc-300">
              {showDebug ? "Hide" : "Show"} internal tri-readable inspector
            </button>
            {showDebug ? (
              <pre className="mt-3 max-h-64 overflow-auto rounded-2xl bg-zinc-950 p-3 text-[11px] text-zinc-300">
                {JSON.stringify({ draftId, selectedAnchor, compileReadable }, null, 2)}
              </pre>
            ) : null}
          </article>
        </section>
      </div>
    </KhalOpsShell>
  );
}
