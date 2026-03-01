import React from "react";
import { Affair, Interest } from "./types";

interface WarGameInterestProps {
  interestId?: string;
  interests: Interest[];
  affairs: Affair[];
}

export function WarGameInterest({ interestId, interests, affairs }: WarGameInterestProps) {
  const interest = interests.find((item) => item.id === interestId);
  const linkedAffairs = affairs.filter((affair) => affair.interestId === interestId);

  return (
    <section className="glass p-5 rounded-xl border border-white/10 mb-6">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Interest WarGame Protocol</h3>
        <span className="text-[10px] font-mono text-zinc-500 uppercase">Mode: Interest</span>
      </div>
      <div className="text-lg font-semibold mb-3">{interest?.title ?? "Select an interest"}</div>
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

