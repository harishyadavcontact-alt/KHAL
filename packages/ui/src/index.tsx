import React from "react";

export interface Column<T> {
  key: string;
  label: string;
}

export function EditableTable<T extends { id: string }>({
  rows,
  columns
}: {
  rows: T[];
  columns: Column<T>[];
}) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={String(column.key)} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            {columns.map((column) => (
              <td key={String(column.key)} style={{ borderBottom: "1px solid #efefef", padding: "8px" }}>
                {String((row as Record<string, unknown>)[column.key] ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ScoreBadge({ value }: { value: number }) {
  const bg = value >= 60 ? "#ffd9d9" : value >= 30 ? "#fff2cc" : "#d9f7d9";
  return <span style={{ padding: "2px 8px", borderRadius: 12, background: bg, fontSize: 12 }}>{value}</span>;
}

export function PriorityList({
  items
}: {
  items: Array<{ id: string; title: string; why: string; score: number }>;
}) {
  return (
    <ol>
      {items.map((item) => (
        <li key={item.id} style={{ marginBottom: 8 }}>
          <strong>{item.title}</strong> ({item.score}) - {item.why}
        </li>
      ))}
    </ol>
  );
}

export function DependencyWarning({ blocked }: { blocked: boolean }) {
  if (!blocked) return null;
  return <span style={{ color: "#b30000", fontWeight: 600 }}>Blocked by dependency</span>;
}

export function SyncIndicator({ stale }: { stale: boolean }) {
  return <span style={{ color: stale ? "#b30000" : "#0a7d0a" }}>{stale ? "Stale" : "Connected"}</span>;
}
