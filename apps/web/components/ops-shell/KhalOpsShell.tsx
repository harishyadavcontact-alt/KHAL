"use client";

import { KhalOpsNav } from "./KhalOpsNav";

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
    <div className="khal-compact flex min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(200,154,87,0.08),transparent_24%),linear-gradient(180deg,#0f1319,#090b0f)] text-[var(--color-text)]">
      <KhalOpsNav />
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-[var(--color-border)] bg-[rgba(10,13,18,0.88)] px-4 backdrop-blur-xl">
          <div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-text-faint)]">{subtitle ?? "Khal Ops"}</div>
            <div className="text-sm font-semibold text-[var(--color-text)]">{title}</div>
          </div>
        </header>
        <main className="p-0">{children}</main>
      </div>
    </div>
  );
}

