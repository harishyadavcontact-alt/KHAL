import React from "react";
import type { AppData } from "../types";
import { computeAlertQueue } from "../../../lib/war-room/operational-metrics";

function severityClass(severity: "CRITICAL" | "WATCH" | "INFO"): string {
  if (severity === "CRITICAL") return "text-red-300 border-red-500/30 bg-red-500/10";
  if (severity === "WATCH") return "text-amber-300 border-amber-500/30 bg-amber-500/10";
  return "text-blue-300 border-blue-500/30 bg-blue-500/10";
}

export function AlertQueuePanel({ data, compact = false }: { data: AppData; compact?: boolean }) {
  const queue = computeAlertQueue(data);

  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Action Queue</div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-100">Prioritized Alerts</h3>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">{queue.length} active</div>
      </div>

      <div className="space-y-2">
        {queue.slice(0, compact ? 3 : 6).map((item) => (
          <div key={item.id} className={`rounded border px-2.5 py-2 ${severityClass(item.severity)}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold">{item.title}</div>
              <span className="text-[10px] uppercase tracking-widest">{item.severity}</span>
            </div>
            <div className="text-[11px] opacity-90 mt-1">{item.reason}</div>
            {item.nextAction ? <div className="text-[11px] opacity-80 mt-1">Next: {item.nextAction}</div> : null}
          </div>
        ))}
        {!queue.length && <div className="text-xs text-zinc-500">No active alerts in current scope.</div>}
      </div>
    </section>
  );
}
