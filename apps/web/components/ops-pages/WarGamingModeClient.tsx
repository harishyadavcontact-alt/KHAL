"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KhalOpsShell } from "../ops-shell/KhalOpsShell";
import { WarGaming } from "../war-room-v2/WarGaming";
import type { WarGameRouteMode } from "../../lib/war-room/route-mode";
import { saveWarGameProtocol } from "../../lib/war-room/actions";
import { useWarGamingBootstrap } from "../../lib/war-room/useWarGamingBootstrap";

export function WarGamingModeClient({ mode, targetId, onboarding = false }: { mode: WarGameRouteMode; targetId?: string; onboarding?: boolean }) {
  const router = useRouter();
  const { data, loading, error, refresh } = useWarGamingBootstrap();
  const [sourceDraft, setSourceDraft] = useState("");
  const [saveState, setSaveState] = useState<{ saving: boolean; error: string | null }>({ saving: false, error: null });

  const submitSources = async () => {
    const names = sourceDraft
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (!names.length) {
      setSaveState({ saving: false, error: "Enter at least one source of volatility." });
      return;
    }

    setSaveState({ saving: true, error: null });
    try {
      const response = await fetch("/api/volatility-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to save volatility sources.");
      }

      const payload = (await response.json()) as { firstSourceId?: string | null };
      setSourceDraft("");
      setSaveState({ saving: false, error: null });
      await refresh();
      const nextTarget = payload.firstSourceId ? `?target=${encodeURIComponent(payload.firstSourceId)}&onboarding=1` : "?onboarding=1";
      router.replace(`/war-gaming/source${nextTarget}`);
    } catch (error) {
      setSaveState({
        saving: false,
        error: error instanceof Error ? error.message : "Failed to save volatility sources."
      });
    }
  };

  const showOnboardingGuide = onboarding && mode === "source";
  const hasSources = Boolean(data?.sources?.length);

  return (
    <KhalOpsShell title="War Gaming" subtitle={`War Gaming: ${mode}`}>
      {!data || loading ? (
        <div className="mx-auto max-w-7xl p-5 text-[var(--color-text-muted)]">Loading War Gaming...</div>
      ) : error ? (
        <div className="max-w-7xl mx-auto p-5 text-red-300">{error}</div>
      ) : (
        <div className="space-y-4">
          {showOnboardingGuide ? (
            <div className="mx-auto max-w-7xl px-5 pt-5">
              <div className="khal-panel-strong p-5">
                <div className="khal-meta text-[10px]">First Decision Loop</div>
                <h2 className="khal-title mt-2 text-xl font-semibold">First we need to war-game your sources of volatility.</h2>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  Start with each volatility source. For each one, identify the domains it touches. Then in each domain capture stakes, risks, fragility, hedge, and edge.
                </p>
                <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="khal-editor-block p-4">
                    <div className="khal-meta text-[10px]">Source Register</div>
                    <h3 className="khal-title mt-2 text-base font-semibold">List your current sources of volatility</h3>
                    <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                      Enter one source per line. Examples: health, cash flow, family obligations, market exposure, legal uncertainty.
                    </p>
                    <textarea
                      value={sourceDraft}
                      onChange={(event) => setSourceDraft(event.target.value)}
                      rows={6}
                      className="khal-textarea mt-4"
                      placeholder={"Health\nCash flow\nFamily responsibilities\nMarket volatility"}
                    />
                    {saveState.error ? <div className="mt-3 text-sm text-red-300">{saveState.error}</div> : null}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => void submitSources()}
                        disabled={saveState.saving}
                        className="khal-button-accent px-4 py-2 text-sm font-semibold"
                      >
                        {saveState.saving ? "Saving..." : "Save Volatility Sources"}
                      </button>
                      <div className="text-xs text-[var(--color-text-faint)]">After saving, open one source and continue the war-game.</div>
                    </div>
                  </div>
                  <div className="khal-editor-block p-4">
                    <div className="khal-meta text-[10px]">Decision Sequence</div>
                    <div className="mt-3 space-y-3">
                      {[
                        "1. Capture each volatility source.",
                        "2. Select one source and identify the domains it touches.",
                        "3. In each domain, state the stakes and the risks.",
                        "4. Then define fragility, hedge, and edge.",
                        "5. Convert the highest-pressure items into action."
                      ].map((step, index) => (
                        <div key={step} className="khal-list-step px-3 py-3">
                          <div className="khal-meta text-[10px]">Step {index + 1}</div>
                          <div className="mt-1 text-sm text-[var(--color-text-strong)]">{step.replace(/^\d+\.\s*/, "")}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          {!showOnboardingGuide || hasSources ? (
            <WarGaming
              user={data.user}
              domains={data.domains}
              sources={data.sources ?? []}
              lineages={data.lineages?.nodes ?? []}
              affairs={data.affairs}
              interests={data.interests}
              crafts={data.crafts}
              tasks={data.tasks}
              lineageRisks={data.lineageRisks ?? []}
              missionGraph={data.missionGraph}
              doctrine={data.doctrine}
              confidence={data.confidence}
              protocolState={data.decisionAccelerationMeta?.protocolState}
              blastRadius={data.blastRadius}
              hedgeCoverage={data.hedgeCoverage}
              violationFeed={data.violationFeed}
              optionalityBudget={data.optionalityBudget}
              initialMode={mode}
              initialTargetId={targetId}
              onSourceMapSaved={async () => {
                await refresh();
              }}
              onAddTask={async (payload) => {
                await saveWarGameProtocol({ payload, mode, targetId, data });
                await refresh();
              }}
            />
          ) : null}
        </div>
      )}
    </KhalOpsShell>
  );
}

