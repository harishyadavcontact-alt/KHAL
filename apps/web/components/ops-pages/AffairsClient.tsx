"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { KhalOpsShell } from "../ops-shell/KhalOpsShell";
import { AffairsView } from "../war-room-v2/AffairsView";
import { DecisionChamber } from "../war-room-v2/DecisionChamber";
import { createAffair, createExecutionTask, updateAffairMeans, updateAffairPlan } from "../../lib/war-room/actions";
import { useWarRoomData } from "../../lib/war-room/useWarRoomData";

export function AffairsClient({ initialAffairId }: { initialAffairId?: string }) {
  const router = useRouter();
  const { data, loading, error, refresh } = useWarRoomData();
  const [selectedAffairId, setSelectedAffairId] = useState<string | null>(initialAffairId ?? null);

  useEffect(() => {
    if (initialAffairId) setSelectedAffairId(initialAffairId);
  }, [initialAffairId]);

  const selectedAffair = data?.affairs.find((item) => item.id === selectedAffairId);

  return (
    <KhalOpsShell title="Affairs" subtitle="Missionary Mode">
      {!data || loading ? (
        <div className="max-w-7xl mx-auto p-5 text-zinc-400">Loading Affairs...</div>
      ) : error ? (
        <div className="max-w-7xl mx-auto p-5 text-red-300">{error}</div>
      ) : selectedAffair ? (
        <DecisionChamber
          affair={selectedAffair}
          data={data}
          onBack={() => {
            setSelectedAffairId(null);
            router.push("/affairs");
          }}
          onSavePlan={async (affairId, payload) => {
            await updateAffairPlan(affairId, payload);
            await refresh();
          }}
          onSaveMeans={async (affairId, payload) => {
            await updateAffairMeans(affairId, payload);
            await refresh();
          }}
          onCreateTask={async (payload) => {
            await createExecutionTask(payload);
            await refresh();
          }}
        />
      ) : (
        <AffairsView
          data={data}
          onSelectAffair={setSelectedAffairId}
          onCreateAffair={async (payload) => {
            await createAffair(payload);
            await refresh();
          }}
          onWarGame={(affairId) => router.push(`/war-gaming/affair?target=${encodeURIComponent(affairId)}`)}
        />
      )}
    </KhalOpsShell>
  );
}
