import { Container, Section, Card, KineticBar, DataTape } from "@aaas/ui";
import { getTrendingEntities, getRecentEntities } from "@/lib/entities";
import { CHANNELS } from "@/lib/channels";
import { EntityCard } from "@/components/entity-card";
import { PersonaBanner } from "@/components/persona-banner";
import { PersonalizedFeed } from "@/components/personalized-feed";
import Link from "next/link";

export const revalidate = 120;

const TAPE_ITEMS = [
  "ENTITIES_INDEXED: 2,847",
  "MODELS_TRACKED: 312",
  "AGENTS_ACTIVE: 48",
  "SKILLS_MAPPED: 1,204",
  "BENCHMARKS_RUN: 156",
  "UPDATES_24H: 73",
];

export default async function IndexHome() {
  const trending = await getTrendingEntities(6);
  const recent = await getRecentEntities(9);

  return (
    <>
      {/* Persona Banner — visible for logged-in users */}
      <PersonaBanner />

      {/* Hero */}
      <Section className="relative pt-32 pb-24 overflow-hidden">
        {/* Dual accent glows */}
        <div className="absolute top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-circuit/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-accent-red/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <Container className="relative z-10 max-w-5xl hero-glow">
          <div className="section-topic">
            <span>Knowledge Index</span>
          </div>

          <h1 className="monolith-title text-5xl md:text-6xl lg:text-7xl mb-6">
            THE AI ECOSYSTEM<br />INDEX
          </h1>

          <span className="status-badge">System Online — Agent-Maintained</span>

          <p className="max-w-2xl text-lg leading-relaxed mt-6 mb-6">
            <span className="font-bold text-text">
              Schema-first database of every tool, model, agent, skill, and benchmark in AI.
            </span>
            <br />
            <span className="text-text/50 font-light">
              Machine-readable. Agent-maintained. Always current.
            </span>
          </p>

          <div className="flex items-center gap-6">
            <Link href="/explore">
              <span className="text-sm text-circuit hover:underline font-mono tracking-wide">
                Explore the Index →
              </span>
            </Link>
            <a
              href="https://agents-as-a-service.com/vault"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-muted hover:text-text font-mono tracking-wide"
            >
              Subscribe via Vault
            </a>
          </div>
        </Container>
      </Section>

      {/* DataTape */}
      <div className="data-tape-wrapper">
        <DataTape items={TAPE_ITEMS} speed="normal" />
      </div>

      {/* Trending */}
      {trending.length > 0 && (
        <>
          <KineticBar />
          <Section parallax className="py-16">
            <Container className="max-w-6xl">
              <div className="section-topic">
                <span>Trending</span>
              </div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="monolith-title text-2xl md:text-3xl">
                  TRENDING NOW
                </h2>
                <Link
                  href="/leaderboard"
                  className="text-xs font-mono text-circuit hover:underline tracking-wide"
                >
                  Full Leaderboard →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trending.map((entity) => (
                  <EntityCard key={`${entity.type}-${entity.slug}`} entity={entity} />
                ))}
              </div>
            </Container>
          </Section>
        </>
      )}

      {/* Personalized Feed — visible for logged-in users with a persona */}
      <PersonalizedFeed />

      {/* Channels */}
      <KineticBar />
      <Section variant="surface" parallax className="py-16">
        <Container className="max-w-6xl">
          <div className="section-topic">
            <span>Channels</span>
          </div>
          <h2 className="monolith-title text-2xl md:text-3xl mb-8">
            BROWSE BY CHANNEL
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {CHANNELS.map((ch) => (
              <Link key={ch.slug} href={`/channel/${ch.slug}`}>
                <Card variant="glass" spotlight className="text-center py-6 cursor-pointer">
                  <h3 className="text-sm font-semibold text-text">{ch.name}</h3>
                  <p className="text-xs text-text-muted mt-1 line-clamp-2 px-2">
                    {ch.description}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* Latest */}
      {recent.length > 0 && (
        <>
          <KineticBar />
          <Section className="py-16">
            <Container className="max-w-6xl">
              <div className="section-topic">
                <span>Latest</span>
              </div>
              <h2 className="monolith-title text-2xl md:text-3xl mb-8">
                LATEST ADDITIONS
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recent.map((entity) => (
                  <EntityCard key={`${entity.type}-${entity.slug}`} entity={entity} />
                ))}
              </div>
            </Container>
          </Section>
        </>
      )}

      {/* CTA */}
      <KineticBar variant="red" />
      <Section className="relative py-24 overflow-hidden">
        {/* Accent aura */}
        <div className="absolute top-1/2 left-1/4 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-circuit/5 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none animate-aura-drift" />
        <div className="absolute top-1/3 right-1/4 w-[150px] md:w-[300px] h-[150px] md:h-[300px] bg-accent-red/5 rounded-full blur-[100px] pointer-events-none animate-aura-drift" style={{ animationDelay: "3s" }} />

        <Container className="relative z-10 max-w-3xl text-center">
          <p className="font-mono text-xs text-accent-red uppercase tracking-widest mb-6">
            SYS_LOG: Knowledge Index active
          </p>

          <h2 className="monolith-title text-4xl md:text-6xl font-black uppercase tracking-tight mb-2">
            <span className="outline-text">SUBMIT.</span>{" "}
            <span className="outline-text">COMPARE.</span>{" "}
            <span className="outline-text">SUBSCRIBE.</span>
          </h2>

          <p className="text-text-muted mt-6 mb-8 max-w-lg mx-auto">
            This index is maintained autonomously by AaaS agents. Want to contribute?
          </p>

          <div className="flex items-center justify-center gap-8">
            <Link
              href="/submit"
              className="text-sm text-circuit hover:underline font-mono tracking-wide"
            >
              Submit an entity →
            </Link>
            <Link
              href="/compare"
              className="text-sm text-text-muted hover:text-text font-mono tracking-wide"
            >
              Compare entities →
            </Link>
            <Link
              href="/subscribe"
              className="text-sm text-text-muted hover:text-text font-mono tracking-wide"
            >
              Subscribe →
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
