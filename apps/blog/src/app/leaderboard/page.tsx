import { Container, Section, KineticBar } from "@aaas/ui";
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
      <Section className="pt-28 pb-8 hero-glow">
        <Container className="max-w-6xl">
          <div className="section-topic"><span>Rankings</span></div>
          <h1 className="monolith-title text-4xl md:text-5xl lg:text-6xl mb-4">
            Leaderboard
          </h1>
          <p className="text-text-muted max-w-2xl">
            {entities.length} entities ranked by composite score across the AI ecosystem.
          </p>
          <span className="status-badge mt-4 inline-flex">Live Rankings — Auto-Updated</span>
        </Container>
      </Section>
      <KineticBar />
      <Section className="py-8">
        <Container className="max-w-6xl">
          <LeaderboardClient entities={entities} />
        </Container>
      </Section>
      <CollaborativeRecommendations />
    </>
  );
}
