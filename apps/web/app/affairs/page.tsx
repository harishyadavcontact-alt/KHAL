"use client";

import { EditableTable } from "@khal/ui";
import { useState } from "react";
import { useApiState } from "../../lib/use-api-state";

export default function AffairsPage() {
  const { data, loading, error } = useApiState();
  const [title, setTitle] = useState("");

  async function createAffair() {
    if (!title.trim()) return;
    const res = await fetch("/api/affairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, domainId: "general", stakes: 5, risk: 5, completionPct: 0 })
    });
    if (res.ok) {
      window.location.reload();
    }
  }

  if (loading) return <p>Loading affairs...</p>;
  if (error || !data) return <p>Error: {error}</p>;

  return (
    <div className="grid">
      <div className="card">
        <h2>Affairs</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New affair" />
          <button onClick={createAffair}>Add Affair</button>
        </div>
        <EditableTable
          rows={data.state.affairs}
          columns={[
            { key: "title", label: "Action" },
            { key: "domainId", label: "Domain" },
            { key: "status", label: "Status" },
            { key: "fragilityScore", label: "Fragility" }
          ]}
        />
      </div>
    </div>
  );
}