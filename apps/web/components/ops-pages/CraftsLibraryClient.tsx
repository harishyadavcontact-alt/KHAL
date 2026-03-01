"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { KhalOpsShell } from "../ops-shell/KhalOpsShell";
import { CraftsView } from "../war-room-v2/CraftsView";
import { routeForView } from "../../lib/war-room/routes";
import { useWarRoomData } from "../../lib/war-room/useWarRoomData";

async function saveCraftEntity(craftId: string, type: string, entityData: any) {
  const apiType = type === "barbellStrategies" ? "barbell-strategies" : type;
  const payload = {
    ...entityData,
    title: (entityData.title ?? entityData.name ?? "").trim()
  };
  const res = await fetch(`/api/crafts/${craftId}/${apiType}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to save craft entity");
  }
}

export function CraftsLibraryClient({ initialCraftId }: { initialCraftId?: string }) {
  const router = useRouter();
  const { data, loading, error, refresh } = useWarRoomData();
  const [selectedCraftId, setSelectedCraftId] = useState<string | null>(initialCraftId ?? null);
  const [returnPath, setReturnPath] = useState<{ view: string; id: string | null } | null>(null);

  return (
    <KhalOpsShell title="Crafts Library" subtitle="Means Stack">
      {!data || loading ? (
        <div className="max-w-7xl mx-auto p-5 text-zinc-400">Loading Crafts...</div>
      ) : error ? (
        <div className="max-w-7xl mx-auto p-5 text-red-300">{error}</div>
      ) : (
        <CraftsView
          data={data}
          selectedCraftId={selectedCraftId}
          returnPath={returnPath}
          onSelectCraft={(id) => {
            setSelectedCraftId(id);
            if (!id) router.push("/crafts-library");
          }}
          onSetActiveView={(view) => router.push(routeForView(view))}
          onRestoreLaw={(id) => {
            if (id) router.push(`/source-of-volatility?lawId=${encodeURIComponent(id)}`);
          }}
          onClearReturnPath={() => setReturnPath(null)}
          onAddEntity={async (craftId, type, entityData) => {
            await saveCraftEntity(craftId, type, entityData);
            await refresh();
          }}
        />
      )}
    </KhalOpsShell>
  );
}

