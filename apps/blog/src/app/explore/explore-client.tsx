"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@aaas/ui";
import type { Entity } from "@/lib/types";
import { CHANNELS } from "@/lib/channels";
import { EntityCard } from "@/components/entity-card";
import { SearchAutocomplete } from "@/components/search-autocomplete";
import { SearchFilters, type FilterState } from "@/components/search-filters";
import { Breadcrumbs } from "@/components/breadcrumbs";

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
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Explore" },
        ]}
      />

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
          className="bg-surface/60 backdrop-blur-sm border border-border/60 rounded-lg px-4 py-2 text-xs font-mono uppercase tracking-wider text-text-muted focus:outline-none focus:border-circuit/50 focus:ring-1 focus:ring-circuit/20 transition-all appearance-none pr-8 cursor-pointer shadow-sm hover:border-circuit/30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
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
          <span className={cn("font-bold text-lg -my-1 inline-block", results.length > 0 ? "text-circuit drop-shadow-[0_0_6px_rgba(0,243,255,0.4)]" : "text-text-muted")}>
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
        <div className="border border-border/50 rounded-lg py-20 text-center bg-surface/30 backdrop-blur-sm">
          <p className="outline-text text-2xl md:text-3xl font-black uppercase tracking-tight mb-3">
            No Results
          </p>
          <p className="text-text-muted text-sm mb-1">
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
