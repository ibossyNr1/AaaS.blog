"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, cn } from "@aaas/ui";
import { GradeBadge } from "@/components/grade-badge";
import { ENTITY_TYPES } from "@/lib/types";
import type { EntityType } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ComparisonEntity {
  type: string;
  slug: string;
  name: string;
  provider: string;
  composite: number;
}

interface Comparison {
  id: string;
  entityA: ComparisonEntity;
  entityB: ComparisonEntity;
  category: string;
  interestScore: number;
  sharedTags: string[];
  scoreDiff: number;
  generatedAt: string;
}

type SortKey = "interest" | "scoreDiff" | "alpha";

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ComparisonsClient() {
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("interest");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchComparisons() {
      try {
        const res = await fetch("/api/comparisons");
        if (!res.ok) throw new Error("Failed to fetch comparisons");
        const data = await res.json();
        setComparisons(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchComparisons();
  }, []);

  const filtered = useMemo(() => {
    let items = comparisons;

    // Filter by entity type
    if (typeFilter !== "all") {
      items = items.filter(
        (c) => c.entityA.type === typeFilter || c.entityB.type === typeFilter,
      );
    }

    // Sort
    const sorted = [...items];
    switch (sortBy) {
      case "interest":
        sorted.sort((a, b) => b.interestScore - a.interestScore);
        break;
      case "scoreDiff":
        sorted.sort((a, b) => a.scoreDiff - b.scoreDiff);
        break;
      case "alpha":
        sorted.sort((a, b) =>
          `${a.entityA.name} vs ${a.entityB.name}`.localeCompare(
            `${b.entityA.name} vs ${b.entityB.name}`,
          ),
        );
        break;
    }

    return sorted;
  }, [comparisons, sortBy, typeFilter]);

  // Collect unique entity types from data
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    for (const c of comparisons) {
      types.add(c.entityA.type);
      types.add(c.entityB.type);
    }
    return Array.from(types).sort();
  }, [comparisons]);

  if (loading) {
    return (
      <div className="text-text-muted text-sm py-12 text-center">
        Loading comparisons...
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red/30 rounded-lg py-12 text-center">
        <p className="text-red text-sm">{error}</p>
      </div>
    );
  }

  if (comparisons.length === 0) {
    return (
      <div className="border border-border rounded-lg py-16 text-center">
        <p className="text-text-muted text-sm mb-2">No comparisons generated yet.</p>
        <p className="text-text-muted/60 text-xs">
          The comparison agent runs weekly to generate popular matchups.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="bg-surface border border-border rounded px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-text-muted focus:outline-none focus:border-circuit/50 transition-colors appearance-none pr-7 cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 8px center",
          }}
        >
          <option value="interest">Most Interesting</option>
          <option value="scoreDiff">Closest Scores</option>
          <option value="alpha">Alphabetical</option>
        </select>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-surface border border-border rounded px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-text-muted focus:outline-none focus:border-circuit/50 transition-colors appearance-none pr-7 cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 8px center",
          }}
        >
          <option value="all">All Types</option>
          {availableTypes.map((t) => (
            <option key={t} value={t}>
              {ENTITY_TYPES[t as EntityType]?.plural ?? t}
            </option>
          ))}
        </select>

        {/* Count */}
        <span className="text-xs font-mono text-text-muted ml-auto">
          <span className={cn("font-bold", filtered.length > 0 && "text-circuit")}>
            {filtered.length}
          </span>{" "}
          {filtered.length === 1 ? "comparison" : "comparisons"}
        </span>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((comparison) => (
            <ComparisonCard key={comparison.id} comparison={comparison} />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg py-16 text-center">
          <p className="text-text-muted text-sm">
            No comparisons match the selected filter.
          </p>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ComparisonCard                                                             */
/* -------------------------------------------------------------------------- */

function ComparisonCard({ comparison }: { comparison: Comparison }) {
  const { entityA, entityB, category, sharedTags, scoreDiff, interestScore } = comparison;

  const compareUrl = `/compare?e=${entityA.type}:${entityA.slug},${entityB.type}:${entityB.slug}`;

  return (
    <Card className="p-5 space-y-4">
      {/* Title */}
      <div>
        <h3 className="text-sm font-semibold text-text leading-snug">
          {entityA.name}{" "}
          <span className="text-text-muted font-normal">vs</span>{" "}
          {entityB.name}
        </h3>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-circuit/10 text-circuit">
            {category}
          </span>
          <span className="text-[10px] font-mono text-text-muted">
            Interest: {interestScore}
          </span>
        </div>
      </div>

      {/* Score comparison */}
      <div className="flex items-center gap-4">
        {/* Entity A */}
        <div className="flex-1 flex items-center gap-2">
          <GradeBadge composite={entityA.composite} size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-mono text-circuit truncate">{entityA.composite}</p>
            <p className="text-[10px] text-text-muted truncate">{entityA.provider || entityA.name}</p>
          </div>
        </div>

        {/* Diff indicator */}
        <div className="shrink-0 text-center">
          <div
            className={cn(
              "inline-flex items-center justify-center w-10 h-10 rounded-full border text-xs font-mono font-bold",
              scoreDiff <= 5
                ? "border-circuit/30 text-circuit bg-circuit/5"
                : scoreDiff <= 15
                  ? "border-yellow-500/30 text-yellow-500 bg-yellow-500/5"
                  : "border-border text-text-muted bg-surface",
            )}
          >
            {scoreDiff === 0 ? "=" : `${scoreDiff}`}
          </div>
          <p className="text-[9px] font-mono text-text-muted mt-0.5">diff</p>
        </div>

        {/* Entity B */}
        <div className="flex-1 flex items-center justify-end gap-2">
          <div className="min-w-0 text-right">
            <p className="text-xs font-mono text-circuit truncate">{entityB.composite}</p>
            <p className="text-[10px] text-text-muted truncate">{entityB.provider || entityB.name}</p>
          </div>
          <GradeBadge composite={entityB.composite} size="sm" />
        </div>
      </div>

      {/* Shared tags */}
      {sharedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sharedTags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-surface border border-border text-text-muted"
            >
              {tag}
            </span>
          ))}
          {sharedTags.length > 6 && (
            <span className="text-[10px] font-mono text-text-muted self-center">
              +{sharedTags.length - 6} more
            </span>
          )}
        </div>
      )}

      {/* Compare button */}
      <Link
        href={compareUrl}
        className="inline-flex items-center justify-center w-full px-4 py-2 rounded-md text-xs font-mono uppercase tracking-wider bg-circuit/10 text-circuit hover:bg-circuit/20 transition-colors"
      >
        Compare
      </Link>
    </Card>
  );
}
