"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { useEffect } from "react";
import { KhalFinalMark } from "../../components/branding/KhalFinalMark";
import { KhalWordmark } from "../../components/branding/KhalWordmark";
import { KhalOpsShell } from "../../components/ops-shell/KhalOpsShell";
import { KHAL_OPS_NAV_ITEMS } from "../../components/ops-shell/nav-config";
import { prewarmWarRoomData } from "../../lib/war-room/useWarRoomData";

const MODULE_COPY: Record<string, string> = {
  "/home": "Operational launch surface",
  "/dashboard": "Temporal, posture, and fragility view",
  "/war-room": "Macro domain command center",
  "/missionCommand": "Mission hierarchy and chain of command",
  "/source-of-volatility": "Six-law volatility mapping",
  "/interests": "Optionality lane and convex upside",
  "/affairs": "Obligation lane and fragility removal",
  "/war-gaming": "Scenario simulation and planning",
  "/surgical-execution": "Execution readiness and task chain",
  "/crafts-library": "Means, models, frameworks, and heuristics",
  "/time-horizon": "Temporal constraints and deadlines",
  "/lineage-map": "Lineage exposure and links"
};

const PREFETCH_ROUTES = [
  ...new Set([...KHAL_OPS_NAV_ITEMS.map((item) => item.href), "/brand", "/khal/logo", "/khal/wordmark"])
];

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const maybeWindow =
      typeof window !== "undefined"
        ? (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number })
        : null;
    const idle = maybeWindow?.requestIdleCallback;

    const prefetch = () => {
      for (const route of PREFETCH_ROUTES) {
        router.prefetch(route);
      }
      void prewarmWarRoomData();
    };

    if (idle) {
      idle(prefetch, { timeout: 1200 });
    } else {
      timeout = setTimeout(prefetch, 120);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [router]);

  return (
    <KhalOpsShell title="Home" subtitle="Operational Gateway">
      <div className="mx-auto w-full max-w-7xl px-3 py-5">
        <section className="glass mb-4 rounded-lg border border-white/10 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-zinc-300">
              <Home size={14} className="text-zinc-400" />
              <span className="text-xs uppercase tracking-[0.16em]">Home</span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Unified Ops Surface</span>
          </div>
          <div className="grid place-items-center gap-2 border-t border-white/10 pt-4">
            <KhalWordmark size={70} />
            <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              <KhalFinalMark size={16} />
              Precision Runtime Ready
            </span>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {KHAL_OPS_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onMouseEnter={() => router.prefetch(item.href)}
                className="glass flex items-start justify-between rounded-lg border border-white/10 px-3 py-3 transition-colors hover:bg-zinc-900/75"
              >
                <div className="min-w-0">
                  <div className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-zinc-100">
                    <Icon size={14} className="text-zinc-400" />
                    {item.label}
                  </div>
                  <p className="text-xs text-zinc-400">{MODULE_COPY[item.href] ?? "Open module"}</p>
                </div>
                <span className="ml-3 text-[10px] uppercase tracking-[0.12em] text-zinc-500">Open</span>
              </Link>
            );
          })}
        </section>

        <section className="glass mt-4 rounded-lg border border-white/10 px-3 py-2">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            <span>Fast Path Cache</span>
            <span>Route + Data Prefetch Enabled</span>
          </div>
        </section>
      </div>
    </KhalOpsShell>
  );
}
