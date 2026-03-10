"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { KhalOpsShell } from "../../components/ops-shell/KhalOpsShell";
import { InterestsView } from "../../components/war-room-v2/InterestsView";
import { createInterest } from "../../lib/war-room/actions";
import { useWarRoomData } from "../../lib/war-room/useWarRoomData";

export default function InterestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, loading, error, refresh } = useWarRoomData();
  const [selectedInterestId, setSelectedInterestId] = useState<string | null>(searchParams.get("interestId"));

  useEffect(() => {
    setSelectedInterestId(searchParams.get("interestId"));
  }, [searchParams]);

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
          onOpenLab={(interestId) => router.push(`/lab?focus=${encodeURIComponent(interestId)}`)}
          onOpenPortfolio={(interestId) => router.push(`/missionCommand/portfolio?interestId=${encodeURIComponent(interestId)}`)}
          onWarGame={(interestId) => router.push(`/war-gaming/interest?target=${encodeURIComponent(interestId)}`)}
        />
      )}
    </KhalOpsShell>
  );
}
