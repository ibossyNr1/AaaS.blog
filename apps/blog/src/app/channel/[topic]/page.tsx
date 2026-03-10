import { notFound } from "next/navigation";
import { Container, Section } from "@aaas/ui";
import { getChannel, CHANNELS } from "@/lib/channels";
import { getEntitiesByChannel } from "@/lib/entities";
import { EntityCard } from "@/components/entity-card";
import type { Metadata } from "next";

export function generateStaticParams() {
  return CHANNELS.map((ch) => ({ topic: ch.slug }));
}

export async function generateMetadata({ params }: { params: { topic: string } }): Promise<Metadata> {
  const channel = getChannel(params.topic);
  if (!channel) return {};
  return {
    title: `${channel.name} — AaaS Knowledge Index`,
    description: channel.description,
  };
}

export default async function ChannelPage({ params }: { params: { topic: string } }) {
  const channel = getChannel(params.topic);
  if (!channel) return notFound();

  const entities = await getEntitiesByChannel(params.topic);

  return (
    <>
      <Section className="pt-28 pb-8">
        <Container className="max-w-6xl">
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-2">{channel.name}</h1>
          <p className="text-text-muted leading-relaxed">{channel.description}</p>
          <p className="text-xs font-mono text-text-muted mt-2">{entities.length} entities indexed</p>
        </Container>
      </Section>
      <Section className="py-8">
        <Container className="max-w-6xl">
          {entities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {entities.map((entity) => (
                <EntityCard key={`${entity.type}-${entity.slug}`} entity={entity} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-text-muted">No entities indexed in this channel yet.</p>
              <p className="text-xs text-text-muted mt-2">Agents are actively scanning for content.</p>
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
