"use client";

import { useEffect, useState } from "react";
import { Section, Container } from "@aaas/ui";
import type { Entity } from "@/lib/types";
import { getTopCategories, getViewedEntityKeys } from "@/lib/behavior";
import { EntityCard } from "@/components/entity-card";

export function RecommendedEntities() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    async function load() {
      const { types } = getTopCategories();
      const viewedKeys = getViewedEntityKeys();

      // Sort types by frequency to find top interests
      const sortedTypes = Object.entries(types)
        .sort((a, b) => b[1] - a[1])
        .map(([t]) => t);

      let candidates: Entity[] = [];

      if (sortedTypes.length > 0) {
        // Fetch entities from top 2 most-viewed types
        const typesToFetch = sortedTypes.slice(0, 2);
        const fetches = await Promise.allSettled(
          typesToFetch.map(async (type) => {
            const res = await fetch(`/api/entities?type=${type}&limit=12`);
            if (!res.ok) return [];
            const json = await res.json();
            return (json.data || []) as Entity[];
          })
        );

        candidates = fetches
          .filter((r): r is PromiseFulfilledResult<Entity[]> => r.status === "fulfilled")
          .flatMap((r) => r.value);

        // Exclude already-viewed entities
        candidates = candidates.filter(
          (e) => !viewedKeys.has(`${e.type}:${e.slug}`)
        );
      }

      // Fallback to trending if insufficient behavioral data
      if (candidates.length < 3) {
        setIsFallback(true);
        try {
          const res = await fetch("/api/entities?limit=8");
          if (res.ok) {
            const json = await res.json();
            candidates = ((json.data || []) as Entity[]).filter(
              (e) => !viewedKeys.has(`${e.type}:${e.slug}`)
            );
          }
        } catch {
          // Silently fail
        }
      }

      setEntities(candidates.slice(0, 6));
      setLoading(false);
    }

    load();
  }, []);

  if (loading || entities.length === 0) return null;

  return (
    <Section className="py-10">
      <Container>
        <h2 className="text-xl font-semibold text-text mb-1">
          {isFallback ? "Trending Entities" : "Recommended for You"}
        </h2>
        <p className="text-sm text-text-muted mb-6">
          {isFallback
            ? "Popular across the ecosystem right now"
            : "Based on your browsing history"}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entities.map((entity) => (
            <EntityCard key={`${entity.type}-${entity.slug}`} entity={entity} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
