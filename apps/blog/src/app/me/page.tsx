import { Container, Section } from "@aaas/ui";
import { getTrendingEntities } from "@/lib/entities";
import { DashboardClient } from "./dashboard-client";
import { RecentlyViewed } from "@/components/recently-viewed";
import { DiscoverySuggestions } from "@/components/discovery-suggestions";
import { SimilarUsersBadge } from "@/components/similar-users-badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — AaaS Knowledge Index",
  description:
    "Your personalized AI ecosystem dashboard. Choose a persona and get tailored recommendations for tools, models, agents, and more.",
};

export default async function DashboardPage() {
  const entities = await getTrendingEntities(50);

  return (
    <>
      <Section className="pt-28 pb-12">
        <Container className="max-w-5xl">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-text">
              Your Dashboard
            </h1>
            <SimilarUsersBadge />
          </div>
          <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
            Select a persona to get personalized recommendations from the AI
            ecosystem index.
          </p>
        </Container>
      </Section>

      <DashboardClient entities={entities} />

      <RecentlyViewed />

      <Section className="py-8">
        <Container className="max-w-5xl">
          <DiscoverySuggestions />
        </Container>
      </Section>
    </>
  );
}
