"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, Badge, Button } from "@aaas/ui";

interface Suggestion {
  type: string;
  slug: string;
  name: string;
  reason: string;
  score: number;
}

interface SuggestionsResponse {
  personalized: boolean;
  suggestions: Suggestion[];
  generatedAt: string | null;
}

export function DiscoverySuggestions() {
  const [data, setData] = useState<SuggestionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(5);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/discover/suggestions");
      if (res.ok) {
        const json: SuggestionsResponse = await res.json();
        setData(json);
      }
    } catch {
      // Silently fail — suggestions are non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleRefresh = () => {
    setDisplayCount((prev) => {
      const next = prev + 3;
      if (data && next > data.suggestions.length) {
        // Refetch when we've cycled through all
        fetchSuggestions();
        return 5;
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text">Discover something new</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="min-w-[220px] h-28 rounded-lg bg-surface animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.suggestions.length === 0) {
    return null;
  }

  const visible = data.suggestions.slice(0, displayCount);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">
          {data.personalized ? "Recommended for you" : "Discover something new"}
        </h3>
        <Button variant="secondary" onClick={handleRefresh} className="text-xs px-3 py-1">
          Refresh
        </Button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {visible.map((suggestion) => (
          <Link
            key={`${suggestion.type}::${suggestion.slug}`}
            href={`/${suggestion.type}/${suggestion.slug}`}
            className="block min-w-[220px] max-w-[260px] flex-shrink-0"
          >
            <Card variant="glass" className="h-full p-4 hover:border-circuit/30 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="circuit" className="text-[10px]">
                  {suggestion.type}
                </Badge>
              </div>
              <p className="text-sm font-medium text-text line-clamp-1 mb-1">
                {suggestion.name}
              </p>
              <p className="text-xs text-text-muted line-clamp-2">
                {suggestion.reason}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
