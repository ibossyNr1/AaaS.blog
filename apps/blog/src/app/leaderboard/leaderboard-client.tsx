"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Badge, cn } from "@aaas/ui";
import type { Entity, EntityType } from "@/lib/types";
import { ENTITY_TYPES } from "@/lib/types";
import { EntityHoverCard } from "@/components/entity-hover-card";
import { EntitySparkline } from "@/components/entity-sparkline";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type TabKey = "all" | EntityType;

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "tool", label: "Tools" },
  { key: "model", label: "Models" },
  { key: "agent", label: "Agents" },
  { key: "skill", label: "Skills" },
  { key: "script", label: "Scripts" },
  { key: "benchmark", label: "Benchmarks" },
];

const SCORE_KEYS = [
  { key: "adoption" as const, label: "Adoption" },
  { key: "quality" as const, label: "Quality" },
  { key: "freshness" as const, label: "Freshness" },
  { key: "citations" as const, label: "Citations" },
  { key: "engagement" as const, label: "Engagement" },
];

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

function ScoreBar({ value, className }: { value: number; className?: string }) {
  return (
    <div
      className={cn(
        "flex-grow h-1.5 bg-surface rounded-full overflow-hidden",
        className,
      )}
    >
      <div
        className="h-full bg-circuit rounded-full transition-all duration-700"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function TrendingCard({
  entity,
  rank,
}: {
  entity: Entity;
  rank: number;
}) {
  const typeInfo = ENTITY_TYPES[entity.type];

  return (
    <Link href={`/${entity.type}/${entity.slug}`}>
      <Card className="group cursor-pointer h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-circuit font-mono">
              #{rank}
            </span>
            <Badge variant="circuit">{typeInfo.label}</Badge>
          </div>
          <span className="text-2xl font-bold text-circuit font-mono">
            {entity.scores.composite}
          </span>
        </div>
        <EntityHoverCard type={entity.type} slug={entity.slug}>
          <span className="text-base font-semibold text-text mb-1 group-hover:text-circuit transition-colors">
            {entity.name}
          </span>
        </EntityHoverCard>
        <p className="text-xs text-text-muted mb-3">{entity.provider}</p>
        <div className="mt-auto space-y-1.5">
          {SCORE_KEYS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-16 text-[10px] font-mono uppercase tracking-wider text-text-muted">
                {label}
              </span>
              <ScoreBar value={entity.scores[key]} />
              <span className="w-6 text-[10px] font-mono text-circuit text-right">
                {entity.scores[key]}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </Link>
  );
}

function LeaderboardRow({
  entity,
  rank,
}: {
  entity: Entity;
  rank: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = ENTITY_TYPES[entity.type];

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full text-left px-4 py-3 flex items-center gap-4 hover:bg-surface/50 transition-colors"
      >
        {/* Rank */}
        <span className="w-10 text-sm font-bold font-mono text-text-muted text-center shrink-0">
          {rank}
        </span>

        {/* Entity info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <EntityHoverCard type={entity.type} slug={entity.slug}>
              <Link
                href={`/${entity.type}/${entity.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sm font-semibold text-text hover:text-circuit transition-colors truncate"
              >
                {entity.name}
              </Link>
            </EntityHoverCard>
            <Badge variant="circuit" className="shrink-0 text-[10px] px-2 py-0.5">
              {typeInfo.label}
            </Badge>
          </div>
          <p className="text-xs text-text-muted truncate">{entity.provider}</p>
        </div>

        {/* Composite score + bar + sparkline */}
        <div className="flex items-center gap-3 shrink-0 w-64">
          <ScoreBar value={entity.scores.composite} />
          <EntitySparkline
            type={entity.type}
            slug={entity.slug}
            width={48}
            height={16}
            className="shrink-0"
          />
          <span className="w-8 text-sm font-mono font-bold text-circuit text-right">
            {entity.scores.composite}
          </span>
        </div>

        {/* Expand indicator */}
        <span
          className={cn(
            "text-text-muted text-xs transition-transform duration-200 shrink-0",
            expanded && "rotate-180",
          )}
        >
          &#9662;
        </span>
      </button>

      {/* Expanded score breakdown */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 pl-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {SCORE_KEYS.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                    {label}
                  </span>
                  <span className="text-xs font-mono text-circuit">
                    {entity.scores[key]}
                  </span>
                </div>
                <ScoreBar value={entity.scores[key]} />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {entity.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono text-text-muted bg-surface px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
            <Link
              href={`/${entity.type}/${entity.slug}`}
              className="text-[10px] font-mono text-circuit hover:underline ml-auto"
            >
              View full spec &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Client Component                                                     */
/* -------------------------------------------------------------------------- */

export function LeaderboardClient({ entities }: { entities: Entity[] }) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const trending = entities.slice(0, 5);

  const filtered =
    activeTab === "all"
      ? entities
      : entities.filter((e) => e.type === activeTab);

  return (
    <div className="space-y-12">
      {/* ---- Trending Section ---- */}
      <div>
        <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">
          Trending — Top 5
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {trending.map((entity, i) => (
            <TrendingCard
              key={`${entity.type}-${entity.slug}`}
              entity={entity}
              rank={i + 1}
            />
          ))}
        </div>
      </div>

      {/* ---- Category Tabs ---- */}
      <div>
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "px-3 py-1.5 text-xs font-mono uppercase tracking-wider border rounded transition-colors",
                activeTab === key
                  ? "text-circuit border-circuit bg-circuit/10"
                  : "text-text-muted border-border hover:border-circuit/30",
              )}
            >
              {label}
              <span className="ml-1.5 opacity-60">
                {key === "all"
                  ? entities.length
                  : entities.filter((e) => e.type === key).length}
              </span>
            </button>
          ))}
        </div>

        {/* ---- Rankings Table ---- */}
        <Card className="overflow-hidden !p-0">
          {/* Table header */}
          <div className="px-4 py-2 flex items-center gap-4 border-b border-border bg-surface/30">
            <span className="w-10 text-[10px] font-mono uppercase tracking-wider text-text-muted text-center">
              Rank
            </span>
            <span className="flex-grow text-[10px] font-mono uppercase tracking-wider text-text-muted">
              Entity
            </span>
            <span className="w-64 text-[10px] font-mono uppercase tracking-wider text-text-muted text-right pr-10">
              Score
            </span>
            <span className="w-4" />
          </div>

          {/* Rows */}
          {filtered.length > 0 ? (
            filtered.map((entity, i) => (
              <LeaderboardRow
                key={`${entity.type}-${entity.slug}`}
                entity={entity}
                rank={i + 1}
              />
            ))
          ) : (
            <div className="px-4 py-12 text-center text-text-muted text-sm">
              No entities found for this category.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
