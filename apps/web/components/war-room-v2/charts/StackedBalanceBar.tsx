import React, { useMemo } from "react";
import type { BalanceSegment } from "../types";

interface StackedBalanceBarProps {
  segments: BalanceSegment[];
  showLegend?: boolean;
  emptyText?: string;
}

function toneColor(tone: BalanceSegment["tone"]): string {
  if (tone === "hedge") return "var(--viz-hedge)";
  if (tone === "edge") return "var(--viz-edge)";
  if (tone === "risk") return "var(--viz-risk)";
  if (tone === "safe") return "var(--viz-safe)";
  return "var(--viz-watch)";
}

export function StackedBalanceBar({ segments, showLegend = true, emptyText = "No balance data." }: StackedBalanceBarProps) {
  const total = useMemo(() => segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0), [segments]);

  if (!segments.length || total <= 0) {
    return <div className="viz-empty text-xs text-zinc-500">{emptyText}</div>;
  }

  return (
    <div className="viz-balance">
      <div className="viz-balance-track">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className="viz-balance-segment"
            style={{
              width: `${(Math.max(0, segment.value) / total) * 100}%`,
              backgroundColor: toneColor(segment.tone)
            }}
            title={`${segment.label} (${segment.value})`}
          />
        ))}
      </div>
      {showLegend ? (
        <div className="viz-balance-legend">
          {segments.map((segment) => (
            <div key={`legend-${segment.id}`} className="viz-balance-item">
              <span className="viz-balance-dot" style={{ backgroundColor: toneColor(segment.tone) }} />
              <span>{segment.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
