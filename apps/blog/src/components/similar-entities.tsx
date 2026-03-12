"use client";

import { useEffect, useState } from "react";
import { Card } from "@aaas/ui";

interface SimilarEntity {
  type: string;
  slug: string;
  name: string;
  score: number;
}

interface SimilarEntitiesProps {
  type: string;
  slug: string;
}

export function SimilarEntities({ type, slug }: SimilarEntitiesProps) {
  const [entities, setEntities] = useState<SimilarEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchSimilar() {
      try {
        const res = await fetch(`/api/entity/${type}/${slug}/similar`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setEntities(data);
        }
      } catch {
        // Silently fail — similar entities are non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSimilar();
    return () => {
      cancelled = true;
    };
  }, [type, slug]);

  if (loading) {
    return (
      <section className="py-8">
        <div className="max-w-5xl mx-auto px-4">
          <h3 className="text-lg font-semibold text-text mb-4">Similar Entities</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-lg bg-surface animate-pulse border border-border"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (entities.length === 0) return null;

  return (
    <section className="py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h3 className="text-lg font-semibold text-text mb-4">Similar Entities</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entities.map((entity) => (
            <a
              key={`${entity.type}-${entity.slug}`}
              href={`/${entity.type}/${entity.slug}`}
              className="block no-underline"
            >
              <Card className="p-4 hover:border-circuit transition-colors h-full">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-text leading-tight">
                    {entity.name}
                  </h4>
                  <span className="text-xs font-mono text-text-muted bg-surface px-1.5 py-0.5 rounded border border-border ml-2 shrink-0">
                    {entity.type}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                    <span>Similarity</span>
                    <span className="font-mono">{entity.score}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full bg-circuit rounded-full transition-all duration-500"
                      style={{ width: `${entity.score}%` }}
                    />
                  </div>
                </div>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
