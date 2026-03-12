import { Container, Section } from "@aaas/ui";
import { AskClient } from "./ask-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ask the Index — AaaS Knowledge Index",
  description:
    "Ask natural language questions about AI tools, models, agents, skills, scripts, and benchmarks. Get structured answers with entity references.",
};

export default function AskPage() {
  return (
    <>
      <Section className="pt-28 pb-8">
        <Container className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-2">
            Ask the Index
          </h1>
          <p className="text-text-muted text-sm">
            Query the AI ecosystem in natural language. Compare tools, discover
            trending models, and get structured answers from the knowledge index.
          </p>
        </Container>
      </Section>
      <Section className="py-8 pb-20">
        <Container className="max-w-3xl">
          <AskClient />
        </Container>
      </Section>
    </>
  );
}
