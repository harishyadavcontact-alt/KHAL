import React from "react";
import Link from "next/link";
import { ChevronRight, Sword } from "lucide-react";
import { Task } from "./types";
import { cn } from "./utils";

export const TaskKillChain = ({ tasks }: { tasks: Task[] }) => {
  const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority).slice(0, 5);

  return (
    <div className="glass p-4 rounded-lg h-full border border-white/10">
      <h3 className="text-sm font-bold mb-3 uppercase tracking-widest flex items-center gap-2">
        <Sword className="text-emerald-400" size={16} />
        Surgical Kill Chain
      </h3>
      <div className="space-y-2">
        {sortedTasks.map((task) => (
          <div key={task.id} className="p-2.5 bg-zinc-800/50 border border-white/5 rounded-md flex items-center justify-between group hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className={cn("w-2 h-2 rounded-full", task.type === "affair" ? "bg-blue-400" : "bg-emerald-400")} />
              <div>
                <div className="text-sm font-medium line-clamp-1">{task.title}</div>
                <div className="text-[10px] uppercase text-zinc-500 font-mono">{task.domainId}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-mono font-bold text-zinc-400">P:{task.priority}</div>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </div>
          </div>
        ))}
        {!sortedTasks.length && <div className="text-xs text-zinc-500">No tasks in execution chain yet.</div>}
      </div>
      <Link href="/surgical-execution" className="block w-full mt-3 py-2 text-center text-[11px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors">
        View Full Chain
      </Link>
    </div>
  );
};
