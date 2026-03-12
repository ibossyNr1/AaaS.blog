"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Card, Badge, Button } from "@aaas/ui";
import type { Entity, EntityType } from "@/lib/types";
import { ENTITY_TYPES } from "@/lib/types";

const RELATION_TYPES = [
  { value: "uses", label: "Uses" },
  { value: "competes-with", label: "Competes With" },
  { value: "integrates-with", label: "Integrates With" },
  { value: "extends", label: "Extends" },
  { value: "replaces", label: "Replaces" },
  { value: "alternative-to", label: "Alternative To" },
  { value: "built-on", label: "Built On" },
  { value: "inspired-by", label: "Inspired By" },
] as const;

interface ResolvedRelation {
  slug: string;
  name: string;
  type: string;
}

interface SearchResult {
  slug: string;
  name: string;
  type: EntityType;
}

export function RelationshipEditor({ entity }: { entity: Entity }) {
  const [relations, setRelations] = useState<Record<string, ResolvedRelation[]>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [relationType, setRelationType] = useState<string>(RELATION_TYPES[0].value);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<SearchResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchRelations() {
      try {
        const res = await fetch(`/api/entity/${entity.type}/${entity.slug}/relations`);
        if (res.ok) {
          const json = await res.json();
          setRelations(json.data || {});
          const hasData = Object.values(json.data || {}).some(
            (arr) => (arr as ResolvedRelation[]).length > 0,
          );
          setExpanded(hasData);
        }
      } catch {
        // Silently fail — relations are supplementary
      } finally {
        setLoading(false);
      }
    }
    fetchRelations();
  }, [entity.type, entity.slug]);

  const searchEntities = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`);
      if (res.ok) {
        const json = await res.json();
        const results: SearchResult[] = (json.data || [])
          .filter((e: Entity) => !(e.type === entity.type && e.slug === entity.slug))
          .map((e: Entity) => ({ slug: e.slug, name: e.name, type: e.type }));
        setSearchResults(results);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [entity.type, entity.slug]);

  function handleSearchInput(value: string) {
    setSearchQuery(value);
    setSelectedTarget(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchEntities(value), 300);
  }

  function selectTarget(result: SearchResult) {
    setSelectedTarget(result);
    setSearchQuery(result.name);
    setSearchResults([]);
  }

  async function handleSubmit() {
    if (!selectedTarget) return;
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/entity/${entity.type}/${entity.slug}/relations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationType,
          targetType: selectedTarget.type,
          targetSlug: selectedTarget.slug,
        }),
      });

      if (res.ok) {
        setSuccessMessage(
          `Suggested "${RELATION_TYPES.find((r) => r.value === relationType)?.label}" relationship with ${selectedTarget.name}. Pending review.`,
        );
        setShowForm(false);
        setSelectedTarget(null);
        setSearchQuery("");
        setRelationType(RELATION_TYPES[0].value);
      } else {
        const json = await res.json();
        setErrorMessage(json.error || "Failed to submit suggestion");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const hasRelations = Object.values(relations).some((arr) => arr.length > 0);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 bg-surface hover:bg-surface/80 transition-colors text-left"
      >
        <h2 className="text-sm font-mono uppercase tracking-wider text-circuit flex items-center gap-2">
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Entity Relationships
          {hasRelations && (
            <span className="text-text-muted text-xs normal-case tracking-normal font-sans">
              ({Object.values(relations).reduce((sum, arr) => sum + arr.length, 0)})
            </span>
          )}
        </h2>
      </button>

      {expanded && (
        <div className="px-6 py-5 space-y-5">
          {loading ? (
            <p className="text-text-muted text-sm font-mono">Loading relationships...</p>
          ) : (
            <>
              {hasRelations ? (
                <div className="space-y-4">
                  {Object.entries(relations).map(([group, items]) =>
                    items.length > 0 ? (
                      <div key={group}>
                        <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
                          {group}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {items.map((rel) => (
                            <Link key={`${rel.type}-${rel.slug}`} href={`/${rel.type}/${rel.slug}`}>
                              <Badge
                                variant="circuit"
                                className="cursor-pointer hover:bg-circuit/10 transition-colors"
                              >
                                {rel.name}
                                <span className="ml-1.5 opacity-50 text-[10px]">
                                  {ENTITY_TYPES[rel.type as EntityType]?.label || rel.type}
                                </span>
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : null,
                  )}
                </div>
              ) : (
                <p className="text-text-muted text-sm">
                  No relationships mapped yet. Be the first to suggest one.
                </p>
              )}

              {/* Success / error messages */}
              {successMessage && (
                <div className="px-4 py-3 bg-circuit/5 border border-circuit/20 rounded text-sm text-circuit font-mono">
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="px-4 py-3 bg-accent-red/5 border border-accent-red/20 rounded text-sm text-accent-red font-mono">
                  {errorMessage}
                </div>
              )}

              {/* Suggest form toggle */}
              {!showForm ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowForm(true);
                    setSuccessMessage("");
                    setErrorMessage("");
                  }}
                >
                  + Suggest Relationship
                </Button>
              ) : (
                <Card className="bg-surface border-border space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted">
                    Suggest a Relationship
                  </h3>

                  {/* Relation type dropdown */}
                  <div>
                    <label className="block text-xs font-mono text-text-muted mb-1">
                      Relationship Type
                    </label>
                    <select
                      value={relationType}
                      onChange={(e) => setRelationType(e.target.value)}
                      className="w-full bg-base border border-border rounded px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-circuit/50"
                    >
                      {RELATION_TYPES.map((rt) => (
                        <option key={rt.value} value={rt.value}>
                          {entity.name} {rt.label.toLowerCase()} ...
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target entity search */}
                  <div className="relative">
                    <label className="block text-xs font-mono text-text-muted mb-1">
                      Target Entity
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      placeholder="Search entities..."
                      className="w-full bg-base border border-border rounded px-3 py-2 text-sm text-text font-mono placeholder:text-text-muted/50 focus:outline-none focus:border-circuit/50"
                    />
                    {selectedTarget && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="circuit">{selectedTarget.name}</Badge>
                        <span className="text-xs text-text-muted font-mono">
                          {ENTITY_TYPES[selectedTarget.type]?.label}
                        </span>
                      </div>
                    )}

                    {/* Search results dropdown */}
                    {searchResults.length > 0 && !selectedTarget && (
                      <div className="absolute z-10 mt-1 w-full bg-base border border-border rounded shadow-lg max-h-48 overflow-y-auto">
                        {searchResults.map((result) => (
                          <button
                            key={`${result.type}-${result.slug}`}
                            onClick={() => selectTarget(result)}
                            className="w-full text-left px-3 py-2 hover:bg-surface transition-colors flex items-center justify-between"
                          >
                            <span className="text-sm text-text">{result.name}</span>
                            <Badge variant="circuit" className="text-[10px] px-2 py-0.5">
                              {ENTITY_TYPES[result.type]?.label}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    )}
                    {searching && (
                      <p className="text-xs text-text-muted font-mono mt-1">Searching...</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSubmit}
                      disabled={!selectedTarget || submitting}
                    >
                      {submitting ? "Submitting..." : "Submit Suggestion"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowForm(false);
                        setSearchQuery("");
                        setSelectedTarget(null);
                        setSearchResults([]);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
