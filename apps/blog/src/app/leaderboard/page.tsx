import { Container, Section } from "@aaas/ui";
import { getTrendingEntities } from "@/lib/entities";
import { LeaderboardClient } from "./leaderboard-client";
import { CollaborativeRecommendations } from "@/components/collaborative-recommendations";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Leaderboard — AaaS Knowledge Index",
  description:
    "Rankings of top AI tools, models, agents, skills, scripts, and benchmarks by composite score.",
};

export default async function LeaderboardPage() {
  const entities = await getTrendingEntities(100);

  return (
    <>
      <Section className="pt-28 pb-8">
        <Container className="max-w-6xl">
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-2">
            Leaderboard
          </h1>
          <p className="text-text-muted">
            {entities.length} entities ranked by composite score across the AI
            ecosystem.
          </p>
        </Container>
      </Section>
      <Section className="py-8">
        <Container className="max-w-6xl">
          <LeaderboardClient entities={entities} />
        </Container>
      </Section>
      <CollaborativeRecommendations />
    </>
  );
}
