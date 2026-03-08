"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { KhalOpsShell } from "../../components/ops-shell/KhalOpsShell";
import { MissionCommand } from "../../components/war-room-v2/MissionCommand";
import { useWarRoomData } from "../../lib/war-room/useWarRoomData";

export default function MissionCommandPage() {
  const router = useRouter();
  const { data, loading, error, refresh } = useWarRoomData();

  return (
    <KhalOpsShell title="Mission Command" subtitle="Hierarchy">
      {!data || loading ? (
        <div className="max-w-7xl mx-auto p-5 text-zinc-400">Loading Mission Command...</div>
      ) : error ? (
        <div className="max-w-7xl mx-auto p-5 text-red-300">{error}</div>
      ) : (
        <>
          <div className="mx-auto max-w-7xl px-3 pt-4">
            <div className="rounded-[28px] border border-[var(--color-border)] bg-[radial-gradient(circle_at_top_left,rgba(200,154,87,0.08),transparent_30%),linear-gradient(180deg,rgba(18,22,29,0.96),rgba(10,13,18,0.96))] p-4 shadow-[0_22px_64px_rgba(0,0,0,0.22)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-text-faint)]">New Surface</div>
                  <div className="mt-1 text-lg font-semibold text-[var(--color-text)]">Portfolio War Room</div>
                  <div className="mt-1 text-sm text-[var(--color-text-muted)]">Command multiple bets from one strategic-operational surface without collapsing doctrine into project management.</div>
                </div>
                <Link href="/missionCommand/portfolio" className="rounded-full border border-[var(--color-border-strong)] bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-4 py-2 text-sm font-semibold text-[#111318]">
                  Open Portfolio War Room
                </Link>
              </div>
            </div>
          </div>
          <MissionCommand
            data={data}
            onDomainClick={(domain) => router.push(`/war-room?domain=${encodeURIComponent(domain.id)}`)}
            onWarGame={(mode, targetId) => router.push(`/war-gaming/${mode}?target=${encodeURIComponent(targetId ?? "mission-global")}`)}
            onQueueAction={async () => {
              await refresh();
            }}
          />
        </>
      )}
    </KhalOpsShell>
  );
}

