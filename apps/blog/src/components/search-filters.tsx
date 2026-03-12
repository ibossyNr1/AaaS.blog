"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { cn } from "@aaas/ui";
import type { Entity, EntityType } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface FilterState {
  types: EntityType[];
  scoreMin: number;
  scoreMax: number;
  provider: string;
  tags: string[];
  addedAfter: string;
  sort: string;
}

interface SearchFiltersProps {
  entities: Entity[];
  onChange: (filters: FilterState) => void;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const ALL_TYPES: { key: EntityType; label: string }[] = [
  { key: "tool", label: "Tools" },
  { key: "model", label: "Models" },
  { key: "agent", label: "Agents" },
  { key: "skill", label: "Skills" },
  { key: "script", label: "Scripts" },
  { key: "benchmark", label: "Benchmarks" },
];

const SORT_OPTIONS = [
  { key: "composite", label: "Score" },
  { key: "newest", label: "Newest" },
  { key: "name", label: "A-Z" },
];

const DEFAULT_FILTERS: FilterState = {
  types: [],
  scoreMin: 0,
  scoreMax: 100,
  provider: "",
  tags: [],
  addedAfter: "",
  sort: "composite",
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function SearchFilters({ entities, onChange, className }: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [tagInput, setTagInput] = useState("");
  const [providerFocused, setProviderFocused] = useState(false);
  const [tagFocused, setTagFocused] = useState(false);
  const providerRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);

  /* ---- Derived data from entities ---- */
  const knownProviders = useMemo(() => {
    const set = new Set<string>();
    entities.forEach((e) => {
      if (e.provider) set.add(e.provider);
    });
    return Array.from(set).sort();
  }, [entities]);

  const knownTags = useMemo(() => {
    const set = new Set<string>();
    entities.forEach((e) => {
      e.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [entities]);

  /* ---- Active filter count ---- */
  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.types.length > 0) count++;
    if (filters.scoreMin > 0 || filters.scoreMax < 100) count++;
    if (filters.provider) count++;
    if (filters.tags.length > 0) count++;
    if (filters.addedAfter) count++;
    if (filters.sort !== "composite") count++;
    return count;
  }, [filters]);

  /* ---- Emit changes ---- */
  const update = useCallback(
    (patch: Partial<FilterState>) => {
      setFilters((prev) => {
        const next = { ...prev, ...patch };
        onChange(next);
        return next;
      });
    },
    [onChange],
  );

  /* ---- Clear all ---- */
  const clearAll = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setTagInput("");
    onChange(DEFAULT_FILTERS);
  }, [onChange]);

  /* ---- Click outside for dropdowns ---- */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (providerRef.current && !providerRef.current.contains(e.target as Node)) {
        setProviderFocused(false);
      }
      if (tagRef.current && !tagRef.current.contains(e.target as Node)) {
        setTagFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ---- Provider suggestions ---- */
  const providerSuggestions = useMemo(() => {
    if (!filters.provider) return knownProviders.slice(0, 8);
    const q = filters.provider.toLowerCase();
    return knownProviders.filter((p) => p.toLowerCase().includes(q)).slice(0, 8);
  }, [filters.provider, knownProviders]);

  /* ---- Tag suggestions ---- */
  const tagSuggestions = useMemo(() => {
    const available = knownTags.filter((t) => !filters.tags.includes(t));
    if (!tagInput) return available.slice(0, 8);
    const q = tagInput.toLowerCase();
    return available.filter((t) => t.toLowerCase().includes(q)).slice(0, 8);
  }, [tagInput, knownTags, filters.tags]);

  /* ---- Toggle type ---- */
  const toggleType = useCallback(
    (type: EntityType) => {
      update({
        types: filters.types.includes(type)
          ? filters.types.filter((t) => t !== type)
          : [...filters.types, type],
      });
    },
    [filters.types, update],
  );

  /* ---- Add tag ---- */
  const addTag = useCallback(
    (tag: string) => {
      if (!filters.tags.includes(tag)) {
        update({ tags: [...filters.tags, tag] });
      }
      setTagInput("");
    },
    [filters.tags, update],
  );

  /* ---- Remove tag ---- */
  const removeTag = useCallback(
    (tag: string) => {
      update({ tags: filters.tags.filter((t) => t !== tag) });
    },
    [filters.tags, update],
  );

  /* ---- Active filter pills ---- */
  const activePills = useMemo(() => {
    const pills: { label: string; onRemove: () => void }[] = [];

    if (filters.types.length > 0) {
      pills.push({
        label: `Types: ${filters.types.join(", ")}`,
        onRemove: () => update({ types: [] }),
      });
    }
    if (filters.scoreMin > 0 || filters.scoreMax < 100) {
      pills.push({
        label: `Score: ${filters.scoreMin}-${filters.scoreMax}`,
        onRemove: () => update({ scoreMin: 0, scoreMax: 100 }),
      });
    }
    if (filters.provider) {
      pills.push({
        label: `Provider: ${filters.provider}`,
        onRemove: () => update({ provider: "" }),
      });
    }
    filters.tags.forEach((tag) => {
      pills.push({
        label: `Tag: ${tag}`,
        onRemove: () => removeTag(tag),
      });
    });
    if (filters.addedAfter) {
      pills.push({
        label: `After: ${filters.addedAfter}`,
        onRemove: () => update({ addedAfter: "" }),
      });
    }
    if (filters.sort !== "composite") {
      const sortLabel = SORT_OPTIONS.find((s) => s.key === filters.sort)?.label ?? filters.sort;
      pills.push({
        label: `Sort: ${sortLabel}`,
        onRemove: () => update({ sort: "composite" }),
      });
    }

    return pills;
  }, [filters, update, removeTag]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* ---- Toggle Button ---- */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wider border rounded transition-colors",
            isOpen
              ? "text-circuit border-circuit bg-circuit/10"
              : "text-text-muted border-border hover:border-circuit/30",
          )}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="bg-circuit text-base text-[10px] leading-none px-1.5 py-0.5 rounded-full font-bold">
              {activeCount}
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-xs font-mono uppercase tracking-wider text-circuit hover:underline transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* ---- Active Filter Pills ---- */}
      {activePills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activePills.map((pill, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-circuit/10 text-circuit text-xs font-mono rounded-full"
            >
              {pill.label}
              <button
                onClick={pill.onRemove}
                className="hover:text-text transition-colors"
                aria-label={`Remove filter: ${pill.label}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* ---- Filter Panel ---- */}
      {isOpen && (
        <div className="border border-border rounded-lg bg-surface p-4 space-y-5">
          {/* -- Type Filter (checkboxes) -- */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
              Entity Types
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_TYPES.map(({ key, label }) => {
                const count = entities.filter((e) => e.type === key).length;
                const active = filters.types.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleType(key)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider border rounded transition-colors",
                      active
                        ? "text-circuit border-circuit bg-circuit/10"
                        : "text-text-muted border-border hover:border-circuit/30",
                    )}
                  >
                    <span
                      className={cn(
                        "w-3 h-3 rounded-sm border flex items-center justify-center transition-colors",
                        active ? "border-circuit bg-circuit" : "border-text-muted/40",
                      )}
                    >
                      {active && (
                        <svg className="w-2 h-2 text-base" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    {label}
                    <span className="opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* -- Score Range -- */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
              Score Range
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-text-muted w-8 text-right tabular-nums">
                  {filters.scoreMin}
                </span>
                <div className="relative flex-1 h-6 flex items-center">
                  {/* Visual bar */}
                  <div className="absolute inset-x-0 h-1.5 bg-border rounded-full" />
                  <div
                    className="absolute h-1.5 bg-circuit/50 rounded-full"
                    style={{
                      left: `${filters.scoreMin}%`,
                      right: `${100 - filters.scoreMax}%`,
                    }}
                  />
                  {/* Min slider */}
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={filters.scoreMin}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val <= filters.scoreMax) {
                        update({ scoreMin: val });
                      }
                    }}
                    className="absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-circuit [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-base [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-circuit [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-base [&::-moz-range-thumb]:cursor-pointer"
                    style={{ zIndex: filters.scoreMin > 50 ? 5 : 3 }}
                  />
                  {/* Max slider */}
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={filters.scoreMax}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= filters.scoreMin) {
                        update({ scoreMax: val });
                      }
                    }}
                    className="absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-circuit [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-base [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-circuit [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-base [&::-moz-range-thumb]:cursor-pointer"
                    style={{ zIndex: filters.scoreMax < 50 ? 5 : 4 }}
                  />
                </div>
                <span className="text-xs font-mono text-text-muted w-8 tabular-nums">
                  {filters.scoreMax}
                </span>
              </div>
            </div>
          </div>

          {/* -- Provider + Tags + Date row -- */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Provider */}
            <div ref={providerRef} className="relative">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
                Provider
              </label>
              <input
                type="text"
                value={filters.provider}
                onChange={(e) => update({ provider: e.target.value })}
                onFocus={() => setProviderFocused(true)}
                placeholder="Filter by provider..."
                className="w-full px-3 py-1.5 bg-base border border-border rounded text-xs font-mono text-text focus:outline-none focus:border-circuit transition-colors"
              />
              {providerFocused && providerSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-base border border-border rounded shadow-lg max-h-40 overflow-y-auto">
                  {providerSuggestions.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        update({ provider: p });
                        setProviderFocused(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-mono text-text-muted hover:bg-surface hover:text-text transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div ref={tagRef} className="relative">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
                Tags
              </label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onFocus={() => setTagFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tagInput.trim()) {
                    e.preventDefault();
                    addTag(tagInput.trim());
                  }
                }}
                placeholder="Add tags..."
                className="w-full px-3 py-1.5 bg-base border border-border rounded text-xs font-mono text-text focus:outline-none focus:border-circuit transition-colors"
              />
              {tagFocused && tagSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-base border border-border rounded shadow-lg max-h-40 overflow-y-auto">
                  {tagSuggestions.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        addTag(t);
                        setTagFocused(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-mono text-text-muted hover:bg-surface hover:text-text transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
              {filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {filters.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-circuit/10 text-circuit text-[10px] font-mono rounded-full"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-text transition-colors">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
                Added After
              </label>
              <input
                type="date"
                value={filters.addedAfter}
                onChange={(e) => update({ addedAfter: e.target.value })}
                className="w-full px-3 py-1.5 bg-base border border-border rounded text-xs font-mono text-text focus:outline-none focus:border-circuit transition-colors"
              />
            </div>
          </div>

          {/* -- Sort -- */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
              Sort By
            </label>
            <div className="flex border border-border rounded overflow-hidden w-fit">
              {SORT_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => update({ sort: key })}
                  className={cn(
                    "px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors",
                    filters.sort === key
                      ? "text-circuit bg-circuit/10"
                      : "text-text-muted hover:text-text hover:bg-surface/50",
                    key !== "composite" && "border-l border-border",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
