import { Container, Section, KineticBar } from "@aaas/ui";
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
      <Section className="pt-28 pb-8 hero-glow">
        <Container className="max-w-6xl">
          <div className="section-topic"><span>Discovery</span></div>
          <h1 className="monolith-title text-4xl md:text-5xl lg:text-6xl mb-4">
            Explore
          </h1>
          <p className="text-text-muted text-sm max-w-xl">
            Search, filter, and sort across the complete AI ecosystem database.
          </p>
          <span className="status-badge mt-4 inline-flex">Full Index — Real-Time Search</span>
        </Container>
      </Section>
      <KineticBar />
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
