import { Container, Section } from "@aaas/ui";
import { DiscoverClient } from "./discover-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover — AaaS Knowledge Index",
  description:
    "Explore entity clusters, topic maps, and guided learning paths across the AI ecosystem.",
};

export default function DiscoverPage() {
  return (
    <>
      <Section className="pt-28 pb-8">
        <Container className="max-w-6xl">
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-2">
            Discover
          </h1>
          <p className="text-text-muted text-sm">
            Explore clusters, topics, and guided paths through the AI ecosystem.
          </p>
        </Container>
      </Section>
      <Section className="py-8">
        <Container className="max-w-6xl">
          <DiscoverClient />
        </Container>
      </Section>
    </>
  );
}
