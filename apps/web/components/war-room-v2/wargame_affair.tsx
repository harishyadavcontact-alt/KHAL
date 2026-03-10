import React from "react";
import { useRouter } from "next/navigation";
import { Affair, Craft, Domain, VolatilitySourceDto } from "./types";

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
  const inheritedProfile = sources.flatMap((source) => source.mapProfiles ?? []).find((profile) => profile.affairId === affairId);
  const inheritedSource = sources.find((source) => source.id === inheritedProfile?.sourceId);
  const inheritedCraft = crafts.find((craft) => craft.id === inheritedProfile?.primaryCraftId);

  return (
    <section className="glass p-5 rounded-xl border border-white/10 mb-6">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Affair WarGame Protocol</h3>
        <span className="text-[10px] font-mono text-zinc-500 uppercase">State of Affairs</span>
      </div>
      <div className="text-lg font-semibold mb-3">{affair?.title ?? "Select an affair"}</div>
      <div className="mb-3 text-xs text-zinc-400">Affairs are obligations that address fragility immediately and move the operator toward robustness.</div>
      {inheritedProfile ? (
        <div className="mb-4 grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-3 text-xs">
          <div className="rounded-lg border border-white/10 bg-zinc-900/40 p-3">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Inherited From State of the Art</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Source</div>
                <div className="mt-1 text-zinc-200">{inheritedSource?.name ?? inheritedProfile.sourceId}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Quadrant</div>
                <div className="mt-1 text-zinc-200">{inheritedProfile.quadrant}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Hedge</div>
                <div className="mt-1 text-zinc-200">{inheritedProfile.hedgeText ?? "Undefined"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Fragility</div>
                <div className="mt-1 text-zinc-200">{inheritedProfile.fragilityPosture ?? "Undefined"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Craft</div>
                <div className="mt-1 text-zinc-200">{inheritedCraft?.name ?? inheritedProfile.primaryCraftId ?? "Unassigned"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Heuristics</div>
                <div className="mt-1 text-zinc-200">{inheritedProfile.heuristicsText ?? "Undefined"}</div>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-zinc-900/40 p-3">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Surface Split</div>
            <div className="space-y-2 text-zinc-300">
              <div>War Gaming here is the planning lens for this obligation.</div>
              <div>The operational lane lives under the Affairs surface and Decision Chamber.</div>
            </div>
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

