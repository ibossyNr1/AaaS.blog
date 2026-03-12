import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/entities";
import { CHANNELS } from "@/lib/channels";
import type { EntityType } from "@/lib/types";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const BASE_URL = "https://aaas.blog";

const ENTITY_TYPES: EntityType[] = ["tool", "model", "agent", "skill", "script", "benchmark"];

const STATIC_PAGES = [
  { path: "/", changeFrequency: "daily" as const, priority: 1.0 },
  { path: "/explore", changeFrequency: "daily" as const, priority: 0.9 },
  { path: "/leaderboard", changeFrequency: "daily" as const, priority: 0.8 },
  { path: "/listen", changeFrequency: "weekly" as const, priority: 0.7 },
  { path: "/graph", changeFrequency: "weekly" as const, priority: 0.7 },
  { path: "/compare", changeFrequency: "weekly" as const, priority: 0.6 },
  { path: "/stats", changeFrequency: "daily" as const, priority: 0.6 },
  { path: "/activity", changeFrequency: "daily" as const, priority: 0.6 },
  { path: "/submit", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/api-docs", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/developer", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/subscribe", changeFrequency: "monthly" as const, priority: 0.4 },
  { path: "/me", changeFrequency: "weekly" as const, priority: 0.4 },
  { path: "/profile", changeFrequency: "weekly" as const, priority: 0.3 },
  { path: "/watchlist", changeFrequency: "weekly" as const, priority: 0.3 },
  { path: "/dashboard", changeFrequency: "weekly" as const, priority: 0.3 },
  { path: "/digest", changeFrequency: "weekly" as const, priority: 0.6 },
  { path: "/changelog", changeFrequency: "daily" as const, priority: 0.6 },
  { path: "/comparisons", changeFrequency: "weekly" as const, priority: 0.5 },
  { path: "/status", changeFrequency: "daily" as const, priority: 0.4 },
  { path: "/media", changeFrequency: "daily" as const, priority: 0.5 },
  { path: "/search", changeFrequency: "daily" as const, priority: 0.7 },
  { path: "/following", changeFrequency: "weekly" as const, priority: 0.4 },
  { path: "/settings", changeFrequency: "monthly" as const, priority: 0.2 },
  { path: "/events", changeFrequency: "daily" as const, priority: 0.5 },
  { path: "/webhooks", changeFrequency: "monthly" as const, priority: 0.3 },
  { path: "/vault", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/discover", changeFrequency: "daily" as const, priority: 0.7 },
  { path: "/ask", changeFrequency: "daily" as const, priority: 0.7 },
  { path: "/analytics", changeFrequency: "daily" as const, priority: 0.6 },
  { path: "/pipeline", changeFrequency: "daily" as const, priority: 0.5 },
  { path: "/experiments", changeFrequency: "weekly" as const, priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static pages
  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
    url: `${BASE_URL}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  // Channel pages
  const channelEntries: MetadataRoute.Sitemap = CHANNELS.map((channel) => ({
    url: `${BASE_URL}/channel/${channel.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // Entity pages — fetch all slugs per type
  const entityEntries: MetadataRoute.Sitemap = [];

  const slugsByType = await Promise.all(
    ENTITY_TYPES.map(async (type) => ({
      type,
      slugs: await getAllSlugs(type),
    })),
  );

  for (const { type, slugs } of slugsByType) {
    for (const slug of slugs) {
      entityEntries.push({
        url: `${BASE_URL}/${type}/${slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      });
    }
  }

  // Episode pages
  const episodeEntries: MetadataRoute.Sitemap = [];

  try {
    const epQuery = query(
      collection(db, "episodes"),
      orderBy("publishedAt", "desc"),
      firestoreLimit(200),
    );
    const epSnap = await getDocs(epQuery);
    for (const d of epSnap.docs) {
      episodeEntries.push({
        url: `${BASE_URL}/listen/${d.id}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      });
    }
  } catch {
    // Episodes collection may not exist yet
  }

  // Podcast audio episode pages (audio_episodes collection)
  const podcastEntries: MetadataRoute.Sitemap = [];

  try {
    const podQuery = query(
      collection(db, "audio_episodes"),
      orderBy("generatedAt", "desc"),
      firestoreLimit(200),
    );
    const podSnap = await getDocs(podQuery);
    for (const d of podSnap.docs) {
      podcastEntries.push({
        url: `${BASE_URL}/listen/${d.id}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      });
    }
  } catch {
    // audio_episodes collection may not exist yet
  }

  return [...staticEntries, ...channelEntries, ...entityEntries, ...episodeEntries, ...podcastEntries];
}
