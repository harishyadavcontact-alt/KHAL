"use client";

import { KhalOpsShell } from "../../components/ops-shell/KhalOpsShell";
import { SurgicalExecution } from "../../components/war-room-v2/SurgicalExecution";
import { createExecutionTask, updateExecutionTask } from "../../lib/war-room/actions";
import { useWarRoomData } from "../../lib/war-room/useWarRoomData";

export default function SurgicalExecutionPage() {
  const { data, loading, error, refresh } = useWarRoomData();

  return (
    <KhalOpsShell title="Surgical Execution" subtitle="Kill Chain">
      {!data || loading ? (
        <div className="max-w-7xl mx-auto p-5 text-zinc-400">Loading Execution...</div>
      ) : error ? (
        <div className="max-w-7xl mx-auto p-5 text-red-300">{error}</div>
      ) : (
        <SurgicalExecution
          tasks={data.tasks}
          onCreateTask={async (payload) => {
            await createExecutionTask(payload);
            await refresh();
          }}
          onUpdateTask={async (id, updates) => {
            await updateExecutionTask(id, updates);
            await refresh();
          }}
        />
      )}
    </KhalOpsShell>
  );
}

