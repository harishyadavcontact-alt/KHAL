"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Home, User2 } from "lucide-react";
import { useEffect, useState } from "react";
import { KhalFinalMark } from "../../components/branding/KhalFinalMark";
import { KhalWordmark } from "../../components/branding/KhalWordmark";
import { KhalOpsShell } from "../../components/ops-shell/KhalOpsShell";
import { KHAL_OPS_NAV_ITEMS } from "../../components/ops-shell/nav-config";
import { KHAL_MODULE_COPY } from "../../lib/navigation/sections";
import { prewarmWarRoomData } from "../../lib/war-room/useWarRoomData";

const PREFETCH_ROUTES = [
  ...new Set([...KHAL_OPS_NAV_ITEMS.map((item) => item.href), "/brand", "/khal/logo", "/khal/wordmark"])
];

type BootstrapState = {
  loading: boolean;
  onboarded: boolean;
  name: string;
  dobIso: string;
  lifeExpectancyYears: number;
  error: string | null;
  saving: boolean;
};

export default function HomePage() {
  const router = useRouter();
  const [bootstrap, setBootstrap] = useState<BootstrapState>({
    loading: true,
    onboarded: false,
    name: "",
    dobIso: "",
    lifeExpectancyYears: 80,
    error: null,
    saving: false
  });

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

  useEffect(() => {
    let cancelled = false;
    fetch("/api/operator/bootstrap")
      .then((response) => response.json())
      .then((payload: { onboarded?: boolean; user?: { name?: string; birthDate?: string; lifeExpectancy?: number } }) => {
        if (cancelled) return;
        setBootstrap((current) => ({
          ...current,
          loading: false,
          onboarded: Boolean(payload.onboarded),
          name: payload.user?.name === "Operator" ? "" : payload.user?.name ?? "",
          dobIso: payload.user?.birthDate?.slice(0, 10) ?? "",
          lifeExpectancyYears: payload.user?.lifeExpectancy ?? 80
        }));
      })
      .catch(() => {
        if (cancelled) return;
        setBootstrap((current) => ({ ...current, loading: false, error: "Failed to load operator profile." }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const submitBootstrap = async () => {
    setBootstrap((current) => ({ ...current, saving: true, error: null }));
    try {
      const response = await fetch("/api/operator/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bootstrap.name,
          dobIso: `${bootstrap.dobIso}T00:00:00.000Z`,
          lifeExpectancyYears: bootstrap.lifeExpectancyYears,
          volatilitySources: []
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to save onboarding.");
      }
      router.push("/war-gaming/source?onboarding=1");
    } catch (error) {
      setBootstrap((current) => ({
        ...current,
        saving: false,
        error: error instanceof Error ? error.message : "Failed to save onboarding."
      }));
      return;
    }
  };

  if (!bootstrap.loading && !bootstrap.onboarded) {
    return (
      <main className="min-h-screen bg-[var(--shell-hero)] px-4 py-6 text-[var(--color-text)]">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center">
          <section className="grid w-full gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="glass rounded-[28px] border border-[var(--color-border-strong)] p-6 md:p-8">
              <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-faint)]">Operator Intake</div>
              <div className="mt-4">
                <KhalWordmark size={84} />
                <div className="mt-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
                  <KhalFinalMark size={16} />
                  Decision clarity in under one second
                </div>
              </div>
              <h1 className="mt-8 max-w-2xl text-3xl font-semibold text-[var(--color-text)] md:text-4xl">Start with identity. Then enter source war-gaming.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">
                KHAL will first anchor the operator, then move directly into your volatility map. You will list sources of volatility inside War Gaming, not here.
              </p>
              <div className="mt-8 grid gap-3 md:grid-cols-2">
                <label className="text-sm text-[var(--color-text)]">
                  <span className="mb-1.5 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
                    <User2 size={13} />
                    Your name
                  </span>
                  <input
                    value={bootstrap.name}
                    onChange={(event) => setBootstrap((current) => ({ ...current, name: event.target.value }))}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--input-bg)] px-3 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                    placeholder="Your name"
                  />
                </label>
                <label className="text-sm text-[var(--color-text)]">
                  <span className="mb-1.5 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
                    <CalendarDays size={13} />
                    Date of birth
                  </span>
                  <input
                    type="date"
                    value={bootstrap.dobIso}
                    onChange={(event) => setBootstrap((current) => ({ ...current, dobIso: event.target.value }))}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--input-bg)] px-3 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                  />
                </label>
              </div>
              {bootstrap.error ? <div className="mt-4 text-sm text-red-300">{bootstrap.error}</div> : null}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => void submitBootstrap()}
                  disabled={!bootstrap.name.trim() || !bootstrap.dobIso || bootstrap.saving}
                  className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-5 py-3 text-sm font-semibold text-[var(--color-accent-contrast)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bootstrap.saving ? "Entering War Gaming..." : "Enter Source War Gaming"}
                  <ArrowRight size={15} />
                </button>
                <div className="text-xs text-[var(--color-text-faint)]">Next step: list sources of volatility, then map domains, then define stakes and risks.</div>
              </div>
            </div>

            <div className="glass rounded-[28px] border border-white/10 p-6 md:p-8">
              <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-faint)]">Immediate Journey</div>
              <div className="mt-5 space-y-3">
                {[
                  "1. Enter your name and date of birth.",
                  "2. Enter War Gaming in source mode.",
                  "3. List your current sources of volatility.",
                  "4. Open one source and identify the domains it touches.",
                  "5. In each domain, write stakes, risks, fragility, hedge, and edge."
                ].map((step, index) => (
                  <div key={step} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel-soft)] px-4 py-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">Step {index + 1}</div>
                    <div className="mt-2 text-sm text-[var(--color-text)]">{step.replace(/^\d+\.\s*/, "")}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

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

        {!bootstrap.loading ? (
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {KHAL_OPS_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onMouseEnter={() => router.prefetch(item.href)}
                  className="glass flex items-start justify-between rounded-lg border border-white/10 px-3 py-3 transition-colors hover:bg-[var(--nav-hover-bg)]"
                >
                  <div className="min-w-0">
                    <div className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
                      <Icon size={14} className="text-[var(--color-text-faint)]" />
                      {item.label}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">{KHAL_MODULE_COPY[item.href] ?? "Open module"}</p>
                  </div>
                  <span className="ml-3 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-faint)]">Open</span>
                </Link>
              );
            })}
          </section>
        ) : null}

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
