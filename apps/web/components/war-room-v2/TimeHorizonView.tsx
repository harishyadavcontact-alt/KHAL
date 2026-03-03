import React, { useEffect, useState } from "react";
import { Task, TimeHorizonDeadlineDto, TimeHorizonProfileDto, UserProfile } from "./types";
import { TemporalHUD } from "./time-horizon/TemporalHUD";
import { RingsCanvas } from "./time-horizon/RingsCanvas";
import { DeadlinesPanel } from "./time-horizon/DeadlinesPanel";

interface TimeHorizonResponse {
  userKey: string;
  profile: TimeHorizonProfileDto;
  deadlines: TimeHorizonDeadlineDto[];
}

interface TimeHorizonViewProps {
  user: UserProfile;
}

export function TimeHorizonView({ user }: TimeHorizonViewProps) {
  const [now, setNow] = useState(new Date());
  const [profile, setProfile] = useState<TimeHorizonProfileDto>({
    focusText: "define your north star",
    dobIso: user.birthDate,
    lifeExpectancyYears: user.lifeExpectancy
  });
  const [deadlines, setDeadlines] = useState<TimeHorizonDeadlineDto[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [focusDraft, setFocusDraft] = useState(profile.focusText);
  const [calendarUrl, setCalendarUrl] = useState("/api/calendar/ics");
  const [scheduleTaskId, setScheduleTaskId] = useState("");
  const [scheduleDueAt, setScheduleDueAt] = useState("");
  const [scheduleHorizon, setScheduleHorizon] = useState<"WEEK" | "MONTH" | "QUARTER" | "YEAR">("WEEK");
  const [copyStatus, setCopyStatus] = useState<"idle" | "ok" | "error">("idle");
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/time-horizon")
      .then((res) => res.json())
      .then((data: TimeHorizonResponse) => {
        if (data?.profile) {
          setProfile(data.profile);
          setFocusDraft(data.profile.focusText ?? "");
        }
        setDeadlines(Array.isArray(data?.deadlines) ? data.deadlines : []);
      });
    fetch("/api/war-room-data")
      .then((res) => res.json())
      .then((data) => {
        setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
      });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCalendarUrl(`${window.location.origin}/api/calendar/ics`);
    }
  }, []);

  const saveFocus = async () => {
    const res = await fetch("/api/time-horizon/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ focusText: focusDraft })
    });
    const json = (await res.json()) as TimeHorizonResponse;
    if (json?.profile) setProfile(json.profile);
  };

  const createDeadline = async (payload: { label: string; dueAt: string }) => {
    const res = await fetch("/api/time-horizon/deadlines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const row = (await res.json()) as TimeHorizonDeadlineDto;
    setDeadlines((prev) => [...prev, row].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()));
  };

  const deleteDeadline = async (id: string) => {
    await fetch(`/api/time-horizon/deadlines/${id}`, { method: "DELETE" });
    setDeadlines((prev) => prev.filter((item) => item.id !== id));
  };

  const scheduleTask = async () => {
    if (!scheduleTaskId || !scheduleDueAt) return;
    setScheduleError(null);
    const dueDate = new Date(scheduleDueAt).toISOString();
    const res = await fetch(`/api/tasks/${scheduleTaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueDate, horizon: scheduleHorizon })
    });
    if (!res.ok) {
      setScheduleError("Failed to schedule task. Try again.");
      return;
    }
    setTasks((prev) =>
      prev.map((task) => (task.id === scheduleTaskId ? { ...task, dueDate, horizon: scheduleHorizon } : task))
    );
    setScheduleTaskId("");
    setScheduleDueAt("");
    setScheduleHorizon("WEEK");
  };

  const scheduled = tasks.filter((task) => Boolean(task.dueDate)).sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime());
  const unscheduled = tasks.filter((task) => !task.dueDate);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <TemporalHUD
        now={now}
        focusText={profile.focusText}
        location={user.location}
        birthDateIso={profile.dobIso || user.birthDate}
        lifeExpectancyYears={profile.lifeExpectancyYears || user.lifeExpectancy}
      />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RingsCanvas now={now} />
          <div className="glass rounded-2xl p-4 mt-4">
            <div className="text-[10px] uppercase tracking-widest font-mono text-zinc-500 mb-2">North Star</div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm"
                value={focusDraft}
                onChange={(e) => setFocusDraft(e.target.value)}
                placeholder="define your north star"
              />
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-semibold text-white" onClick={saveFocus}>
                Save
              </button>
            </div>
          </div>
          <div className="glass rounded-2xl p-4 mt-4 space-y-3">
            <div className="text-[10px] uppercase tracking-widest font-mono text-zinc-500">Execution Scheduling</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <select className="bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm md:col-span-2" value={scheduleTaskId} onChange={(e) => setScheduleTaskId(e.target.value)}>
                <option value="">Select task</option>
                {unscheduled.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
              <input className="bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm" type="datetime-local" value={scheduleDueAt} onChange={(e) => setScheduleDueAt(e.target.value)} />
              <select className="bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm" value={scheduleHorizon} onChange={(e) => setScheduleHorizon(e.target.value as "WEEK" | "MONTH" | "QUARTER" | "YEAR")}>
                <option value="WEEK">WEEK</option>
                <option value="MONTH">MONTH</option>
                <option value="QUARTER">QUARTER</option>
                <option value="YEAR">YEAR</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-zinc-400">Unscheduled: {unscheduled.length} | Scheduled: {scheduled.length}</div>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-semibold text-white disabled:bg-zinc-700" disabled={!scheduleTaskId || !scheduleDueAt} onClick={scheduleTask}>
                Place on Timeline
              </button>
            </div>
            {scheduleError && <div className="text-xs text-red-400">{scheduleError}</div>}
            <div className="max-h-44 overflow-y-auto custom-scrollbar pr-1 space-y-2">
              {scheduled.slice(0, 12).map((task) => (
                <div key={task.id} className="p-2 rounded bg-zinc-900/60 border border-white/5 text-xs">
                  <div className="font-medium text-zinc-200">{task.title}</div>
                  <div className="text-zinc-500 uppercase tracking-widest">{new Date(task.dueDate!).toLocaleString()} - {task.horizon ?? "WEEK"}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-2xl p-4 mt-4 space-y-2">
            <div className="text-[10px] uppercase tracking-widest font-mono text-zinc-500">Calendar Sync (ICS)</div>
            <div className="text-xs text-zinc-300 break-all">{calendarUrl}</div>
            <div className="flex gap-2">
              <button
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-xs font-semibold text-white"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(calendarUrl);
                    setCopyStatus("ok");
                  } catch {
                    setCopyStatus("error");
                  }
                }}
              >
                Copy URL
              </button>
              <a className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-xs font-semibold text-white" href="/api/calendar/ics" target="_blank" rel="noreferrer">
                Open Feed
              </a>
            </div>
            <div className="text-[11px] text-zinc-500">
              Use this feed in calendar tools that support ICS subscription/import. For Notion Calendar, connect the calendar account where this feed is imported/subscribed.
            </div>
            {copyStatus === "ok" && <div className="text-[11px] text-emerald-400">Calendar URL copied.</div>}
            {copyStatus === "error" && <div className="text-[11px] text-red-400">Clipboard copy failed. Copy manually.</div>}
          </div>
        </div>
        <DeadlinesPanel deadlines={deadlines} onCreate={createDeadline} onDelete={deleteDeadline} />
      </div>
    </div>
  );
}
