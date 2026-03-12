"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@aaas/ui";
import type { Entity } from "@/lib/types";
import { CHANNELS } from "@/lib/channels";
import { EntityCard } from "@/components/entity-card";
import { SearchAutocomplete } from "@/components/search-autocomplete";
import { SearchFilters, type FilterState } from "@/components/search-filters";

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function ExploreClient({ entities }: { entities: Entity[] }) {
  const [channel, setChannel] = useState<string>("all");
  const [filters, setFilters] = useState<FilterState>({
    types: [],
    scoreMin: 0,
    scoreMax: 100,
    provider: "",
    tags: [],
    addedAfter: "",
    sort: "composite",
  });

  const handleFilterChange = useCallback((next: FilterState) => {
    setFilters(next);
  }, []);

  const results = useMemo(() => {
    let filtered = entities;

    // Type filter (multi-select)
    if (filters.types.length > 0) {
      filtered = filtered.filter((e) => filters.types.includes(e.type));
    }

    // Channel filter
    if (channel !== "all") {
      filtered = filtered.filter((e) => e.category === channel);
    }

    // Score range
    if (filters.scoreMin > 0 || filters.scoreMax < 100) {
      filtered = filtered.filter(
        (e) =>
          e.scores.composite >= filters.scoreMin &&
          e.scores.composite <= filters.scoreMax,
      );
    }

    // Provider filter
    if (filters.provider) {
      const q = filters.provider.toLowerCase();
      filtered = filtered.filter((e) =>
        e.provider.toLowerCase().includes(q),
      );
    }

    // Tags filter (AND logic)
    if (filters.tags.length > 0) {
      filtered = filtered.filter((e) =>
        filters.tags.every((tag) => e.tags?.includes(tag)),
      );
    }

    // Date range
    if (filters.addedAfter) {
      const afterDate = new Date(filters.addedAfter).getTime();
      filtered = filtered.filter(
        (e) => new Date(e.addedDate).getTime() >= afterDate,
      );
    }

    // Sort
    const sorted = [...filtered];
    switch (filters.sort) {
      case "composite":
        sorted.sort((a, b) => b.scores.composite - a.scores.composite);
        break;
      case "newest":
        sorted.sort(
          (a, b) =>
            new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime(),
        );
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return sorted;
  }, [entities, filters, channel]);

  const hasActiveFilters =
    filters.types.length > 0 ||
    filters.scoreMin > 0 ||
    filters.scoreMax < 100 ||
    filters.provider !== "" ||
    filters.tags.length > 0 ||
    filters.addedAfter !== "" ||
    filters.sort !== "composite" ||
    channel !== "all";

  return (
    <div className="space-y-6">
      {/* ---- Search Autocomplete ---- */}
      <SearchAutocomplete
        placeholder="Search by name, description, provider, or tag..."
      />

      {/* ---- Advanced Filters ---- */}
      <SearchFilters
        entities={entities}
        onChange={handleFilterChange}
      />

      {/* ---- Channel Selector ---- */}
      <div className="flex items-center gap-3">
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

        {channel !== "all" && (
          <button
            onClick={() => setChannel("all")}
            className="text-xs font-mono uppercase tracking-wider text-circuit hover:underline transition-colors"
          >
            Clear channel
          </button>
        )}
      </div>

      {/* ---- Result Count ---- */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-wider text-text-muted">
          Showing{" "}
          <span className={cn("font-bold", results.length > 0 && "text-circuit")}>
            {results.length}
          </span>{" "}
          of {entities.length} {entities.length === 1 ? "entity" : "entities"}
        </p>
        {hasActiveFilters && (
          <button
            onClick={() => {
              setChannel("all");
              handleFilterChange({
                types: [],
                scoreMin: 0,
                scoreMax: 100,
                provider: "",
                tags: [],
                addedAfter: "",
                sort: "composite",
              });
            }}
            className="text-xs font-mono uppercase tracking-wider text-circuit hover:underline transition-colors"
          >
            Reset all
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
