"use client";

import { useApiState } from "../../lib/use-api-state";

export default function MissionCommandPage() {
  const { data, loading, error } = useApiState();

  if (loading) return <p>Loading mission command...</p>;
  if (error || !data) return <p>Error: {error}</p>;

  const doNow = data.dashboard?.doNow ?? [];

  return (
    <div className="card">
      <h2>Mission Command</h2>
      <p>Priority hierarchy generated from Affairs, Interests, and Tasks.</p>
      <ul>
        {doNow.map((item: any) => (
          <li key={`${item.refType}-${item.refId}`}>
            <strong>{item.refType}</strong> {item.title} ({item.score}) - {item.why}
          </li>
        ))}
      </ul>
    </div>
  );
}