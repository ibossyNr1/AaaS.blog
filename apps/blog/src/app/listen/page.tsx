import { Container, Section, KineticBar } from "@aaas/ui";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Episode } from "@/lib/media-types";
import { ListenClient } from "./listen-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Listen — AaaS Knowledge Index",
  description:
    "Audio narrations, daily digests, and interactive podcasts from the AI ecosystem.",
};

async function getEpisodes(max = 50): Promise<Episode[]> {
  try {
    const q = query(
      collection(db, "episodes"),
      orderBy("publishedAt", "desc"),
      firestoreLimit(max),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Episode);
  } catch {
    return [];
  }
}

export default async function ListenPage() {
  const episodes = await getEpisodes();

  return (
    <>
      <Section className="pt-28 pb-8 hero-glow">
        <Container className="max-w-6xl">
          <div className="section-topic"><span>Media</span></div>
          <h1 className="monolith-title text-4xl md:text-5xl lg:text-6xl mb-4">
            Audio Hub
          </h1>
          <p className="text-text-muted max-w-2xl">
            {episodes.length > 0
              ? `${episodes.length} episodes — narrations, digests, and podcasts from the AI ecosystem.`
              : "Audio narrations, daily digests, and interactive podcasts from the AI ecosystem."}
          </p>
        </Container>
      </Section>
      <KineticBar />
      <Section className="py-8">
        <Container className="max-w-6xl">
          <ListenClient episodes={episodes} />
        </Container>
      </Section>
    </>
  );
}
