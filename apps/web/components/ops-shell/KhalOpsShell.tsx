"use client";

import { KhalOpsNav } from "./KhalOpsNav";
import { ThemeToggle } from "../theme/ThemeToggle";

export function KhalOpsShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="khal-compact flex min-h-screen bg-[var(--shell-hero)] text-[var(--color-text)]">
      <KhalOpsNav />
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-[var(--color-line)] bg-[var(--topbar-bg)] px-4 backdrop-blur-xl">
          <div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-text-faint)]">{subtitle ?? "Khal Ops"}</div>
            <div className="text-sm font-semibold text-[var(--color-text-strong)]">{title}</div>
          </div>
          <ThemeToggle />
        </header>
        <main className="p-0">{children}</main>
      </div>
    </div>
  );
}

