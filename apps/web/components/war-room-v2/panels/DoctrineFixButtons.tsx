import React from "react";
import type { TriageSuggestion } from "../types";

export function DoctrineFixButtons({
  suggestions,
  onApply
}: {
  suggestions: TriageSuggestion[];
  onApply?: (suggestionId: string) => Promise<void> | void;
}) {
  const actionable = suggestions.filter((item) => Boolean(item.actionKind));
  if (!actionable.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {actionable.slice(0, 4).map((item) => (
        <button
          key={item.id}
          onClick={() => onApply?.(item.id)}
          className="rounded border border-emerald-500/35 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-200"
        >
          {item.title}
        </button>
      ))}
    </div>
  );
}

