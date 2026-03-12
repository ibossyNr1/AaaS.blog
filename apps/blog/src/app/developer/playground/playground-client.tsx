"use client";

import { Section, Container } from "@aaas/ui";
import { ApiPlayground } from "@/components/api-playground";

export function PlaygroundClient() {
  return (
    <>
      <Section className="pt-28 pb-8">
        <Container className="max-w-6xl">
          <p className="text-xs font-mono uppercase tracking-wider text-circuit mb-3">
            Developer Tools
          </p>
          <h1 className="text-3xl font-bold text-text mb-4">API Playground</h1>
          <p className="text-text-muted leading-relaxed max-w-2xl">
            Explore and test every AaaS Knowledge Index API endpoint. Configure
            parameters, send requests, and inspect responses in real-time.
          </p>
        </Container>
      </Section>

      <Section className="pb-20">
        <Container className="max-w-6xl">
          <ApiPlayground />
        </Container>
      </Section>
    </>
  );
}
