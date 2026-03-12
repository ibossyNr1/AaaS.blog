import { Container, Section } from "@aaas/ui";
import { IntegrationsClient } from "./integrations-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integrations — AaaS Knowledge Index",
  description:
    "Connect your favorite tools to the AaaS Knowledge Index. Browse plugins for Slack, Discord, GitHub, Zapier, Google Sheets, Notion, and more.",
};

export default function IntegrationsPage() {
  return (
    <>
      <Section className="pt-28 pb-12">
        <Container className="max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            Integrations
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
            Connect the tools you already use. Sync entities, automate
            workflows, and get notifications wherever your team works.
          </p>
        </Container>
      </Section>

      <Section className="pb-20">
        <Container className="max-w-5xl">
          <IntegrationsClient />
        </Container>
      </Section>
    </>
  );
}
