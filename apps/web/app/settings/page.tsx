"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [workbookPath, setWorkbookPath] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/workbook/validate")
      .then((res) => res.json())
      .then((json) => {
        if (json.workbookPath) setWorkbookPath(json.workbookPath);
      });
  }, []);

  async function save() {
    const res = await fetch("/api/workbook/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workbookPath })
    });
    setMessage(res.ok ? "Saved." : "Failed.");
  }

  async function normalizeWorkbook() {
    const res = await fetch("/api/workbook/normalize", { method: "POST" });
    const json = await res.json();
    setMessage(json.ok ? "Workbook normalized." : `Normalize failed: ${json.error || json.issues?.join(", ")}`);
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
        </div>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}