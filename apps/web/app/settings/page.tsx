"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [dbPath, setDbPath] = useState("");
  const [message, setMessage] = useState("");
  const [diagnostics, setDiagnostics] = useState("");

  async function parseJsonSafely(res: Response): Promise<any> {
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { error: `Unexpected response (${res.status})` };
    }
  }

  useEffect(() => {
    fetch("/api/db/path")
      .then((res) => parseJsonSafely(res))
      .then((json) => {
        if (json.dbPath) setDbPath(json.dbPath);
      });
  }, []);

  async function save() {
    const res = await fetch("/api/db/path", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dbPath })
    });
    const json = await parseJsonSafely(res);
    setMessage(res.ok ? "Saved." : `Failed: ${json.error || "unknown error"}`);
  }

  async function inspectDb() {
    const res = await fetch("/api/db/inspect");
    const json = await parseJsonSafely(res);
    setDiagnostics(JSON.stringify(json, null, 2));
    setMessage(res.ok ? "DB inspection complete." : `Inspection failed: ${json.error || "see output below"}`);
  }

  return (
    <div className="card">
      <h2>Settings</h2>
      <p>Configure local SQLite path and inspect table state.</p>
      <div style={{ display: "grid", gap: 8, maxWidth: 960 }}>
        <input value={dbPath} onChange={(e) => setDbPath(e.target.value)} placeholder="C:\\path\\to\\KHAL.sqlite" />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={save}>Save DB Path</button>
          <button onClick={inspectDb}>Inspect Database</button>
        </div>
        {message && <p>{message}</p>}
        {diagnostics && (
          <pre style={{ margin: 0, padding: 12, borderRadius: 8, background: "#111827", color: "#e5e7eb", overflowX: "auto" }}>
            {diagnostics}
          </pre>
        )}
      </div>
    </div>
  );
}