import Link from "next/link";
import React from "react";
import { ArrowRight } from "lucide-react";
import type { AppData } from "../types";
import { buildDoNowItems } from "../../../lib/war-room/operational-metrics";

export function OperationalDoNowPanel({ data }: { data: AppData }) {
  const items = React.useMemo(() => buildDoNowItems(data, 5), [data]);

  return (
    <section className="glass p-4 rounded-xl border border-white/10 mb-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Do-Now Command</div>
          <h2 className="text-base font-bold text-zinc-100">Operational clarity now</h2>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">Top 5 with explainability</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-2.5">
        {items.map((item, index) => (
          <Link
            key={`${item.refType}-${item.refId}`}
            href={item.route}
            className="block rounded-lg border border-white/10 bg-zinc-950/55 hover:border-blue-400/40 transition-colors px-3 py-2.5"
          >
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
              <span>
                #{index + 1} {item.refType}
              </span>
              <span>score {item.score}</span>
            </div>
            <div className="text-sm font-semibold text-zinc-100 line-clamp-2">{item.title}</div>
            <div className="text-xs text-zinc-400 mt-1 line-clamp-2">{item.why}</div>
            <div className="mt-2 text-[10px] uppercase tracking-widest text-blue-300 flex items-center gap-1">
              Open
              <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>

      {!items.length && <div className="text-xs text-zinc-500">No active obligations, options, or tasks yet.</div>}
    </section>
  );
}
