import type { FragilistaWatchItem } from "../types";

function bandClass(band: FragilistaWatchItem["sitgBand"]): string {
  if (band === "LOW") return "text-red-300";
  if (band === "MEDIUM") return "text-amber-300";
  return "text-emerald-300";
}

export function FragilistaWatchlistPanel({ items }: { items: FragilistaWatchItem[] }) {
  const top = items[0];

  return (
    <section className="glass p-4 rounded-xl border border-white/10">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Risk Accountability</div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-100">Fragilista Watchlist</h3>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">SITG</div>
      </div>

      {!!top && top.sitgBand === "LOW" && (
        <div className="mb-3 rounded border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-200">
          Critical: top actor has low skin-in-the-game posture.
        </div>
      )}

      <div className="overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-zinc-500 uppercase tracking-widest text-[10px]">
            <tr>
              <th className="py-1.5 font-normal">Entity / Risk</th>
              <th className="py-1.5 font-normal">SITG</th>
              <th className="py-1.5 font-normal">Reason</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-white/5 align-top">
                <td className="py-2 pr-2">
                  <div className="font-semibold text-zinc-200">{item.entityLabel}</div>
                  <div className="text-zinc-300 line-clamp-1">{item.title}</div>
                  <div className="text-[11px] text-zinc-500">
                    {item.domainLabel} | {item.sourceLabel}
                  </div>
                </td>
                <td className={`py-2 pr-2 font-semibold ${bandClass(item.sitgBand)}`}>{item.sitgBand}</td>
                <td className="py-2 text-zinc-400">{item.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!items.length && <div className="text-xs text-zinc-500">No open risks in current scope.</div>}
    </section>
  );
}
