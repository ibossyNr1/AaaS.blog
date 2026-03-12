"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@aaas/ui";

/* ------------------------------------------------------------------ */
/*  Static page entries                                                */
/* ------------------------------------------------------------------ */

interface PageEntry {
  label: string;
  href: string;
  section?: string;
}

const pages: PageEntry[] = [
  { label: "Explore", href: "/explore", section: "Navigation" },
  { label: "Leaderboard", href: "/leaderboard", section: "Navigation" },
  { label: "Listen", href: "/listen", section: "Navigation" },
  { label: "Compare", href: "/compare", section: "Navigation" },
  { label: "Graph", href: "/graph", section: "Navigation" },
  { label: "Submit", href: "/submit", section: "Navigation" },
  { label: "Developers", href: "/developer", section: "Navigation" },
  { label: "Dashboard", href: "/me", section: "Account" },
  { label: "System", href: "/dashboard", section: "Account" },
  { label: "Stats", href: "/stats", section: "Account" },
  { label: "Activity", href: "/activity", section: "Account" },
  { label: "Watchlist", href: "/watchlist", section: "Account" },
  { label: "API Docs", href: "/api-docs", section: "Developer" },
  { label: "Embed", href: "/embed", section: "Developer" },
  { label: "Admin Review", href: "/admin/review", section: "Admin" },
];

/* ------------------------------------------------------------------ */
/*  Entity type badges                                                 */
/* ------------------------------------------------------------------ */

const typeBadgeColors: Record<string, string> = {
  tool: "bg-blue-500/20 text-blue-400",
  model: "bg-purple-500/20 text-purple-400",
  agent: "bg-green-500/20 text-green-400",
  skill: "bg-amber-500/20 text-amber-400",
  script: "bg-rose-500/20 text-rose-400",
  benchmark: "bg-cyan-500/20 text-cyan-400",
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SearchEntity {
  slug: string;
  name: string;
  type: string;
  description: string;
}

type ResultItem =
  | { kind: "page"; label: string; href: string }
  | { kind: "entity"; name: string; type: string; slug: string; description: string };

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [entities, setEntities] = useState<SearchEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* --- Keyboard shortcut to open ---------------------------------- */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /* --- Focus input when opened ------------------------------------ */
  useEffect(() => {
    if (open) {
      setQuery("");
      setEntities([]);
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  /* --- Debounced entity search ------------------------------------ */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setEntities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`);
        if (res.ok) {
          const json = await res.json();
          setEntities(json.data ?? []);
        }
      } catch {
        /* swallow */
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  /* --- Build unified result list ---------------------------------- */
  const filteredPages: ResultItem[] = pages
    .filter(
      (p) =>
        !query ||
        p.label.toLowerCase().includes(query.toLowerCase()) ||
        p.href.toLowerCase().includes(query.toLowerCase()),
    )
    .map((p) => ({ kind: "page", label: p.label, href: p.href }));

  const entityResults: ResultItem[] = entities.map((e) => ({
    kind: "entity",
    name: e.name,
    type: e.type,
    slug: e.slug,
    description: e.description,
  }));

  const results: ResultItem[] =
    query.length >= 2 ? [...entityResults, ...filteredPages] : filteredPages;

  /* --- Navigation helper ------------------------------------------ */
  const navigate = useCallback(
    (item: ResultItem) => {
      setOpen(false);
      if (item.kind === "page") {
        router.push(item.href);
      } else {
        router.push(`/${item.type}/${item.slug}`);
      }
    },
    [router],
  );

  /* --- Keyboard navigation ---------------------------------------- */
  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      navigate(results[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  /* --- Scroll active item into view ------------------------------- */
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const active = container.querySelector("[data-active='true']");
    if (active) {
      active.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  /* --- Reset active index when results change --------------------- */
  useEffect(() => {
    setActiveIndex(0);
  }, [results.length]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg mx-4 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <svg
            className="w-4 h-4 text-text-muted shrink-0"
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
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search pages and entities..."
            className="flex-1 bg-transparent py-3.5 text-sm text-text placeholder:text-text-muted outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-base text-[10px] font-mono text-text-muted border border-border">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
          {results.length === 0 && !loading && (
            <p className="px-4 py-6 text-center text-sm text-text-muted">
              {query.length >= 2 ? "No results found." : "Start typing to search..."}
            </p>
          )}

          {loading && query.length >= 2 && results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-text-muted">Searching...</p>
          )}

          {/* Entity results */}
          {entityResults.length > 0 && (
            <>
              <div className="px-4 pt-2 pb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                  Entities
                </span>
              </div>
              {entityResults.map((item, i) => {
                const globalIndex = i;
                if (item.kind !== "entity") return null;
                return (
                  <button
                    key={`${item.type}-${item.slug}`}
                    data-active={globalIndex === activeIndex}
                    onClick={() => navigate(item)}
                    onMouseEnter={() => setActiveIndex(globalIndex)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      globalIndex === activeIndex
                        ? "bg-circuit/10 text-text"
                        : "text-text-muted hover:bg-circuit/5",
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase",
                        typeBadgeColors[item.type] ?? "bg-gray-500/20 text-gray-400",
                      )}
                    >
                      {item.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.name}</div>
                      <div className="text-xs text-text-muted truncate">
                        {item.description?.slice(0, 80)}
                        {item.description?.length > 80 ? "..." : ""}
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* Page results */}
          {filteredPages.length > 0 && (
            <>
              <div className="px-4 pt-2 pb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                  Pages
                </span>
              </div>
              {filteredPages.map((item, i) => {
                const globalIndex = entityResults.length + i;
                if (item.kind !== "page") return null;
                return (
                  <button
                    key={item.href}
                    data-active={globalIndex === activeIndex}
                    onClick={() => navigate(item)}
                    onMouseEnter={() => setActiveIndex(globalIndex)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      globalIndex === activeIndex
                        ? "bg-circuit/10 text-text"
                        : "text-text-muted hover:bg-circuit/5",
                    )}
                  >
                    <svg
                      className="w-4 h-4 shrink-0 text-text-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                    <span className="text-sm">{item.label}</span>
                    <span className="ml-auto text-xs font-mono text-text-muted">{item.href}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
