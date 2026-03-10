import React from "react";
import { useRouter } from "next/navigation";
import { Affair, Craft, Interest, VolatilitySourceDto } from "./types";

interface WarGameInterestProps {
  interestId?: string;
  interests: Interest[];
  affairs: Affair[];
  sources: VolatilitySourceDto[];
  crafts: Craft[];
}

export function WarGameInterest({ interestId, interests, affairs, sources, crafts }: WarGameInterestProps) {
  const router = useRouter();
  const interest = interests.find((item) => item.id === interestId);
  const linkedAffairs = affairs.filter((affair) => affair.interestId === interestId);
  const inheritedProfile = sources.flatMap((source) => source.mapProfiles ?? []).find((profile) => profile.interestId === interestId);
  const inheritedSource = sources.find((source) => source.id === inheritedProfile?.sourceId);
  const inheritedCraft = crafts.find((craft) => craft.id === inheritedProfile?.primaryCraftId);

  return (
    <section className="glass p-5 rounded-xl border border-white/10 mb-6">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Interest WarGame Protocol</h3>
        <span className="text-[10px] font-mono text-zinc-500 uppercase">State of Affairs</span>
      </div>
      <div className="text-lg font-semibold mb-3">{interest?.title ?? "Select an interest"}</div>
      <div className="mb-3 text-xs text-zinc-400">Interests are optional positions with capped downside that move the operator beyond robustness through convexity.</div>
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
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Edge</div>
                <div className="mt-1 text-zinc-200">{inheritedProfile.edgeText ?? "Undefined"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Avoid</div>
                <div className="mt-1 text-zinc-200">{inheritedProfile.avoidText ?? "Undefined"}</div>
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
              <div>War Gaming here evaluates the option as a planned position.</div>
              <div>The operational lanes live under Interests and Lab.</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => router.push(`/interests?interestId=${encodeURIComponent(interestId ?? "")}`)}
                className="rounded bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-500"
              >
                Open Operational Interest
              </button>
              <button
                type="button"
                onClick={() => router.push(`/lab?focus=${encodeURIComponent(interestId ?? "")}`)}
                className="rounded border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-zinc-200 hover:bg-white/5"
              >
                Open Lab Protocol
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Domain</div>
          <div className="text-zinc-200">{interest?.domainId ?? "Unknown"}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Options</div>
          <div className="text-zinc-200">{(interest?.objectives ?? []).length}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Perspective</div>
          <div className="text-zinc-200">{interest?.perspective ?? "macro"}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Linked Affairs</div>
          <div className="text-zinc-200">{linkedAffairs.length}</div>
        </div>
      </div>
    </section>
  );
}

