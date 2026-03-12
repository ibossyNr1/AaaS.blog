"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Card, cn } from "@aaas/ui";
import Link from "next/link";
import type { Entity, EntityType } from "@/lib/types";
import { ENTITY_TYPES } from "@/lib/types";

interface GraphNode {
  id: string;
  slug: string;
  label: string;
  type: EntityType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

const TYPE_COLORS: Record<EntityType, string> = {
  tool: "#3b82f6",
  model: "#a855f7",
  agent: "#22c55e",
  skill: "#eab308",
  script: "#ec4899",
  benchmark: "#00f3ff",
};

const WIDTH = 800;
const HEIGHT = 600;

function simulate(nodes: GraphNode[], edges: GraphEdge[], iterations = 100) {
  // Initial positions in a circle
  nodes.forEach((node, i) => {
    const angle = (i / nodes.length) * Math.PI * 2;
    node.x = WIDTH / 2 + Math.cos(angle) * 200;
    node.y = HEIGHT / 2 + Math.sin(angle) * 200;
    node.vx = 0;
    node.vy = 0;
  });

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = 5000 / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        nodes[i].vx -= fx;
        nodes[i].vy -= fy;
        nodes[j].vx += fx;
        nodes[j].vy += fy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const source = nodes.find((n) => n.id === edge.source);
      const target = nodes.find((n) => n.id === edge.target);
      if (!source || !target) continue;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = dist * 0.01;
      source.vx += (dx / dist) * force;
      source.vy += (dy / dist) * force;
      target.vx -= (dx / dist) * force;
      target.vy -= (dy / dist) * force;
    }

    // Center gravity
    for (const node of nodes) {
      node.vx += (WIDTH / 2 - node.x) * 0.01;
      node.vy += (HEIGHT / 2 - node.y) * 0.01;
    }

    // Apply velocity with damping
    for (const node of nodes) {
      node.vx *= 0.8;
      node.vy *= 0.8;
      node.x += node.vx;
      node.y += node.vy;
      node.x = Math.max(30, Math.min(WIDTH - 30, node.x));
      node.y = Math.max(30, Math.min(HEIGHT - 30, node.y));
    }
  }
}

