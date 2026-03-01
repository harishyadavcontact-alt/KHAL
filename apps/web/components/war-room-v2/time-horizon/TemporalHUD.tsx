import React, { useMemo } from "react";
import { Activity, Clock } from "lucide-react";
import { addYears, differenceInSeconds } from "date-fns";
import { motion } from "motion/react";

interface TemporalHUDProps {
  now: Date;
  focusText: string;
  location?: string;
  birthDateIso: string;
  lifeExpectancyYears: number;
}

export function TemporalHUD({ now, focusText, location, birthDateIso, lifeExpectancyYears }: TemporalHUDProps) {
  const computed = useMemo(() => {
    const birth = new Date(birthDateIso);
    const death = addYears(birth, lifeExpectancyYears);
    const secondsLived = Math.max(0, differenceInSeconds(now, birth));
    const totalSeconds = Math.max(1, differenceInSeconds(death, birth));
    const progress = (secondsLived / totalSeconds) * 100;

    const years = Math.floor(secondsLived / (365.25 * 24 * 3600));
    const days = Math.floor((secondsLived % (365.25 * 24 * 3600)) / (24 * 3600));
    const hours = Math.floor((secondsLived % (24 * 3600)) / 3600);
    const mins = Math.floor((secondsLived % 3600) / 60);
    const secs = secondsLived % 60;
    return { years, days, hours, mins, secs, progress };
  }, [birthDateIso, lifeExpectancyYears, now]);

  return (
    <div className="glass p-4 rounded-xl flex flex-wrap items-center justify-between gap-6 mb-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-500/20 rounded-lg">
          <Clock className="text-blue-400 w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Temporal Position</div>
          <div className="text-xl font-mono font-bold">
            {computed.years}y {computed.days}d {computed.hours}h {computed.mins}m {computed.secs}s
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-[240px] max-w-xl">
        <div className="flex justify-between text-xs mb-1 font-mono uppercase tracking-widest text-zinc-500">
          <span>Life Progress</span>
          <span>{computed.progress.toFixed(6)}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, computed.progress))}%` }} className="h-full bg-gradient-to-r from-blue-500 to-emerald-500" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Location</div>
          <div className="text-sm font-medium">{location ?? "Unknown"}</div>
          <div className="text-[10px] text-zinc-500 uppercase mt-1">{focusText || "define your north star"}</div>
        </div>
        <div className="p-3 bg-emerald-500/20 rounded-lg">
          <Activity className="text-emerald-400 w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
