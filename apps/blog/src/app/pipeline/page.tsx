import { Container, Section } from "@aaas/ui";
import { PipelineClient } from "./pipeline-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pipeline Monitor — AaaS Knowledge Index",
  description:
    "Data pipeline monitoring dashboard showing agent execution metrics, data freshness, and dependency graph for the AaaS self-healing agent system.",
};

export default function PipelinePage() {
  return (
    <>
      <Section className="pt-28 pb-12">
        <Container className="max-w-6xl">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            Pipeline Monitor
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
            Agent execution metrics, data freshness, and dependency graph — all
            in real time.
          </p>
        </Container>
      </Section>

      <Section className="pb-20">
        <Container className="max-w-6xl">
          <PipelineClient />
        </Container>
      </Section>
    </>
  );
}
