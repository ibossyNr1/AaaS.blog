import { Container, Section } from "@aaas/ui";
import { getTrendingEntities } from "@/lib/entities";
import { DashboardClient } from "./dashboard-client";
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
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            Your Dashboard
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
            Select a persona to get personalized recommendations from the AI
            ecosystem index.
          </p>
        </Container>
      </Section>

      <DashboardClient entities={entities} />
    </>
  );
}
