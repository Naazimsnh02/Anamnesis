"use client";

import { forceCenter, forceLink, forceManyBody, forceSimulation } from "d3-force";
import { useMemo, useRef, useState } from "react";

export type GraphNode = { id: string; label: string; type: string };
export type GraphEdge = { source: string; target: string; label: string };

type SimNode = GraphNode & { x: number; y: number; vx: number; vy: number };

const WIDTH = 720;
const HEIGHT = 440;
const MIN_SCALE = 0.5;
const MAX_SCALE = 6;

const TYPE_COLOR: Record<string, string> = {
  Entity: "var(--pen)",
  EntityType: "var(--ink-faint)",
};

export function GraphView({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  function toSvgPoint(clientX: number, clientY: number) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: ((clientX - rect.left) / rect.width) * WIDTH,
      y: ((clientY - rect.top) / rect.height) * HEIGHT,
    };
  }

  function zoomAt(clientX: number, clientY: number, factor: number) {
    setTransform((prev) => {
      const k = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.k * factor));
      const p = toSvgPoint(clientX, clientY);
      const x = p.x - ((p.x - prev.x) / prev.k) * k;
      const y = p.y - ((p.y - prev.y) / prev.k) * k;
      return { x, y, k };
    });
  }

  function handleWheel(e: React.WheelEvent<SVGSVGElement>) {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.15 : 1 / 1.15);
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, origX: transform.x, origY: transform.y };
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!drag.current) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = ((e.clientX - drag.current.startX) / rect.width) * WIDTH;
    const dy = ((e.clientY - drag.current.startY) / rect.height) * HEIGHT;
    setTransform((prev) => ({ ...prev, x: drag.current!.origX + dx, y: drag.current!.origY + dy }));
  }

  function handlePointerUp() {
    drag.current = null;
  }

  function resetView() {
    setTransform({ x: 0, y: 0, k: 1 });
  }

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
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full touch-none rounded border border-[var(--line)] bg-white"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ cursor: "grab" }}
      >
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
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
                strokeWidth={1 / transform.k}
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
                <circle
                  r={(isHovered ? 7 : 5) / transform.k}
                  fill={TYPE_COLOR[n.type] ?? "var(--ink-soft)"}
                />
                {isHovered && (
                  <text
                    x={9 / transform.k}
                    y={4 / transform.k}
                    fontSize={11 / transform.k}
                    fontFamily="var(--font-mono, monospace)"
                    fill="var(--ink)"
                  >
                    {n.label} <tspan fill="var(--ink-faint)">({n.type})</tspan>
                  </text>
                )}
              </g>
            );
          })}
        </g>
        <title>{nodeById.size} clinical entities</title>
      </svg>
      <div className="absolute bottom-2 right-2 flex gap-1">
        <button
          type="button"
          onClick={() => zoomAt(svgRef.current!.getBoundingClientRect().left + WIDTH / 2, svgRef.current!.getBoundingClientRect().top + HEIGHT / 2, 1.3)}
          className="mono h-7 w-7 rounded border border-[var(--line)] bg-white text-sm leading-none text-[var(--ink-soft)] hover:border-[var(--pen)] hover:text-[var(--pen)]"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoomAt(svgRef.current!.getBoundingClientRect().left + WIDTH / 2, svgRef.current!.getBoundingClientRect().top + HEIGHT / 2, 1 / 1.3)}
          className="mono h-7 w-7 rounded border border-[var(--line)] bg-white text-sm leading-none text-[var(--ink-soft)] hover:border-[var(--pen)] hover:text-[var(--pen)]"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          onClick={resetView}
          className="mono h-7 rounded border border-[var(--line)] bg-white px-2 text-xs leading-none text-[var(--ink-soft)] hover:border-[var(--pen)] hover:text-[var(--pen)]"
          aria-label="Reset view"
        >
          reset
        </button>
      </div>
    </div>
  );
}
