"use client";

import { KhalOpsShell } from "../../components/ops-shell/KhalOpsShell";
import { LineageMapView } from "../../components/war-room-v2/LineageMapView";
import { useWarRoomData } from "../../lib/war-room/useWarRoomData";

export default function LineageMapPage() {
  const { data, loading, error } = useWarRoomData();

  return (
    <KhalOpsShell title="Lineage Map" subtitle="Lineage + Volatility">
      {!data || loading ? (
        <div className="max-w-7xl mx-auto p-5 text-zinc-400">Loading Lineage Map...</div>
      ) : error ? (
        <div className="max-w-7xl mx-auto p-5 text-red-300">{error}</div>
      ) : (
        <LineageMapView data={data} />
      )}
    </KhalOpsShell>
  );
}

