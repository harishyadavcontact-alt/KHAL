"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { KhalOpsShell } from "../../components/ops-shell/KhalOpsShell";
import { DashboardView } from "../../components/war-room-v2/DashboardView";
import { DomainModal } from "../../components/war-room-v2/DomainModal";
import { Domain } from "../../components/war-room-v2/types";
import { routeForView } from "../../lib/war-room/routes";
import { updateDomainStrategy, upsertLineageRisk } from "../../lib/war-room/actions";
import { useWarRoomData } from "../../lib/war-room/useWarRoomData";

export default function DashboardPage() {
  const router = useRouter();
  const { data, loading, error, refresh } = useWarRoomData();
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);

  return (
    <KhalOpsShell title="Dashboard" subtitle="Temporal + Fragility">
      {!data || loading ? (
        <div className="max-w-7xl mx-auto p-5 text-zinc-400">Loading Dashboard...</div>
      ) : error ? (
        <div className="max-w-7xl mx-auto p-5 text-red-300">{error}</div>
      ) : (
        <>
          <DashboardView data={data} onOpenDomain={setSelectedDomain} />
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
