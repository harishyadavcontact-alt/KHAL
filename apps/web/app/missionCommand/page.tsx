"use client";

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
        <MissionCommand
          data={data}
          onDomainClick={(domain) => router.push(`/war-room?domain=${encodeURIComponent(domain.id)}`)}
          onWarGame={(mode, targetId) => router.push(`/war-gaming/${mode}?target=${encodeURIComponent(targetId ?? "mission-global")}`)}
          onQueueAction={async () => {
            await refresh();
          }}
        />
      )}
    </KhalOpsShell>
  );
}

