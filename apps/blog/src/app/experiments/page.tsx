import { Container, Section } from "@aaas/ui";
import { ExperimentsClient } from "./experiments-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Experiments — AaaS Knowledge Index",
  description:
    "A/B testing dashboard for personalization experiments. Create, manage, and analyze experiment results with statistical confidence.",
};

export default function ExperimentsPage() {
  return (
    <>
      <Section className="pt-28 pb-12">
        <Container className="max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            Experiments
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
            Lightweight A/B testing for personalization. Create experiments,
            assign variants deterministically, and track conversions with
            statistical confidence.
          </p>
        </Container>
      </Section>

      <Section className="pb-20">
        <Container className="max-w-5xl">
          <ExperimentsClient />
        </Container>
      </Section>
    </>
  );
}
