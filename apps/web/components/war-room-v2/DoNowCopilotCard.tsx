"use client";

import { useState } from "react";
import type { DoNowCopilotCard as DoNowCopilotCardType } from "./types";
import { createExecutionTask } from "../../lib/war-room/actions";

export function DoNowCopilotCard({
  copilot,
  onQueued,
  blocked,
  blockedReason
}: {
  copilot: DoNowCopilotCardType;
  onQueued?: () => Promise<void> | void;
  blocked?: boolean;
  blockedReason?: string;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleQueue = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await createExecutionTask({
        title: copilot.ctaPayload.title,
        sourceType: copilot.ctaPayload.sourceType,
        sourceId: copilot.ctaPayload.sourceId,
        horizon: copilot.ctaPayload.horizon,
        notes: copilot.ctaPayload.notes
      });
      await onQueued?.();
      setMessage("Queued in Surgical Execution.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to queue action.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass p-4 rounded-xl border border-emerald-500/20">
      <div className="text-[10px] uppercase tracking-widest text-emerald-300/90 mb-2">Do-Now Copilot</div>
      <div className="space-y-2 text-xs mb-3">
        <div className="rounded-lg border border-white/10 bg-zinc-950/55 px-3 py-2 text-zinc-200">{copilot.promptState}</div>
        <div className="rounded-lg border border-white/10 bg-zinc-950/55 px-3 py-2 text-zinc-100 font-semibold">{copilot.suggestedAction}</div>
        <div className="rounded-lg border border-white/10 bg-zinc-950/55 px-3 py-2 text-zinc-300">{copilot.rationale}</div>
      </div>

      <button
        onClick={handleQueue}
        disabled={saving || blocked}
        className="w-full px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-[11px] font-bold uppercase tracking-widest text-white"
      >
        {saving ? "Queuing..." : blocked ? "Blocked by No-Ruin Gate" : "Queue in Surgical Execution"}
      </button>
      {blocked && blockedReason && <div className="mt-2 text-[11px] text-red-300">{blockedReason}</div>}
      {message && <div className="mt-2 text-[11px] text-zinc-300">{message}</div>}
    </section>
  );
}
