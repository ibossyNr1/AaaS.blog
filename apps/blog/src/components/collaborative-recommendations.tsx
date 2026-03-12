"use client";

import { useEffect, useState } from "react";
import { Card, Badge, Section, Container } from "@aaas/ui";
import { EntityLink } from "./entity-link";

interface Recommendation {
  slug: string;
  type: string;
  name: string;
  reason: string;
  confidence: number;
}

interface RecommendationsResponse {
  recommendations: Recommendation[];
  source: string;
}

export function CollaborativeRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function fetchRecommendations() {
      try {
        const res = await fetch("/api/recommendations", {
          headers: {
            // Client-side: userId comes from localStorage if available
            "x-user-id": getLocalUserId() || "",
          },
        });
        if (!res.ok) return;
        const data: RecommendationsResponse = await res.json();
        if (!cancelled && data.recommendations.length > 0) {
          setRecommendations(data.recommendations);
          setSource(data.source);
        }
      } catch {
        // Non-critical — silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRecommendations();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Section className="py-10">
        <Container>
          <h2 className="text-xl font-semibold text-text mb-6">
            Visitors like you also explored...
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="min-w-[280px] max-w-[320px] flex-shrink-0 h-36 rounded-lg bg-surface animate-pulse border border-border"
              />
            ))}
          </div>
        </Container>
      </Section>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Section className="py-10">
        <Container>
          <div className="text-center py-8 text-text-muted">
            <p className="text-sm">
              Explore more entities to get personalized recommendations
            </p>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section className="py-10">
      <Container>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-semibold text-text">
            Visitors like you also explored...
          </h2>
          {source === "collaborative" && (
            <Badge variant="circuit" className="text-xs">
              Personalized
            </Badge>
          )}
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin scrollbar-thumb-border">
          {recommendations.map((rec) => (
            <EntityLink
              key={`${rec.type}-${rec.slug}`}
              type={rec.type}
              slug={rec.slug}
              className="block no-underline min-w-[280px] max-w-[320px] flex-shrink-0"
            >
              <Card variant="glass" className="p-4 h-full hover:border-circuit transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-text leading-tight line-clamp-2">
                    {rec.name}
                  </h3>
                  <Badge variant="circuit" className="ml-2 shrink-0 text-xs">
                    {rec.type}
                  </Badge>
                </div>

                <p className="text-xs text-text-muted mb-3">{rec.reason}</p>

                <div className="mt-auto">
                  <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                    <span>Confidence</span>
                    <span className="font-mono">{rec.confidence}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full bg-circuit rounded-full transition-all duration-500"
                      style={{ width: `${rec.confidence}%` }}
                    />
                  </div>
                </div>
              </Card>
            </EntityLink>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/** Retrieve local user ID from localStorage (anonymous fingerprint or auth UID). */
function getLocalUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    // Check for authenticated user ID first
    const authUid = localStorage.getItem("aaas-uid");
    if (authUid) return authUid;

    // Fall back to anonymous behavior fingerprint
    const behavior = localStorage.getItem("aaas-behavior");
    if (behavior) {
      const parsed = JSON.parse(behavior);
      return parsed.uid || null;
    }
    return null;
  } catch {
    return null;
  }
}
