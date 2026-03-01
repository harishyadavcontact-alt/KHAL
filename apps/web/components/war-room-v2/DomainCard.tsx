import React from "react";
import { motion } from "motion/react";
import { Domain } from "./types";
import { cn } from "./utils";

export const DomainCard = ({ domain, onClick }: { domain: Domain; onClick: () => void; key?: string }) => {
  const stakes = (domain.stakesText ?? "").toLowerCase();
  const status = stakes.includes("death") || stakes.includes("civilizational") || stakes.includes("civisilizational") ? "CRITICAL" : "STABLE";
  const color = status === "CRITICAL" ? "text-red-400" : "text-emerald-400";

  return (
    <motion.div whileHover={{ y: -4 }} onClick={onClick} className="glass p-5 rounded-xl cursor-pointer hover:border-blue-500/30 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-bold group-hover:text-blue-400 transition-colors">{domain.name}</h4>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">{domain.volatilitySourceName ?? domain.volatility ?? domain.volatilitySource}</p>
        </div>
        <div className={cn("text-[10px] font-mono font-bold px-2 py-1 rounded bg-zinc-800", color)}>{status}</div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <div className="text-[10px] text-zinc-500 uppercase font-mono mb-1">Stakes</div>
          <div className="text-xs text-zinc-300 line-clamp-1">{domain.stakesText ?? "Undefined"}</div>
        </div>
        <div>
          <div className="text-[10px] text-zinc-500 uppercase font-mono mb-1">Ends: Hedge</div>
          <div className="text-xs text-zinc-300 line-clamp-1">{domain.hedge ?? "Define hedge"}</div>
        </div>
      </div>

      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div className={cn("h-full", status === "CRITICAL" ? "bg-red-500" : "bg-emerald-500")} style={{ width: status === "CRITICAL" ? "90%" : "30%" }} />
      </div>
    </motion.div>
  );
};
