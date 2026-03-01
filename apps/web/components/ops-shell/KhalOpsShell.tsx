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
    <div className="khal-compact min-h-screen bg-zinc-950 text-zinc-100 flex">
      <KhalOpsNav />
      <div className="flex-1 min-w-0">
        <header className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-20">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">{subtitle ?? "Khal Ops"}</div>
            <div className="text-sm font-semibold text-zinc-200">{title}</div>
          </div>
        </header>
        <main className="p-0">{children}</main>
      </div>
    </div>
  );
}

