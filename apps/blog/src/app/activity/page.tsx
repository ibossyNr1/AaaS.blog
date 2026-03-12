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
          <div className="flex items-center gap-4">
            <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
              Real-time log of agent actions, trending alerts, and submissions.
            </p>
            <a
              href="/api/changes"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 shrink-0 text-xs font-mono text-text-muted hover:text-circuit border border-border hover:border-circuit rounded-full px-3 py-1.5 transition-colors"
              title="Global Changes RSS Feed"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <circle cx="6.18" cy="17.82" r="2.18" />
                <path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z" />
              </svg>
              RSS
            </a>
          </div>
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
