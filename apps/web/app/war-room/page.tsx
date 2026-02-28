"use client";

import { Suspense } from "react";
import { WarRoomV2App } from "../../components/war-room-v2";

export default function WarRoomPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">Loading War Room...</div>}>
      <WarRoomV2App />
    </Suspense>
  );
}
