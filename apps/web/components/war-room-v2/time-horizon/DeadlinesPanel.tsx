import React, { useState } from "react";
import { TimeHorizonDeadlineDto } from "../types";

interface DeadlinesPanelProps {
  deadlines: TimeHorizonDeadlineDto[];
  onCreate: (payload: { label: string; dueAt: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function formatRemaining(dueAt: string): string {
  const now = Date.now();
  const due = new Date(dueAt).getTime();
  const ms = Math.max(0, due - now);
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h ${mins}m`;
}

export function DeadlinesPanel({ deadlines, onCreate, onDelete }: DeadlinesPanelProps) {
  const [label, setLabel] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-widest font-mono text-zinc-500 mb-3">Deadlines</div>
      <div className="space-y-2 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
        {deadlines.length === 0 && <div className="text-xs text-zinc-500 italic">No deadlines set.</div>}
        {deadlines.map((deadline) => (
          <div key={deadline.id} className="p-3 rounded-xl bg-zinc-800/50 border border-white/5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{deadline.label}</div>
              <div className="text-[10px] uppercase tracking-widest font-mono text-zinc-500">
                {new Date(deadline.dueAt).toLocaleString()} - {formatRemaining(deadline.dueAt)} left
              </div>
            </div>
            <button
              className="text-xs px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600"
              onClick={async () => {
                setBusy(true);
                try {
                  await onDelete(deadline.id);
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2">
        <input
          className="bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm"
          placeholder="Deadline label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <input className="bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        <button
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-semibold text-white disabled:bg-zinc-700"
          disabled={!label.trim() || !dueAt || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onCreate({ label: label.trim(), dueAt: new Date(dueAt).toISOString() });
              setLabel("");
              setDueAt("");
            } finally {
              setBusy(false);
            }
          }}
        >
          Add Deadline
        </button>
      </div>
    </div>
  );
}
