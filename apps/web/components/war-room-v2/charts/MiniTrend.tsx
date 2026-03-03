import React from "react";

interface MiniTrendProps {
  values: number[];
  width?: number;
  height?: number;
  tone?: "risk" | "safe" | "watch";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toneColor(tone: NonNullable<MiniTrendProps["tone"]>): string {
  if (tone === "safe") return "var(--viz-safe)";
  if (tone === "watch") return "var(--viz-watch)";
  return "var(--viz-risk)";
}

export function MiniTrend({ values, width = 180, height = 48, tone = "watch" }: MiniTrendProps) {
  if (!values.length) {
    return <div className="viz-empty text-xs text-zinc-500">No trend data.</div>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const step = values.length === 1 ? 0 : width / (values.length - 1);

  const points = values
    .map((value, index) => {
      const normalized = (value - min) / range;
      const x = index * step;
      const y = clamp(height - normalized * height, 2, height - 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="viz-mini-trend" role="img" aria-label="Trend">
      <polyline points={points} fill="none" stroke={toneColor(tone)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
