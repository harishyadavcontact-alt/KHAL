import React, { useEffect, useMemo, useState } from "react";
import { Activity, Clock } from "lucide-react";
import { addYears, differenceInCalendarMonths, differenceInSeconds } from "date-fns";
import { AppData } from "./types";

const AGE_TARGET_YEARS = 24;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export const HUD = ({ user }: { user: AppData["user"] }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const birth = useMemo(() => new Date(user.birthDate), [user.birthDate]);
  const expectedEnd = useMemo(() => addYears(birth, user.lifeExpectancy), [birth, user.lifeExpectancy]);

  const elapsedSeconds = Math.max(0, differenceInSeconds(now, birth));
  const elapsedMonths = Math.max(0, differenceInCalendarMonths(now, birth));
  const years = Math.floor(elapsedMonths / 12);
  const months = elapsedMonths % 12;
  const hours = Math.floor((elapsedSeconds % (24 * 3600)) / 3600);
  const mins = Math.floor((elapsedSeconds % 3600) / 60);
  const secs = elapsedSeconds % 60;

  const ageYears = elapsedSeconds / (365.25 * 24 * 3600);
  const ageTargetProgress = clamp((ageYears / AGE_TARGET_YEARS) * 100, 0, 100);
  const yearsToTarget = AGE_TARGET_YEARS - ageYears;
  const targetLabel = yearsToTarget >= 0 ? `${yearsToTarget.toFixed(2)}y to target` : `${Math.abs(yearsToTarget).toFixed(2)}y past target`;

  return (
    <div className="glass p-4 rounded-xl flex flex-wrap items-center justify-between gap-6 mb-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-500/20 rounded-lg">
          <Clock className="text-blue-400 w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Temporal Position</div>
          <div className="text-xl font-mono font-bold">
            {years}y {months}mo {hours}h {mins}m {secs}s
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">Horizon ends {expectedEnd.getFullYear()}</div>
        </div>
      </div>

      <div className="flex-1 max-w-md">
        <div className="flex justify-between text-xs mb-1 font-mono uppercase tracking-widest text-zinc-500">
          <span>Age Proximity (Target: {AGE_TARGET_YEARS}y)</span>
          <span>{ageYears.toFixed(2)}y</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: `${ageTargetProgress}%` }} />
        </div>
        <div className="mt-1 text-[10px] text-zinc-500 font-mono uppercase">{targetLabel}</div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Location</div>
          <div className="text-sm font-medium">{user.location}</div>
        </div>
        <div className="p-3 bg-emerald-500/20 rounded-lg">
          <Activity className="text-emerald-400 w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
