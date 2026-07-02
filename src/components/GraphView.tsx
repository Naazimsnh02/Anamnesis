"use client";

import { forceCenter, forceLink, forceManyBody, forceSimulation } from "d3-force";
import { useMemo, useState } from "react";

export type GraphNode = { id: string; label: string; type: string };
export type GraphEdge = { source: string; target: string; label: string };

type SimNode = GraphNode & { x: number; y: number; vx: number; vy: number };

const WIDTH = 720;
const HEIGHT = 440;

const TYPE_COLOR: Record<string, string> = {
  Entity: "var(--pen)",
  EntityType: "var(--ink-faint)",
};

export function GraphView({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  // Layout is a pure, synchronous function of nodes/edges (a fixed number of
  // simulation ticks, not an animation loop), so it's computed directly
  // during render rather than via an effect + setState.
  const positions = useMemo(() => {
    const result = new Map<string, { x: number; y: number }>();
    if (nodes.length === 0) return result;

    const simNodes: SimNode[] = nodes.map((n) => ({ ...n, x: WIDTH / 2, y: HEIGHT / 2, vx: 0, vy: 0 }));
    const simEdges = edges.map((e) => ({ ...e }));

    const sim = forceSimulation(simNodes)
      .force("charge", forceManyBody().strength(-120))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .force(
        "link",
        forceLink<SimNode, GraphEdge>(simEdges)
          .id((d) => d.id)
          .distance(60)
      )
      .stop();

    for (let i = 0; i < 200; i++) sim.tick();

    for (const n of simNodes) result.set(n.id, { x: n.x, y: n.y });
    return result;
  }, [nodes, edges]);

  if (nodes.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-faint)]">
        No graph yet — upload a document or seed patient history to grow one.
      </p>
    );
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-auto w-full rounded border border-[var(--line)] bg-white"
    >
      {edges.map((e, i) => {
        const s = positions.get(e.source);
        const t = positions.get(e.target);
        if (!s || !t) return null;
        return (
          <line
            key={i}
            x1={s.x}
            y1={s.y}
            x2={t.x}
            y2={t.y}
            stroke="var(--line)"
            strokeWidth={1}
          />
        );
      })}
      {nodes.map((n) => {
        const p = positions.get(n.id);
        if (!p) return null;
        const isHovered = hovered === n.id;
        return (
          <g
            key={n.id}
            transform={`translate(${p.x}, ${p.y})`}
            onMouseEnter={() => setHovered(n.id)}
            onMouseLeave={() => setHovered((h) => (h === n.id ? null : h))}
            style={{ cursor: "default" }}
          >
            <circle r={isHovered ? 7 : 5} fill={TYPE_COLOR[n.type] ?? "var(--ink-soft)"} />
            {isHovered && (
              <text
                x={9}
                y={4}
                fontSize={11}
                fontFamily="var(--font-mono, monospace)"
                fill="var(--ink)"
              >
                {n.label} <tspan fill="var(--ink-faint)">({n.type})</tspan>
              </text>
            )}
          </g>
        );
      })}
      <title>{nodeById.size} clinical entities</title>
    </svg>
  );
}