function buildGraph(entities: Entity[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const entityMap = new Map<string, Entity>();
  for (const e of entities) {
    entityMap.set(`${e.type}/${e.slug}`, e);
  }

  // Build nodes
  const nodes: GraphNode[] = entities.map((e) => {
    const score = e.scores?.composite ?? 50;
    const radius = Math.max(8, Math.min(20, 8 + (score / 100) * 12));
    return {
      id: `${e.type}/${e.slug}`,
      slug: e.slug,
      label: e.name,
      type: e.type,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius,
    };
  });

  const nodeIds = new Set(nodes.map((n) => n.id));

  // Build edges from relationship fields
  const edgeSet = new Set<string>();
  const edges: GraphEdge[] = [];

  for (const entity of entities) {
    const sourceId = `${entity.type}/${entity.slug}`;
    const relFields: { slugs: string[]; targetType: EntityType }[] = [
      { slugs: entity.relatedTools ?? [], targetType: "tool" },
      { slugs: entity.relatedModels ?? [], targetType: "model" },
      { slugs: entity.relatedAgents ?? [], targetType: "agent" },
      { slugs: entity.relatedSkills ?? [], targetType: "skill" },
    ];

    for (const { slugs, targetType } of relFields) {
      for (const slug of slugs) {
        const targetId = `${targetType}/${slug}`;
        if (!nodeIds.has(targetId)) continue;
        if (targetId === sourceId) continue;
        const edgeKey = [sourceId, targetId].sort().join("--");
        if (edgeSet.has(edgeKey)) continue;
        edgeSet.add(edgeKey);
        edges.push({ source: sourceId, target: targetId });
      }
    }
  }

  simulate(nodes, edges, 100);
  return { nodes, edges };
}

export function GraphClient({ entities }: { entities: Entity[] }) {
  const { nodes, edges } = useMemo(() => buildGraph(entities), [entities]);
  const svgRef = useRef<SVGSVGElement>(null);

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<EntityType | "all">("all");

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.max(0.3, Math.min(3, s * delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as SVGElement).tagName === "svg" || (e.target as SVGElement).tagName === "rect") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
    }
  }, [translate]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setTranslate({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const filteredNodes = activeFilter === "all" ? nodes : nodes.filter((n) => n.type === activeFilter);
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = edges.filter((e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target));

  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    for (const n of nodes) map.set(n.id, n);
    return map;
  }, [nodes]);

  return (
    <div className="space-y-4">
      {/* Filter + Legend */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setActiveFilter("all")}
          className={cn(
            "text-xs font-mono px-3 py-1.5 rounded-full border transition-colors",
            activeFilter === "all"
              ? "border-circuit text-circuit bg-circuit/10"
              : "border-border text-text-muted hover:text-text hover:border-text"
          )}
        >
          All ({nodes.length})
        </button>
        {(Object.keys(ENTITY_TYPES) as EntityType[]).map((type) => {
          const count = nodes.filter((n) => n.type === type).length;
          if (count === 0) return null;
          return (
            <button
              key={type}
              onClick={() => setActiveFilter(activeFilter === type ? "all" : type)}
              className={cn(
                "text-xs font-mono px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5",
                activeFilter === type
                  ? "border-current bg-current/10"
                  : "border-border text-text-muted hover:text-text hover:border-text"
              )}
              style={activeFilter === type ? { color: TYPE_COLORS[type] } : undefined}
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: TYPE_COLORS[type] }}
              />
              {ENTITY_TYPES[type].plural} ({count})
            </button>
          );
        })}
      </div>

      {/* Graph */}
      <Card className="overflow-hidden" style={{ minHeight: 500 }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          style={{ minHeight: 500, cursor: isPanning ? "grabbing" : "grab" }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Background for pan target */}
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="transparent" />

          <g transform={`translate(${translate.x}, ${translate.y}) scale(${scale})`}>
            {/* Edges */}
            {filteredEdges.map((edge, i) => {
              const source = nodeMap.get(edge.source);
              const target = nodeMap.get(edge.target);
              if (!source || !target) return null;
              const isHighlighted =
                hoveredNode === edge.source || hoveredNode === edge.target;
              return (
                <line
                  key={i}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={isHighlighted ? "#888" : "#555"}
                  strokeOpacity={isHighlighted ? 0.6 : 0.15}
                  strokeWidth={isHighlighted ? 1.5 : 1}
                />
              );
            })}

            {/* Nodes */}
            {filteredNodes.map((node) => {
              const isHovered = hoveredNode === node.id;
              const isConnected =
                hoveredNode !== null &&
                filteredEdges.some(
                  (e) =>
                    (e.source === hoveredNode && e.target === node.id) ||
                    (e.target === hoveredNode && e.source === node.id)
                );
              const dimmed = hoveredNode !== null && !isHovered && !isConnected;

              return (
                <Link key={node.id} href={`/${node.type}/${node.slug}`}>
                  <g
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isHovered ? node.radius + 2 : node.radius}
                      fill={TYPE_COLORS[node.type]}
                      fillOpacity={dimmed ? 0.15 : isHovered ? 1 : 0.75}
                      stroke={isHovered ? "#fff" : "none"}
                      strokeWidth={isHovered ? 2 : 0}
                    />
                    {isHovered && (
                      <text
                        x={node.x}
                        y={node.y - node.radius - 6}
                        textAnchor="middle"
                        fill="currentColor"
                        className="text-text"
                        fontSize={11}
                        fontFamily="Inter, sans-serif"
                        fontWeight={500}
                      >
                        {node.label}
                      </text>
                    )}
                    <title>{`${node.label} (${ENTITY_TYPES[node.type].label})`}</title>
                  </g>
                </Link>
              );
            })}
          </g>
        </svg>
      </Card>

      {/* Stats */}
      <p className="text-xs text-text-muted text-center">
        {filteredNodes.length} entities &middot; {filteredEdges.length} relationships &middot; Scroll to zoom, drag to pan
      </p>
    </div>
  );
}
