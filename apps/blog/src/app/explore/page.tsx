import { Container, Section } from "@aaas/ui";
import { getTrendingEntities } from "@/lib/entities";
import { ExploreClient } from "./explore-client";
import { RecommendedEntities } from "@/components/recommended-entities";
import { CollaborativeRecommendations } from "@/components/collaborative-recommendations";
import { RecentlyViewed } from "@/components/recently-viewed";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Explore — AaaS Knowledge Index",
  description: "Search and filter the complete AI ecosystem database.",
};

export default async function ExplorePage() {
  const entities = await getTrendingEntities(50);

  return (
    <>
      <Section className="pt-28 pb-8">
        <Container className="max-w-6xl">
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-2">
            Explore the Index
          </h1>
          <p className="text-text-muted text-sm">
            Search, filter, and sort across the complete AI ecosystem database.
          </p>
        </Container>
      </Section>
      <RecommendedEntities />
      <Section className="py-8">
        <Container className="max-w-6xl">
          <ExploreClient entities={entities} />
        </Container>
      </Section>
      <CollaborativeRecommendations />
      <RecentlyViewed />
    </>
  );
}
