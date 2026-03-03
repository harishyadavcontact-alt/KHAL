import React, { useMemo } from "react";
import type { FlowLane, FlowLink, FlowNode } from "../types";

interface FlowLanesProps {
  nodes: FlowNode[];
  lanes: FlowLane[];
  links: FlowLink[];
  activeNodeId?: string;
  onNodeClick?: (nodeId: string) => void;
  height?: number;
  emptyText?: string;
}

interface Point {
  x: number;
  y: number;
}

function laneColor(lane: FlowLink["lane"]): string {
  if (lane === "CAVE") return "var(--viz-risk)";
  if (lane === "CONVEX") return "var(--viz-safe)";
  if (lane === "SERIAL") return "var(--viz-hedge)";
  return "var(--viz-edge)";
}

function scaleStroke(weight: number): number {
  return Math.max(1.2, Math.min(7, 1 + weight / 18));
}

export function FlowLanes({
  nodes,
  lanes,
  links,
  activeNodeId,
  onNodeClick,
  height = 260,
  emptyText = "No flow data."
}: FlowLanesProps) {
  const positions = useMemo(() => {
    const left = new Map<string, Point>();
    const right = new Map<string, Point>();
    const padTop = 18;
    const innerHeight = Math.max(40, height - padTop * 2);
    for (let i = 0; i < nodes.length; i += 1) {
      const y = padTop + (nodes.length === 1 ? innerHeight / 2 : (innerHeight * i) / (nodes.length - 1));
      left.set(nodes[i].id, { x: 110, y });
    }
    for (let i = 0; i < lanes.length; i += 1) {
      const y = padTop + (lanes.length === 1 ? innerHeight / 2 : (innerHeight * i) / (lanes.length - 1));
      right.set(lanes[i].id, { x: 570, y });
    }
    return { left, right };
  }, [height, lanes, nodes]);

  if (!nodes.length || !lanes.length || !links.length) {
    return <div className="viz-empty text-xs text-zinc-500">{emptyText}</div>;
  }

  return (
    <div className="viz-flow-wrap">
      <svg viewBox={`0 0 680 ${height}`} className="viz-flow-svg" role="img" aria-label="Flow lanes">
        {links.map((link) => {
          const from = positions.left.get(link.sourceId);
          const to = positions.right.get(link.laneId);
          if (!from || !to) return null;
          const active = !activeNodeId || activeNodeId === link.sourceId;
          const c1x = from.x + 180;
          const c2x = to.x - 180;
          return (
            <path
              key={link.id}
              d={`M ${from.x} ${from.y} C ${c1x} ${from.y}, ${c2x} ${to.y}, ${to.x} ${to.y}`}
              stroke={laneColor(link.lane)}
              strokeOpacity={active ? 0.8 : 0.2}
              strokeWidth={scaleStroke(link.weight)}
              fill="none"
            />
          );
        })}
        {nodes.map((node) => {
          const point = positions.left.get(node.id);
          if (!point) return null;
          return (
            <circle
              key={`node-${node.id}`}
              cx={point.x}
              cy={point.y}
              r={activeNodeId === node.id ? 5 : 4}
              fill={activeNodeId === node.id ? "var(--viz-edge)" : "rgba(250,250,250,0.8)"}
            />
          );
        })}
        {lanes.map((lane) => {
          const point = positions.right.get(lane.id);
          if (!point) return null;
          return <circle key={`lane-${lane.id}`} cx={point.x} cy={point.y} r={4.5} fill="rgba(250,250,250,0.7)" />;
        })}
      </svg>
      <div className="viz-flow-left">
        {nodes.map((node) => (
          <button
            key={node.id}
            type="button"
            className={activeNodeId === node.id ? "viz-flow-node active" : "viz-flow-node"}
            onClick={() => onNodeClick?.(node.id)}
            title={node.meta ?? node.label}
            disabled={!onNodeClick}
          >
            <span>{node.label}</span>
            <small>{node.value}</small>
          </button>
        ))}
      </div>
      <div className="viz-flow-right">
        {lanes.map((lane) => (
          <div key={lane.id} className="viz-flow-lane">
            {lane.label}
          </div>
        ))}
      </div>
    </div>
  );
}
