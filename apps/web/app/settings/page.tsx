"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [workbookPath, setWorkbookPath] = useState("");
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
    fetch("/api/workbook/validate")
      .then((res) => parseJsonSafely(res))
      .then((json) => {
        if (json.workbookPath) setWorkbookPath(json.workbookPath);
        if (json.error) setMessage(`Validate failed: ${json.error}`);
      });
  }, []);

  async function save() {
    const res = await fetch("/api/workbook/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workbookPath })
    });
    const json = await parseJsonSafely(res);
    setMessage(res.ok ? "Saved." : `Failed: ${json.error || "unknown error"}`);
  }

  async function normalizeWorkbook() {
    const res = await fetch("/api/workbook/normalize", { method: "POST" });
    const json = await parseJsonSafely(res);
    setMessage(json.ok ? "Workbook normalized." : `Normalize failed: ${json.error || json.issues?.join(", ")}`);
  }

  async function diagnoseWorkbook() {
    const res = await fetch("/api/workbook/diagnose");
    const json = await parseJsonSafely(res);
    setDiagnostics(JSON.stringify(json, null, 2));
    setMessage(res.ok ? "Diagnostics complete." : `Diagnostics failed: ${json.error || "see payload below"}`);
  }

  return (
    <div className="card">
      <h2>Settings</h2>
      <p>Configure local workbook path and normalization status.</p>
      <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
        <input value={workbookPath} onChange={(e) => setWorkbookPath(e.target.value)} placeholder="C:\\path\\to\\Genesis.xlsx" />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={save}>Save Workbook Path</button>
          <button onClick={normalizeWorkbook}>Normalize Workbook</button>
          <button onClick={diagnoseWorkbook}>Run Diagnose</button>
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
