"use client";

import { KhalOpsShell } from "../ops-shell/KhalOpsShell";
import { WarGaming } from "../war-room-v2/WarGaming";
import type { WarGameRouteMode } from "../../lib/war-room/route-mode";
import { saveWarGameProtocol } from "../../lib/war-room/actions";
import { useWarRoomData } from "../../lib/war-room/useWarRoomData";

export function WarGamingModeClient({ mode, targetId }: { mode: WarGameRouteMode; targetId?: string }) {
  const { data, loading, error, refresh } = useWarRoomData();

  return (
    <KhalOpsShell title="War Gaming" subtitle={`War Gaming: ${mode}`}>
      {!data || loading ? (
        <div className="max-w-7xl mx-auto p-5 text-zinc-400">Loading War Gaming...</div>
      ) : error ? (
        <div className="max-w-7xl mx-auto p-5 text-red-300">{error}</div>
      ) : (
        <WarGaming
          user={data.user}
          domains={data.domains}
          sources={data.sources ?? []}
          lineages={data.lineages?.nodes ?? []}
          affairs={data.affairs}
          interests={data.interests}
          crafts={data.crafts}
          tasks={data.tasks}
          lineageRisks={data.lineageRisks ?? []}
          missionGraph={data.missionGraph}
          doctrine={data.doctrine}
          confidence={data.confidence}
          protocolState={data.decisionAccelerationMeta?.protocolState}
          blastRadius={data.blastRadius}
          hedgeCoverage={data.hedgeCoverage}
          violationFeed={data.violationFeed}
          optionalityBudget={data.optionalityBudget}
          initialMode={mode}
          initialTargetId={targetId}
          onAddTask={async (payload) => {
            await saveWarGameProtocol({ payload, mode, targetId, data });
            await refresh();
          }}
        />
      )}
    </KhalOpsShell>
  );
}

