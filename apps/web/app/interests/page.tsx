"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { KhalOpsShell } from "../../components/ops-shell/KhalOpsShell";
import { InterestsView } from "../../components/war-room-v2/InterestsView";
import { createInterest } from "../../lib/war-room/actions";
import { useWarRoomData } from "../../lib/war-room/useWarRoomData";

export default function InterestsPage() {
  const router = useRouter();
  const { data, loading, error, refresh } = useWarRoomData();
  const [selectedInterestId, setSelectedInterestId] = useState<string | null>(null);

  return (
    <KhalOpsShell title="Interests" subtitle="Visionary Mode">
      {!data || loading ? (
        <div className="max-w-7xl mx-auto p-5 text-zinc-400">Loading Interests...</div>
      ) : error ? (
        <div className="max-w-7xl mx-auto p-5 text-red-300">{error}</div>
      ) : (
        <InterestsView
          data={data}
          selectedInterestId={selectedInterestId}
          onSelectInterest={setSelectedInterestId}
          onSelectAffair={(affairId) => router.push(`/affairs?affairId=${encodeURIComponent(affairId)}`)}
          onCreateInterest={async (payload) => {
            await createInterest(payload);
            await refresh();
          }}
          onWarGame={(interestId) => router.push(`/war-gaming/interest?target=${encodeURIComponent(interestId)}`)}
        />
      )}
    </KhalOpsShell>
  );
}

