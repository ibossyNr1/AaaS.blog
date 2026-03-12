"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@aaas/ui";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface SearchResult {
  slug: string;
  type: string;
  name: string;
  provider: string;
  scores: { composite: number };
}

interface SearchAutocompleteProps {
  placeholder?: string;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const TYPE_COLORS: Record<string, string> = {
  tool: "bg-blue-500/10 text-blue-400",
  model: "bg-purple-500/10 text-purple-400",
  agent: "bg-green-500/10 text-green-400",
  skill: "bg-yellow-500/10 text-yellow-400",
  script: "bg-pink-500/10 text-pink-400",
  benchmark: "bg-circuit/10 text-circuit",
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function SearchAutocomplete({
  placeholder = "Search the index...",
  className,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [hasSearched, setHasSearched] = useState(false);

  /* ---- Debounced fetch ---- */
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}&limit=8`,
        );
        if (!res.ok) throw new Error("Search failed");
        const json = await res.json();
        setResults(json.data ?? []);
        setHasSearched(true);
        setIsOpen(true);
        setHighlightIndex(-1);
      } catch {
        setResults([]);
        setHasSearched(true);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  /* ---- Click outside ---- */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ---- Navigate to result ---- */
  const navigateTo = useCallback(
    (result: SearchResult) => {
      setIsOpen(false);
      setQuery("");
      router.push(`/${result.type}/${result.slug}`);
    },
    [router],
  );

  /* ---- Keyboard navigation ---- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || results.length === 0) {
        if (e.key === "Escape") {
          setIsOpen(false);
          inputRef.current?.blur();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (highlightIndex >= 0 && highlightIndex < results.length) {
            navigateTo(results[highlightIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, results, highlightIndex, navigateTo],
  );

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* ---- Input ---- */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="w-4 h-4 text-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || (hasSearched && query.trim().length >= 2))
              setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-10 bg-surface border border-border rounded-lg text-text text-sm font-mono focus:outline-none focus:border-circuit transition-colors"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-circuit rounded-full animate-pulse" />
              <span className="w-1.5 h-1.5 bg-circuit rounded-full animate-pulse [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-circuit rounded-full animate-pulse [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>

      {/* ---- Dropdown ---- */}
      {isOpen && (
        <div className="absolute w-full bg-base border border-border rounded-lg shadow-xl mt-1 max-h-80 overflow-y-auto z-50">
          {results.length > 0
            ? results.map((result, i) => (
                <button
                  key={`${result.type}-${result.slug}`}
                  onClick={() => navigateTo(result)}
                  onMouseEnter={() => setHighlightIndex(i)}
                  className={cn(
                    "w-full text-left px-4 py-3 cursor-pointer transition-colors border-b border-border last:border-0 flex items-center gap-3",
                    i === highlightIndex
                      ? "bg-surface"
                      : "hover:bg-surface",
                  )}
                >
                  {/* Type badge */}
                  <span
                    className={cn(
                      "shrink-0 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded",
                      TYPE_COLORS[result.type] ?? "bg-surface text-text-muted",
                    )}
                  >
                    {result.type}
                  </span>

                  {/* Name + provider */}
                  <span className="flex-1 min-w-0">
                    <span className="text-sm text-text font-medium truncate block">
                      {result.name}
                    </span>
                    <span className="text-xs text-text-muted truncate block">
                      {result.provider}
                    </span>
                  </span>

                  {/* Composite score */}
                  <span className="shrink-0 text-xs font-mono text-text-muted tabular-nums">
                    {result.scores.composite.toFixed(1)}
                  </span>
                </button>
              ))
            : hasSearched && (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-text-muted">No results found</p>
                  <p className="text-xs text-text-muted/60 mt-1">
                    Try a different search term.
                  </p>
                </div>
              )}
        </div>
      )}
    </div>
  );
}
