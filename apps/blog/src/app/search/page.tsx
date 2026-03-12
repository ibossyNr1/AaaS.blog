import { Suspense } from "react";
import { Section, Container } from "@aaas/ui";
import { SearchClient } from "./search-client";

export const metadata = {
  title: "Search — AaaS Knowledge Index",
  description: "Search across tools, models, agents, skills, scripts, and benchmarks in the AaaS Knowledge Index.",
};

export default function SearchPage() {
  return (
    <Section>
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">Search</h1>
          <p className="text-sm text-text-muted">
            Find entities across the entire Knowledge Index with fuzzy matching.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border-2 border-circuit/30 border-t-circuit rounded-full animate-spin" />
            </div>
          }
        >
          <SearchClient />
        </Suspense>
      </Container>
    </Section>
  );
}
