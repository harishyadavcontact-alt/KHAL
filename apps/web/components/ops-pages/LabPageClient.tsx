"use client";

import { LabView } from "../war-room-v2/LabView";
import { useWarRoomData } from "../../lib/war-room/useWarRoomData";

export function LabPageClient({ focusId }: { focusId?: string }) {
  const { data, loading, error, refresh } = useWarRoomData();

  if (!data || loading) {
    return <div className="max-w-7xl mx-auto p-5 text-zinc-400">Loading Lab...</div>;
  }
  if (error) {
    return <div className="max-w-7xl mx-auto p-5 text-red-300">{error}</div>;
  }
  return <LabView data={data} onRefresh={refresh} initialFocusId={focusId} />;
}

