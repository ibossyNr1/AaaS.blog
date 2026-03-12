import { Container, Section } from "@aaas/ui";
import { DigestClient } from "./digest-client";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weekly Digest — AaaS Knowledge Index",
  description:
    "Weekly summaries of new entities, trending movers, submissions, and agent health across the AaaS Knowledge Index.",
};

export default function DigestPage() {
  return (
    <>
      <Section className="pt-28 pb-12">
        <Container className="max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            Weekly Digest
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
            Auto-generated weekly summaries of index activity — new entities,
            score movers, submissions, and system health.
          </p>
        </Container>
      </Section>

      <Section className="pb-20">
        <Container className="max-w-5xl">
          <Suspense
            fallback={
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-surface rounded-lg h-48"
                  />
                ))}
              </div>
            }
          >
            <DigestClient />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}
