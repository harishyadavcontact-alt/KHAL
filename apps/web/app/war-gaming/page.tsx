"use client";

import { useApiState } from "../../lib/use-api-state";

export default function WarGamingPage() {
  const { data, loading, error } = useApiState();

  async function generateTasks(endId: string) {
    await fetch(`/api/wargaming/${endId}/generateTasks`, { method: "POST" });
    alert("Task chain generation triggered.");
  }

  if (loading) return <p>Loading war gaming...</p>;
  if (error || !data) return <p>Error: {error}</p>;

  return (
    <div className="card">
      <h2>War Gaming</h2>
      <p>Plans and preparations are scaffolded in v0.1. Trigger task materialization per End.</p>
      {(data.state?.ends ?? []).length === 0 ? (
        <p>No ends available yet.</p>
      ) : (
        <ul>
          {data.state.ends.map((end: any) => (
            <li key={end.id}>
              {end.title} <button onClick={() => generateTasks(end.id)}>Generate Tasks</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}