"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { KhalOpsShell } from "../../components/ops-shell/KhalOpsShell";
import { DomainModal } from "../../components/war-room-v2/DomainModal";
import { Domain } from "../../components/war-room-v2/types";
import { LawsView } from "../../components/war-room-v2/LawsView";
import { routeForView } from "../../lib/war-room/routes";
import { updateDomainStrategy, upsertLineageRisk } from "../../lib/war-room/actions";
import { useWarRoomData } from "../../lib/war-room/useWarRoomData";

export default function SourceOfVolatilityPage() {
  const router = useRouter();
  const { data, loading, error, refresh } = useWarRoomData();
  const [selectedLawId, setSelectedLawId] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);

  return (
    <KhalOpsShell title="Source of Volatility" subtitle="Source classification and domain mapping">
      {!data || loading ? (
        <div className="max-w-7xl mx-auto p-5 text-zinc-400">Loading Sources...</div>
      ) : error ? (
        <div className="max-w-7xl mx-auto p-5 text-red-300">{error}</div>
      ) : (
        <>
          <LawsView
            data={data}
            selectedLawId={selectedLawId}
            onSelectLaw={setSelectedLawId}
            onSelectDomain={setSelectedDomain}
            onWarGameSource={(sourceId) => router.push(`/war-gaming/source?target=${encodeURIComponent(sourceId)}`)}
            onOpenCraftFromLaw={(craftId) => router.push(`/crafts-library?craftId=${encodeURIComponent(craftId)}`)}
          />

          <DomainModal
            selectedDomain={selectedDomain}
            data={data}
            onClose={() => setSelectedDomain(null)}
            onOpenAffair={(id) => {
              setSelectedDomain(null);
              router.push(`/affairs?affairId=${encodeURIComponent(id)}`);
            }}
            onNavigate={(view) => {
              setSelectedDomain(null);
              router.push(routeForView(view));
            }}
            onWarGame={(domainId) => {
              setSelectedDomain(null);
              router.push(`/war-gaming/domain?target=${encodeURIComponent(domainId)}`);
            }}
            onSaveDomainStrategy={async (domainId, updates) => {
              await updateDomainStrategy(domainId, updates);
              await refresh();
            }}
            onUpsertLineageRisk={async (payload) => {
              await upsertLineageRisk(payload);
              await refresh();
            }}
          />
        </>
      )}
    </KhalOpsShell>
  );
}

