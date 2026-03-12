import { Container, Section } from "@aaas/ui";
import { AnalyticsClient } from "./analytics-client";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Analytics Dashboard — AaaS Knowledge Index",
  description:
    "Comprehensive analytics dashboard with entity metrics, search trends, agent performance, and growth visualization for the AaaS Knowledge Index.",
};

function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-surface rounded-lg h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-pulse bg-surface rounded-lg h-72" />
        <div className="animate-pulse bg-surface rounded-lg h-72" />
      </div>
      <div className="animate-pulse bg-surface rounded-lg h-64" />
      <div className="animate-pulse bg-surface rounded-lg h-56" />
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <>
      <Section className="pt-28 pb-12">
        <Container className="max-w-6xl">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            Analytics Dashboard
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
            Entity metrics, search trends, agent performance, and growth
            visualization across the Knowledge Index.
          </p>
        </Container>
      </Section>

      <Section className="pb-20">
        <Container className="max-w-6xl">
          <Suspense fallback={<AnalyticsLoadingSkeleton />}>
            <AnalyticsClient />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}
