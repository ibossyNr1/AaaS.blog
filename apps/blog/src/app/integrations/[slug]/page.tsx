import { Container, Section } from "@aaas/ui";
import { IntegrationDetailClient } from "./integration-detail-client";
import type { Metadata } from "next";

interface Props {
  params: { slug: string };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Integration — AaaS Knowledge Index`,
    description: `View integration details, configuration, capabilities, and event log.`,
  };
}

export default function IntegrationDetailPage({ params }: Props) {
  return (
    <>
      <Section className="pt-28 pb-0">
        <Container className="max-w-5xl">
          <IntegrationDetailClient slug={params.slug} />
        </Container>
      </Section>

      <Section className="pb-20" />
    </>
  );
}
