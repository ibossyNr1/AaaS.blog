import { Container, Section } from "@aaas/ui";
import { ActivityClient } from "./activity-client";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity Feed — AaaS Knowledge Index",
  description:
    "Real-time log of agent actions, trending alerts, and submissions across the AaaS Knowledge Index.",
};

export default function ActivityPage() {
  return (
    <>
      <Section className="pt-28 pb-12">
        <Container className="max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            Activity Feed
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
            Real-time log of agent actions, trending alerts, and submissions.
          </p>
        </Container>
      </Section>

      <Section className="pb-20">
        <Container className="max-w-5xl">
          <Suspense
            fallback={
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-surface rounded h-16"
                  />
                ))}
              </div>
            }
          >
            <ActivityClient />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}
