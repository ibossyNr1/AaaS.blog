"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, Badge, cn } from "@aaas/ui";
import { GradeBadge } from "@/components/grade-badge";
import type { Entity, EntityType } from "@/lib/types";
import { ENTITY_TYPES } from "@/lib/types";
import { getChannelName } from "@/lib/channels";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SearchMode = "keyword" | "semantic" | "hybrid";
type SortOption = "relevance" | "composite" | "name" | "newest";

const SEARCH_MODES: { value: SearchMode; label: string; description: string }[] = [
  { value: "keyword", label: "Keyword", description: "Traditional text matching" },
  { value: "semantic", label: "Semantic", description: "AI-powered meaning search" },
  { value: "hybrid", label: "Hybrid", description: "Combined keyword + semantic" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "composite", label: "Score" },
  { value: "name", label: "Name" },
  { value: "newest", label: "Recent" },
];

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All Types" },
  ...Object.entries(ENTITY_TYPES).map(([key, info]) => ({
    value: key,
    label: info.plural,
  })),
];

const TYPE_BADGE_COLORS: Record<string, string> = {
  tool: "bg-blue-500/20 text-blue-400",
  model: "bg-purple-500/20 text-purple-400",
  agent: "bg-green-500/20 text-green-400",
  skill: "bg-amber-500/20 text-amber-400",
  script: "bg-rose-500/20 text-rose-400",
  benchmark: "bg-cyan-500/20 text-cyan-400",
};

/* ------------------------------------------------------------------ */
/*  Search suggestion list                                             */
/* ------------------------------------------------------------------ */

