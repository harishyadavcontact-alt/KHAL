"use client";

import { KhalOpsShell } from "../../components/ops-shell/KhalOpsShell";
import { TimeHorizonView } from "../../components/war-room-v2/TimeHorizonView";
import { useWarRoomData } from "../../lib/war-room/useWarRoomData";

export default function TimeHorizonPage() {
  const { data, loading, error } = useWarRoomData();

  return (
    <KhalOpsShell title="Time Horizon" subtitle="Temporal Command">
      {!data || loading ? (
        <div className="max-w-7xl mx-auto p-5 text-zinc-400">Loading Time Horizon...</div>
      ) : error ? (
        <div className="max-w-7xl mx-auto p-5 text-red-300">{error}</div>
      ) : (
        <TimeHorizonView user={data.user} />
      )}
    </KhalOpsShell>
  );
}

