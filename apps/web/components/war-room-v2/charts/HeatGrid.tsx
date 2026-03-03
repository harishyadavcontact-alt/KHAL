import React, { useMemo } from "react";
import type { HeatCell, HeatColumn, HeatRow } from "../types";

interface HeatGridProps {
  columns: HeatColumn[];
  rows: HeatRow[];
  cells: HeatCell[];
  activeRowId?: string;
  onRowClick?: (rowId: string) => void;
  emptyText?: string;
}

function cellMap(cells: HeatCell[]) {
  const map = new Map<string, HeatCell>();
  for (const cell of cells) {
    map.set(`${cell.rowId}:${cell.columnId}`, cell);
  }
  return map;
}

export function HeatGrid({ columns, rows, cells, activeRowId, onRowClick, emptyText = "No data." }: HeatGridProps) {
  const indexed = useMemo(() => cellMap(cells), [cells]);
  const template = useMemo(() => `1.3fr repeat(${Math.max(1, columns.length)}, minmax(0, 1fr))`, [columns.length]);

  if (!rows.length || !columns.length) {
    return <div className="viz-empty text-xs text-zinc-500">{emptyText}</div>;
  }

  return (
    <div className="viz-heat-grid">
      <div className="viz-heat-head" style={{ gridTemplateColumns: template }}>
        <div className="viz-heat-title text-[10px] uppercase tracking-widest text-zinc-500">Metric</div>
        {columns.map((column) => (
          <div key={column.id} className="viz-heat-col text-[10px] uppercase tracking-widest text-zinc-500">
            {column.label}
          </div>
        ))}
      </div>
      <div className="viz-heat-body">
        {rows.map((row) => (
          <div
            key={row.id}
            className={
              activeRowId === row.id
                ? "viz-heat-row viz-heat-row-active"
                : "viz-heat-row"
            }
            style={{ gridTemplateColumns: template }}
          >
            <button
              type="button"
              className="viz-heat-rowlabel"
              onClick={() => onRowClick?.(row.id)}
              disabled={!onRowClick}
              title={row.meta ?? row.label}
            >
              <span>{row.label}</span>
              {row.meta ? <small>{row.meta}</small> : null}
            </button>
            {columns.map((column) => {
              const cell = indexed.get(`${row.id}:${column.id}`);
              const value = cell?.value ?? 0;
              return (
                <div
                  key={`${row.id}:${column.id}`}
                  className="viz-heat-cell"
                  data-band={cell?.band ?? "stable"}
                  title={cell?.hint ? `${column.label}: ${cell.hint}` : `${column.label}: ${value}`}
                >
                  <span>{value}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
