import { Container, Section } from "@aaas/ui";
import { getTrendingEntities } from "@/lib/entities";
import { EntityCard } from "@/components/entity-card";
import type { Metadata } from "next";

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
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-4">Explore the Index</h1>
          <p className="text-text-muted">{entities.length} entities across tools, models, agents, skills, scripts, and benchmarks.</p>
        </Container>
      </Section>
      <Section className="py-8">
        <Container className="max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entities.map((entity) => (
              <EntityCard key={`${entity.type}-${entity.slug}`} entity={entity} />
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
