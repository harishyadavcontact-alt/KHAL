"use client";

import { EditableTable } from "@khal/ui";
import { useState } from "react";
import { useApiState } from "../../lib/use-api-state";

export default function InterestsPage() {
  const { data, loading, error } = useApiState();
  const [title, setTitle] = useState("");

  async function createInterest() {
    if (!title.trim()) return;
    const res = await fetch("/api/interests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, domainId: "general", stakes: 3, risk: 6, convexity: 7 })
    });
    if (res.ok) {
      window.location.reload();
    }
  }

  if (loading) return <p>Loading interests...</p>;
  if (error || !data) return <p>Error: {error}</p>;

  return (
    <div className="grid">
      <div className="card">
        <h2>Interests</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New interest" />
          <button onClick={createInterest}>Add Interest</button>
        </div>
        <EditableTable
          rows={data.state.interests}
          columns={[
            { key: "title", label: "Opportunity" },
            { key: "domainId", label: "Domain" },
            { key: "convexity", label: "Convexity" },
            { key: "status", label: "Status" }
          ]}
        />
      </div>
    </div>
  );
}