const SEARCH_SUGGESTIONS = [
  "GPT-4",
  "LangChain",
  "code generation",
  "autonomous agents",
  "benchmarks",
  "open-source models",
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SearchClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get("q") || "";
  const initialSort = (searchParams.get("sort") as SortOption) || "relevance";
  const initialType = searchParams.get("type") || "";
  const initialMode = (searchParams.get("mode") as SearchMode) || "keyword";

  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [searchMode, setSearchMode] = useState<SearchMode>(initialMode);
  const [results, setResults] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalScanned, setTotalScanned] = useState(0);
  const [activeMode, setActiveMode] = useState<string>("");

  /* --- Fetch results ------------------------------------------------ */
  const fetchResults = useCallback(async (q: string, s: SortOption, t: string, mode: SearchMode = "keyword") => {
    if (!q.trim()) {
      setResults([]);
      setActiveMode("");
      return;
    }

    setLoading(true);
    try {
      let endpoint: string;
      const params = new URLSearchParams({ q: q.trim(), limit: "50" });
      if (t) params.set("type", t);

      if (mode === "semantic") {
        endpoint = "/api/search/semantic";
      } else if (mode === "hybrid") {
        endpoint = "/api/search/hybrid";
      } else {
        endpoint = "/api/search";
        params.set("sort", s);
      }

      const res = await fetch(`${endpoint}?${params}`);
      if (res.ok) {
        const json = await res.json();

        // Semantic/hybrid endpoints return { slug, type, name, score, metadata }
        // Normalize to Entity-like objects for rendering
        if (mode === "semantic" || mode === "hybrid") {
          const normalized = (json.data ?? []).map((r: { slug: string; type: string; name: string; score: number; metadata: Record<string, unknown> }) => ({
            slug: r.slug,
            type: r.type || (r.metadata?.type as string) || "tool",
            name: r.name || (r.metadata?.name as string) || r.slug,
            description: (r.metadata?.description as string) || "",
            provider: (r.metadata?.provider as string) || "",
            tags: (r.metadata?.tags as string[]) || [],
            category: (r.metadata?.category as string) || "",
            scores: { composite: (r.metadata?.composite as number) || 0, adoption: 0, quality: 0, freshness: 0, citations: 0, engagement: 0 },
            _semanticScore: r.score,
          }));
          setResults(normalized);
          setTotalScanned(json.count ?? normalized.length);
        } else {
          setResults(json.data ?? []);
          setTotalScanned(json.total ?? 0);
        }

        setActiveMode(json.mode || mode);
      }
    } catch {
      /* swallow */
    } finally {
      setLoading(false);
    }
  }, []);

  /* --- Search on mount and param changes ----------------------------- */
  useEffect(() => {
    fetchResults(initialQuery, initialSort, initialType, initialMode);
  }, [initialQuery, initialSort, initialType, initialMode, fetchResults]);

  /* --- Update URL params --------------------------------------------- */
  const updateParams = useCallback(
    (q: string, s: SortOption, t: string, mode: SearchMode = "keyword") => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (s !== "relevance") params.set("sort", s);
      if (t) params.set("type", t);
      if (mode !== "keyword") params.set("mode", mode);
      router.replace(`/search?${params.toString()}`);
    },
    [router],
  );

  /* --- Handlers ------------------------------------------------------ */
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams(query, sort, typeFilter, searchMode);
    fetchResults(query, sort, typeFilter, searchMode);
  }

  function handleSortChange(s: SortOption) {
    setSort(s);
    updateParams(query, s, typeFilter, searchMode);
    fetchResults(query, s, typeFilter, searchMode);
  }

  function handleTypeChange(t: string) {
    setTypeFilter(t);
    updateParams(query, sort, t, searchMode);
    fetchResults(query, sort, t, searchMode);
  }

  function handleModeChange(mode: SearchMode) {
    setSearchMode(mode);
    updateParams(query, sort, typeFilter, mode);
    if (query.trim()) {
      fetchResults(query, sort, typeFilter, mode);
    }
  }

  function handleSuggestion(suggestion: string) {
    setQuery(suggestion);
    updateParams(suggestion, sort, typeFilter, searchMode);
    fetchResults(suggestion, sort, typeFilter, searchMode);
  }

  /* --- Group results by type ----------------------------------------- */
  const groupedResults: Record<string, Entity[]> = {};
  for (const entity of results) {
    const type = entity.type;
    if (!groupedResults[type]) groupedResults[type] = [];
    groupedResults[type].push(entity);
  }

  const hasResults = results.length > 0;
  const hasQuery = query.trim().length > 0;

  return (
    <div className="space-y-8">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entities by name, provider, tags, or description..."
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-surface border border-border text-text placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-circuit/50 focus:border-circuit transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 rounded-lg bg-circuit text-base-deep font-medium text-sm hover:bg-circuit/90 transition-colors shrink-0"
        >
          Search
        </button>
      </form>

      {/* Search mode toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-text-muted uppercase tracking-wider">Mode</span>
        <div className="flex gap-1 p-0.5 rounded-lg bg-surface border border-border">
          {SEARCH_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => handleModeChange(mode.value)}
              title={mode.description}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                searchMode === mode.value
                  ? "bg-circuit/20 text-circuit shadow-sm"
                  : "text-text-muted hover:text-text",
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
        {activeMode && activeMode !== searchMode && (
          <span className="text-[10px] font-mono text-text-muted bg-surface px-2 py-0.5 rounded border border-border">
            fallback: {activeMode}
          </span>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Sort (only for keyword mode) */}
        <div className={cn("flex items-center gap-2", searchMode !== "keyword" && "opacity-50 pointer-events-none")}>
          <span className="text-xs font-mono text-text-muted uppercase tracking-wider">Sort</span>
          <div className="flex gap-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSortChange(opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  sort === opt.value
                    ? "bg-circuit/20 text-circuit"
                    : "text-text-muted hover:text-text hover:bg-surface",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text-muted uppercase tracking-wider">Type</span>
          <select
            value={typeFilter}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="px-3 py-1.5 rounded-md text-xs bg-surface border border-border text-text focus:outline-none focus:ring-1 focus:ring-circuit/50"
          >
            {TYPE_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Results count */}
        {hasQuery && !loading && (
          <span className="ml-auto text-xs text-text-muted font-mono">
            {results.length} result{results.length !== 1 ? "s" : ""} found
            {totalScanned > 0 && ` (scanned ${totalScanned})`}
          </span>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-text-muted">
            <div className="w-5 h-5 border-2 border-circuit/30 border-t-circuit rounded-full animate-spin" />
            <span className="text-sm">Searching...</span>
          </div>
        </div>
      )}

      {/* Results grouped by type */}
      {!loading && hasResults && (
        <div className="space-y-10">
          {Object.entries(groupedResults).map(([type, entities]) => {
            const typeInfo = ENTITY_TYPES[type as EntityType];
            return (
              <section key={type}>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-semibold text-text">
                    {typeInfo?.plural ?? type}
                  </h2>
                  <Badge variant="circuit">{entities.length}</Badge>
                </div>
                <div className="grid gap-3">
                  {entities.map((entity) => (
                    <Link key={`${entity.type}-${entity.slug}`} href={`/${entity.type}/${entity.slug}`}>
                      <Card className="group cursor-pointer hover:border-circuit/30 transition-all">
                        <div className="flex items-start gap-4">
                          {/* Type badge */}
                          <span
                            className={cn(
                              "shrink-0 mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase",
                              TYPE_BADGE_COLORS[entity.type] ?? "bg-gray-500/20 text-gray-400",
                            )}
                          >
                            {entity.type}
                          </span>

                          {/* Main content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-text group-hover:text-circuit transition-colors truncate">
                                {entity.name}
                              </h3>
                              <span className="text-xs text-text-muted font-mono">
                                by {entity.provider}
                              </span>
                            </div>
                            <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                              {entity.description}
                            </p>
                            {/* Tags */}
                            {entity.tags?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {entity.tags.slice(0, 4).map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[10px] font-mono text-text-muted bg-surface px-2 py-0.5 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Score + grade */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-text-muted font-mono">
                              {getChannelName(entity.category)}
                            </span>
                            <span className="text-sm font-mono text-circuit font-semibold">
                              {entity.scores?.composite ?? 0}
                            </span>
                            <GradeBadge composite={entity.scores?.composite ?? 0} size="sm" />
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* No results state */}
      {!loading && !hasResults && hasQuery && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface mb-4">
            <svg
              className="w-8 h-8 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">
            No results for &ldquo;{query}&rdquo;
          </h3>
          <p className="text-sm text-text-muted mb-6 max-w-md mx-auto">
            Try adjusting your search terms, removing filters, or searching for something else.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="text-xs text-text-muted">Try:</span>
            {SEARCH_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="px-3 py-1 rounded-full text-xs bg-surface text-text-muted hover:text-circuit hover:bg-circuit/10 transition-colors border border-border"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state — no query */}
      {!loading && !hasQuery && (
        <div className="text-center py-16">
          <h3 className="text-lg font-semibold text-text mb-2">Search the Knowledge Index</h3>
          <p className="text-sm text-text-muted mb-6 max-w-md mx-auto">
            Find tools, models, agents, skills, scripts, and benchmarks across the entire AI ecosystem.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SEARCH_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="px-3 py-1.5 rounded-full text-xs bg-surface text-text-muted hover:text-circuit hover:bg-circuit/10 transition-colors border border-border"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
