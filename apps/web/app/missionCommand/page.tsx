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
        <div className="mx-auto max-w-7xl p-5 text-[var(--color-text-muted)]">Loading Mission Command...</div>
      ) : error ? (
        <div className="mx-auto max-w-7xl p-5 text-[var(--color-fragile)]">{error}</div>
      ) : (
        <>
          <div className="mx-auto max-w-7xl px-3 pt-4">
            <div className="khal-panel-strong rounded-[28px] p-4 shadow-[0_22px_64px_rgba(0,0,0,0.14)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="khal-meta text-[11px]">New Surface</div>
                  <div className="khal-title mt-1 text-lg font-semibold">Portfolio War Room</div>
                  <div className="mt-1 text-sm text-[var(--color-text-muted)]">Command multiple bets from one strategic-operational surface without collapsing doctrine into project management.</div>
                </div>
                <Link href="/missionCommand/portfolio" className="khal-button-accent px-4 py-2 text-sm font-semibold">
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

