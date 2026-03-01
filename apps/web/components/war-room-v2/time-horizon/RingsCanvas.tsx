import React, { useMemo } from "react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";

interface RingsCanvasProps {
  now: Date;
}

function progress(now: Date, start: Date, end: Date): number {
  const pct = (now.getTime() - start.getTime()) / Math.max(1, end.getTime() - start.getTime());
  return Math.max(0, Math.min(1, pct));
}

export function RingsCanvas({ now }: RingsCanvasProps) {
  const data = useMemo(() => {
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
    const quarter = Math.floor(now.getMonth() / 3);
    const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
    const quarterEnd = new Date(now.getFullYear(), quarter * 3 + 3, 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const weekOffset = (now.getDay() + 6) % 7;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - weekOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    return [
      { subject: "Year", value: Math.round(progress(now, yearStart, yearEnd) * 100) },
      { subject: "Quarter", value: Math.round(progress(now, quarterStart, quarterEnd) * 100) },
      { subject: "Month", value: Math.round(progress(now, monthStart, monthEnd) * 100) },
      { subject: "Week", value: Math.round(progress(now, weekStart, weekEnd) * 100) },
      { subject: "Day", value: Math.round(progress(now, dayStart, dayEnd) * 100) }
    ];
  }, [now]);

  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-widest font-mono text-zinc-500 mb-2">Temporal Rings</div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#3f3f46" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
            <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
