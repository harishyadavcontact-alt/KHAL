"use client";

import { KhalOpsShell } from "../../components/ops-shell/KhalOpsShell";
import { MayaView } from "../../components/war-room-v2/maya/MayaView";
import { useWarRoomData } from "../../lib/war-room/useWarRoomData";

export default function MayaPage() {
  const { data, loading, error } = useWarRoomData();

  return (
    <KhalOpsShell title="Maya" subtitle="Causal Opacity">
      {!data || loading ? (
        <div className="max-w-7xl mx-auto p-5 text-zinc-400">Loading Maya...</div>
      ) : error ? (
        <div className="max-w-7xl mx-auto p-5 text-red-300">{error}</div>
      ) : (
        <MayaView data={data} />
      )}
    </KhalOpsShell>
  );
}

