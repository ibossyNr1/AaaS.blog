import { Suspense } from "react";
import { Container, Section } from "@aaas/ui";
import type { Metadata } from "next";
import { ComparisonsClient } from "./comparisons-client";

export const metadata: Metadata = {
  title: "Popular Comparisons — AaaS Knowledge Index",
  description: "Browse the most interesting entity comparisons across the AI ecosystem.",
};

export default function ComparisonsPage() {
  return (
    <Section className="pt-28 pb-20">
      <Container className="max-w-6xl">
        <p className="text-xs font-mono uppercase tracking-wider text-circuit mb-3">
          Comparisons
        </p>
        <h1 className="text-3xl font-bold text-text mb-2">
          Popular Comparisons
        </h1>
        <p className="text-text-muted mb-8">
          Auto-generated head-to-head matchups between closely ranked entities in the same category.
        </p>
        <Suspense
          fallback={
            <div className="text-text-muted text-sm py-12 text-center">
              Loading comparisons...
            </div>
          }
        >
          <ComparisonsClient />
        </Suspense>
      </Container>
    </Section>
  );
}
