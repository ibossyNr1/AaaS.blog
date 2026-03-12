"use client";

import { useEffect, useState } from "react";
import { Section, Container } from "@aaas/ui";
import type { Entity } from "@/lib/types";
import { getRecentlyViewed } from "@/lib/behavior";
import { EntityCard } from "@/components/entity-card";

export function RecentlyViewed() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const recent = getRecentlyViewed(8);
      if (recent.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch entity data in parallel
      const results = await Promise.allSettled(
        recent.map(async ({ type, slug }) => {
          const res = await fetch(`/api/entity/${type}/${slug}`);
          if (!res.ok) return null;
          const json = await res.json();
          return json.data as Entity;
        })
      );

      const loaded = results
        .filter((r): r is PromiseFulfilledResult<Entity | null> => r.status === "fulfilled")
        .map((r) => r.value)
        .filter((e): e is Entity => e !== null);

      setEntities(loaded);
      setLoading(false);
    }

    load();
  }, []);

  if (loading || entities.length === 0) return null;

  return (
    <Section className="py-10">
      <Container>
        <h2 className="text-xl font-semibold text-text mb-6">Recently Viewed</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin scrollbar-thumb-border">
          {entities.map((entity) => (
            <div key={`${entity.type}-${entity.slug}`} className="min-w-[280px] max-w-[320px] flex-shrink-0">
              <EntityCard entity={entity} />
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
