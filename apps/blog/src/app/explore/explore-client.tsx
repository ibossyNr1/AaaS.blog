"use client";

import { useState, useMemo } from "react";
import { cn } from "@aaas/ui";
import type { Entity, EntityType } from "@/lib/types";
import { CHANNELS } from "@/lib/channels";
import { EntityCard } from "@/components/entity-card";
import { SearchAutocomplete } from "@/components/search-autocomplete";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
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

type SortKey = "trending" | "newest" | "alphabetical";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "trending", label: "Trending" },
  { key: "newest", label: "Newest" },
  { key: "alphabetical", label: "A-Z" },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function ExploreClient({ entities }: { entities: Entity[] }) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [channel, setChannel] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("trending");

  const results = useMemo(() => {
    let filtered = entities;

    // Type filter
    if (activeTab !== "all") {
      filtered = filtered.filter((e) => e.type === activeTab);
    }

    // Channel filter
    if (channel !== "all") {
      filtered = filtered.filter((e) => e.category === channel);
    }

    // Sort
    const sorted = [...filtered];
    switch (sort) {
      case "trending":
        sorted.sort((a, b) => b.scores.composite - a.scores.composite);
        break;
      case "newest":
        sorted.sort(
          (a, b) =>
            new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime(),
        );
        break;
      case "alphabetical":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return sorted;
  }, [entities, activeTab, channel, sort]);

  return (
    <div className="space-y-6">
      {/* ---- Search Autocomplete ---- */}
      <SearchAutocomplete
        placeholder="Search by name, description, provider, or tag..."
      />

      {/* ---- Filters Row ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Entity Type Tabs */}
        <div className="flex flex-wrap gap-2 flex-grow">
          {TABS.map(({ key, label }) => {
            const count =
              key === "all"
                ? entities.length
                : entities.filter((e) => e.type === key).length;

            return (
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
                <span className="ml-1.5 opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Channel + Sort Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Channel Dropdown */}
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="bg-surface border border-border rounded px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-text-muted focus:outline-none focus:border-circuit/50 transition-colors appearance-none pr-7 cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
            }}
          >
            <option value="all">All Channels</option>
            {CHANNELS.map((ch) => (
              <option key={ch.slug} value={ch.slug}>
                {ch.name}
              </option>
            ))}
          </select>

          {/* Sort Toggle */}
          <div className="flex border border-border rounded overflow-hidden">
            {SORT_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={cn(
                  "px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors",
                  sort === key
                    ? "text-circuit bg-circuit/10"
                    : "text-text-muted hover:text-text hover:bg-surface/50",
                  key !== "trending" && "border-l border-border",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Result Count ---- */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-wider text-text-muted">
          {results.length} {results.length === 1 ? "result" : "results"}
        </p>
        {(activeTab !== "all" || channel !== "all") && (
          <button
            onClick={() => {
              setActiveTab("all");
              setChannel("all");
              setSort("trending");
            }}
            className="text-xs font-mono uppercase tracking-wider text-circuit hover:underline transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ---- Grid ---- */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((entity) => (
            <EntityCard key={`${entity.type}-${entity.slug}`} entity={entity} />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg py-16 text-center">
          <p className="text-text-muted text-sm mb-2">
            No entities match the current filters.
          </p>
          <p className="text-text-muted/60 text-xs">
            Try adjusting your search term, type filter, or channel selection.
          </p>
        </div>
      )}
    </div>
  );
}
