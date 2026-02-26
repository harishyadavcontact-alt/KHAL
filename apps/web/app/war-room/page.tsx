"use client";

import { useApiState } from "../../lib/use-api-state";

export default function WarRoomPage() {
  const { data, loading, error } = useApiState();

  if (loading) return <p>Loading war room...</p>;
  if (error || !data) return <p>Error: {error}</p>;

  const blocks = data.state?.warRoomNarrative?.blocks ?? [];

  return (
    <div className="grid">
      <div className="card">
        <h2>War Room Narrative</h2>
        {blocks.length === 0 && <p>No structured blocks detected. Use normalization + manual narrative tags.</p>}
        {blocks.map((block: any, index: number) => (
          <section key={`${block.heading}-${index}`} style={{ marginBottom: 16 }}>
            <h3>{block.heading}</h3>
            {Object.entries(block.kv || {}).map(([key, value]) => (
              <p key={key}>
                <strong>{key}</strong>: {String(value)}
              </p>
            ))}
            <ul>
              {(block.bullets || []).map((bullet: string) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}