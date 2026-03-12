import { Container, Section, Card } from "@aaas/ui";
import { getTrendingEntities, getRecentEntities } from "@/lib/entities";
import { CHANNELS } from "@/lib/channels";
import { EntityCard } from "@/components/entity-card";
import { PersonaBanner } from "@/components/persona-banner";
import { PersonalizedFeed } from "@/components/personalized-feed";
import Link from "next/link";

export const revalidate = 120;

export default async function IndexHome() {
  const trending = await getTrendingEntities(6);
  const recent = await getRecentEntities(9);

  return (
    <>
      {/* Persona Banner — visible for logged-in users */}
      <PersonaBanner />

      {/* Hero */}
      <Section className="pt-28 pb-12">
        <Container className="max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4 text-balance">
            The AI Ecosystem Index
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-3xl mb-6">
            Schema-first database of every tool, model, agent, skill, and benchmark in AI.
            Machine-readable. Agent-maintained. Always current.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/explore">
              <span className="text-sm text-circuit hover:underline font-mono">Explore the Index →</span>
            </Link>
            <a href="https://agents-as-a-service.com/vault" target="_blank" rel="noopener noreferrer" className="text-sm text-text-muted hover:text-text font-mono">
              Subscribe via Vault
            </a>
          </div>
        </Container>
      </Section>

      {/* Trending */}
      {trending.length > 0 && (
        <Section className="py-8">
          <Container className="max-w-6xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text">Trending</h2>
              <Link href="/leaderboard" className="text-xs font-mono text-circuit hover:underline">Full Leaderboard →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trending.map((entity) => (
                <EntityCard key={`${entity.type}-${entity.slug}`} entity={entity} />
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Personalized Feed — visible for logged-in users with a persona */}
      <PersonalizedFeed />

      {/* Channels */}
      <Section variant="surface" className="py-12">
        <Container className="max-w-6xl">
          <h2 className="text-xl font-semibold text-text mb-6">Channels</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {CHANNELS.map((ch) => (
              <Link key={ch.slug} href={`/channel/${ch.slug}`}>
                <Card className="text-center py-6 cursor-pointer">
                  <h3 className="text-sm font-semibold text-text">{ch.name}</h3>
                  <p className="text-xs text-text-muted mt-1 line-clamp-2 px-2">{ch.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* Latest */}
      {recent.length > 0 && (
        <Section className="py-12">
          <Container className="max-w-6xl">
            <h2 className="text-xl font-semibold text-text mb-6">Latest Additions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recent.map((entity) => (
                <EntityCard key={`${entity.type}-${entity.slug}`} entity={entity} />
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* CTA */}
      <Section variant="surface" className="py-12">
        <Container className="max-w-3xl text-center">
          <p className="text-xs font-mono text-text-muted uppercase tracking-wider mb-2">SYS_LOG: Knowledge Index active</p>
          <p className="text-text-muted">This index is maintained autonomously by AaaS agents. Want to contribute?</p>
          <div className="flex items-center justify-center gap-6 mt-3">
            <Link href="/submit" className="text-sm text-circuit hover:underline font-mono">Submit an entity →</Link>
            <Link href="/compare" className="text-sm text-text-muted hover:text-text font-mono">Compare entities →</Link>
            <Link href="/subscribe" className="text-sm text-text-muted hover:text-text font-mono">Subscribe →</Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
