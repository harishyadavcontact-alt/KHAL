"use client";

import { EditableTable } from "@khal/ui";
import { useMemo } from "react";
import { useApiState } from "../../lib/use-api-state";

export default function SurgicalExecutionPage() {
  const { data, loading, error } = useApiState();

  const tasks = useMemo(() => data?.state?.tasks ?? [], [data]);

  if (loading) return <p>Loading tasks...</p>;
  if (error || !data) return <p>Error: {error}</p>;

  return (
    <div className="grid">
      <div className="card">
        <h2>Surgical Execution</h2>
        <EditableTable
          rows={tasks}
          columns={[
            { key: "title", label: "Task" },
            { key: "horizon", label: "Horizon" },
            { key: "status", label: "Status" },
            { key: "dueDate", label: "Due" }
          ]}
        />
      </div>
    </div>
  );
}