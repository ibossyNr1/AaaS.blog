import { Container, Section } from "@aaas/ui";
import { ChangelogClient } from "./changelog-client";
import { Suspense } from "react";
import type { Metadata } from "next";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Changelog Digest — AaaS Knowledge Index",
  description:
    "Weekly and monthly rollups of all entity changes with visualizations across the AaaS Knowledge Index.",
};

export default function ChangelogPage() {
  return (
    <>
      <Section className="pt-28 pb-12">
        <Container className="max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            Changelog Digest
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
            Weekly and monthly rollups of all entity changes with
            visualizations.
          </p>
        </Container>
      </Section>

      <Section className="pb-20">
        <Container className="max-w-5xl">
          <Suspense
            fallback={
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-surface rounded-lg h-32"
                  />
                ))}
              </div>
            }
          >
            <ChangelogClient />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}
