import React from "react";
import { useRouter } from "next/navigation";
import { Affair, Craft, Domain, VolatilitySourceDto } from "./types";
import { affairProjectionDrift, projectionForAffair } from "../../lib/war-room/state-of-art";

interface WarGameAffairProps {
  affairId?: string;
  affairs: Affair[];
  domains: Domain[];
  sources: VolatilitySourceDto[];
  crafts: Craft[];
}

export function WarGameAffair({ affairId, affairs, domains, sources, crafts }: WarGameAffairProps) {
  const router = useRouter();
  const affair = affairs.find((item) => item.id === affairId);
  const domain = domains.find((item) => item.id === affair?.domainId);
  const projection = projectionForAffair({ affairId, sources, domains, crafts });
  const driftChecks = affairProjectionDrift({ affair, projection });

  return (
    <section className="glass p-5 rounded-xl border border-white/10 mb-6">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Affair WarGame Protocol</h3>
        <span className="text-[10px] font-mono text-zinc-500 uppercase">State of Affairs</span>
      </div>
      <div className="text-lg font-semibold mb-3">{affair?.title ?? "Select an affair"}</div>
      <div className="mb-3 text-xs text-zinc-400">Affairs are obligations that address fragility immediately and move the operator toward robustness.</div>
      {projection ? (
        <div className="mb-4 grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-3 text-xs">
          <div className="rounded-lg border border-white/10 bg-zinc-900/40 p-3">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Inherited From State of the Art</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Source</div>
                <div className="mt-1 text-zinc-200">{projection.sourceName}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Quadrant</div>
                <div className="mt-1 text-zinc-200">{projection.quadrant}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Hedge</div>
                <div className="mt-1 text-zinc-200">{projection.ends.hedge ?? "Undefined"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Short Volatility</div>
                <div className="mt-1 text-zinc-200">{projection.stone.nonLinearity.shortVolatilityLabel ?? "Undefined"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Craft</div>
                <div className="mt-1 text-zinc-200">{projection.means.primaryCraftName ?? projection.means.primaryCraftId ?? "Unassigned"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Heuristics</div>
                <div className="mt-1 text-zinc-200">{projection.means.heuristics ?? "Undefined"}</div>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-zinc-900/40 p-3">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Surface Split</div>
            <div className="space-y-2 text-zinc-300">
              <div>War Gaming here is the planning lens for this obligation.</div>
              <div>The operational lane lives under the Affairs surface and Decision Chamber.</div>
            </div>
            {driftChecks.length ? (
              <div className="mt-3 space-y-2">
                {driftChecks.map((check) => (
                  <div key={check.id} className="rounded border border-white/10 bg-zinc-950/30 px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-zinc-200">{check.label}</div>
                      <div className={check.status === "aligned" ? "text-emerald-300" : check.status === "missing" ? "text-amber-300" : "text-red-300"}>
                        {check.status}
                      </div>
                    </div>
                    <div className="mt-1 text-zinc-500">{check.detail}</div>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => router.push(`/affairs?affairId=${encodeURIComponent(affairId ?? "")}`)}
                className="rounded bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-500"
              >
                Open Operational Affair
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Domain</div>
          <div className="text-zinc-200">{domain?.name ?? affair?.domainId ?? "Unknown"}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Obligations</div>
          <div className="text-zinc-200">{(affair?.plan?.objectives ?? []).length}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Means Craft</div>
          <div className="text-zinc-200">{affair?.means?.craftId || "Unassigned"}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Heuristics</div>
          <div className="text-zinc-200">{(affair?.means?.selectedHeuristicIds ?? []).length}</div>
        </div>
      </div>
    </section>
  );
}

