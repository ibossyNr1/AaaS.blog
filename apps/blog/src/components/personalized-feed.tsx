"use client";

import { useState, useEffect } from "react";
import { Container, Section } from "@aaas/ui";
import { useAuth } from "@/lib/auth-context";
import { getPersonalizedEntities, PERSONA_CONFIG } from "@/lib/personalization";
import { EntityCard } from "@/components/entity-card";
import type { Entity } from "@/lib/types";

export function PersonalizedFeed() {
  const { user, loading } = useAuth();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [fetching, setFetching] = useState(false);

  const persona = user?.persona ?? null;

  useEffect(() => {
    if (loading) return;
    if (!persona) return;

    let cancelled = false;
    setFetching(true);

    async function load() {
      try {
        const config = PERSONA_CONFIG[persona!];
        // Fetch entities for the persona's priority channels
        const channelParams = config.priorityChannels
          .map((c) => `channel=${encodeURIComponent(c)}`)
          .join("&");
        const res = await fetch(`/api/entities?${channelParams}&limit=12`);
        if (!res.ok) throw new Error("fetch failed");
        const data: Entity[] = await res.json();

        if (!cancelled) {
          const ordered = getPersonalizedEntities(persona!, data);
          setEntities(ordered);
        }
      } catch {
        // Silent fail — feed will simply not appear
      } finally {
        if (!cancelled) setFetching(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [persona, loading]);

  // Don't render for anonymous users or while loading auth
  if (loading || !user || !persona) return null;

  // Skeleton while fetching
  if (fetching) {
    return (
      <Section className="py-8">
        <Container className="max-w-6xl">
          <h2 className="text-xl font-semibold text-text mb-6">Your Feed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-48 rounded-lg bg-surface animate-pulse"
              />
            ))}
          </div>
        </Container>
      </Section>
    );
  }

  if (entities.length === 0) return null;

  return (
    <Section className="py-8">
      <Container className="max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text">Your Feed</h2>
          <span className="text-xs font-mono text-text-muted">
            Personalized for {persona.replace("-", " ")}s
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entities.slice(0, 6).map((entity) => (
            <EntityCard key={`${entity.type}-${entity.slug}`} entity={entity} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
