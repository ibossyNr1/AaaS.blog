import { notFound } from "next/navigation";
import Link from "next/link";
import { Container, Section, Card, Badge } from "@aaas/ui";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Episode, AudioFormat } from "@/lib/media-types";
import type { Metadata } from "next";
import { PodcastSubscribe } from "@/components/podcast-subscribe";

/* -------------------------------------------------------------------------- */
/*  Data fetching                                                             */
/* -------------------------------------------------------------------------- */

async function getEpisode(id: string): Promise<Episode | null> {
  try {
    const ref = doc(db, "episodes", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Episode;
  } catch {
    return null;
  }
}

async function getRelatedEpisodes(
  format: AudioFormat,
  excludeId: string,
  max = 3,
): Promise<Episode[]> {
  try {
    const q = query(
      collection(db, "episodes"),
      where("format", "==", format),
      orderBy("publishedAt", "desc"),
      firestoreLimit(max + 1),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Episode)
      .filter((e) => e.id !== excludeId)
      .slice(0, max);
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const FORMAT_LABELS: Record<AudioFormat, string> = {
  narration: "Narration",
  digest: "Digest",
  podcast: "Podcast",
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDurationISO(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  let iso = "PT";
  if (h > 0) iso += `${h}H`;
  if (m > 0) iso += `${m}M`;
  iso += `${s}S`;
  return iso;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/*  Metadata                                                                  */
/* -------------------------------------------------------------------------- */

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const episode = await getEpisode(id);
  if (!episode) {
    return { title: "Episode Not Found" };
  }

  const ogImage = `https://aaas.blog/og?title=${encodeURIComponent(episode.title)}&type=podcast`;

  return {
    title: `${episode.title} — AaaS Audio`,
    description: episode.description,
    openGraph: {
      title: episode.title,
      description: episode.description,
      type: "music.song",
      url: `https://aaas.blog/listen/${episode.id}`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      audio: [
        {
          url: episode.audioUrl,
          type: "audio/mpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: episode.title,
      description: episode.description,
      images: [ogImage],
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  JSON-LD                                                                   */
/* -------------------------------------------------------------------------- */

function buildJsonLd(episode: Episode) {
  return {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: episode.title,
    description: episode.description,
    url: `https://aaas.blog/listen/${episode.id}`,
    datePublished: episode.publishedAt,
    duration: formatDurationISO(episode.duration),
    associatedMedia: {
      "@type": "MediaObject",
      contentUrl: episode.audioUrl,
      encodingFormat: "audio/mpeg",
    },
    partOfSeries: {
      "@type": "PodcastSeries",
      name: "AaaS Knowledge Index",
      url: "https://aaas.blog/listen",
    },
    ...(episode.sourceRef && episode.sourceType
      ? {
          about: {
            "@type": "Thing",
            name: episode.sourceRef,
            url: `https://aaas.blog/${episode.sourceType}/${episode.sourceRef}`,
          },
        }
      : {}),
  };
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default async function EpisodeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const episode = await getEpisode(id);
  if (!episode) return notFound();

  const related = await getRelatedEpisodes(episode.format, episode.id);
  const jsonLd = buildJsonLd(episode);

  return (
    <>
      {/* JSON-LD structured data for PodcastEpisode schema — server-generated, safe content */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ---- Header ---- */}
      <Section className="pt-28 pb-8">
        <Container className="max-w-4xl">
          <Link
            href="/listen"
            className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-text-muted hover:text-circuit transition-colors mb-6"
          >
            <span>&larr;</span>
            <span>Back to Audio Hub</span>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <Badge variant="circuit">{FORMAT_LABELS[episode.format]}</Badge>
            <span className="text-xs font-mono text-text-muted">
              {formatDuration(episode.duration)}
            </span>
            <span className="text-xs font-mono text-text-muted">
              {formatDate(episode.publishedAt)}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-text mb-3">
            {episode.title}
          </h1>

          <p className="text-text-muted leading-relaxed mb-2">
            {episode.description}
          </p>

          <p className="text-xs font-mono text-text-muted">
            {episode.playCount.toLocaleString()} plays
          </p>
        </Container>
      </Section>

      {/* ---- Audio Player ---- */}
      <Section className="py-6">
        <Container className="max-w-4xl">
          <Card>
            <p className="text-xs font-mono uppercase tracking-wider text-circuit mb-3">
              Now Playing
            </p>
            <audio
              src={episode.audioUrl}
              controls
              preload="metadata"
              className="w-full"
            />
          </Card>
        </Container>
      </Section>

      {/* ---- Subscribe Bar ---- */}
      <Section className="py-4">
        <Container className="max-w-4xl">
          <PodcastSubscribe />
        </Container>
      </Section>

      {/* ---- Source Link ---- */}
      {episode.sourceRef && episode.sourceType && (
        <Section className="py-4">
          <Container className="max-w-4xl">
            <Card>
              <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
                Source Entity
              </p>
              <Link
                href={`/${episode.sourceType}/${episode.sourceRef}`}
                className="text-sm font-semibold text-circuit hover:underline"
              >
                View {episode.sourceType} / {episode.sourceRef} &rarr;
              </Link>
            </Card>
          </Container>
        </Section>
      )}

      {/* ---- Transcript ---- */}
      <Section className="py-6">
        <Container className="max-w-4xl">
          <Card>
            <p className="text-xs font-mono uppercase tracking-wider text-circuit mb-3">
              Transcript
            </p>
            <div className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">
              {episode.description}
            </div>
          </Card>
        </Container>
      </Section>

      {/* ---- Related Episodes ---- */}
      {related.length > 0 && (
        <Section className="py-8">
          <Container className="max-w-4xl">
            <p className="text-xs font-mono uppercase tracking-wider text-circuit mb-4">
              More {FORMAT_LABELS[episode.format]}s
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((ep) => (
                <Link key={ep.id} href={`/listen/${ep.id}`}>
                  <Card className="h-full hover:border-circuit/40 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="circuit">
                        {FORMAT_LABELS[ep.format]}
                      </Badge>
                      <span className="text-xs font-mono text-text-muted">
                        {formatDuration(ep.duration)}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-text mb-1">
                      {ep.title}
                    </h3>
                    <p className="text-xs text-text-muted line-clamp-2">
                      {ep.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-text-muted">
                        {formatDate(ep.publishedAt)}
                      </span>
                      <span className="text-[10px] font-mono text-text-muted">
                        {ep.playCount.toLocaleString()} plays
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ---- Footer CTA ---- */}
      <Section className="py-12">
        <Container className="max-w-4xl text-center">
          <p className="text-text-muted mb-4">
            Explore the full AI ecosystem on Agents as a Service
          </p>
          <a
            href="https://agents-as-a-service.com/vault"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-circuit hover:underline font-mono"
          >
            Subscribe via Vault &rarr;
          </a>
        </Container>
      </Section>
    </>
  );
}
