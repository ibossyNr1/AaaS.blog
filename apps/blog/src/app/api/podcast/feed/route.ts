import { NextResponse } from "next/server";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Episode } from "@/lib/media-types";

export const dynamic = "force-dynamic";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function episodeToItem(episode: Episode): string {
  const link = `https://aaas.blog/listen/${episode.id}`;
  const pubDate = new Date(episode.publishedAt).toUTCString();

  return `    <item>
      <title>${escapeXml(episode.title)}</title>
      <description><![CDATA[${episode.description}]]></description>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${escapeXml(episode.audioUrl)}" type="audio/mpeg" length="${episode.duration * 16000}" />
      <itunes:duration>${formatDuration(episode.duration)}</itunes:duration>
      <itunes:summary>${escapeXml(episode.description)}</itunes:summary>
      <itunes:explicit>false</itunes:explicit>
      <itunes:image href="https://aaas.blog/og?title=${encodeURIComponent(episode.title)}" />
    </item>`;
}

export async function GET() {
  let episodes: Episode[] = [];

  try {
    const q = query(
      collection(db, "audio_episodes"),
      orderBy("generatedAt", "desc"),
      firestoreLimit(100),
    );
    const snap = await getDocs(q);
    episodes = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Episode);
  } catch {
    // Return empty feed on error
  }

  const lastBuildDate =
    episodes.length > 0
      ? new Date(episodes[0].publishedAt).toUTCString()
      : new Date().toUTCString();

  const items = episodes.map(episodeToItem).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:itunes="http://www.itunes.apple.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>AaaS Knowledge Index</title>
    <link>https://aaas.blog/listen</link>
    <description>AI ecosystem intelligence delivered as audio — entity narrations, channel digests, and weekly podcast roundups from the AaaS Knowledge Index.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="https://aaas.blog/api/podcast/feed" rel="self" type="application/rss+xml"/>
    <itunes:author>AaaS Knowledge Index</itunes:author>
    <itunes:owner>
      <itunes:name>AaaS Knowledge Index</itunes:name>
      <itunes:email>podcast@aaas.blog</itunes:email>
    </itunes:owner>
    <itunes:summary>AI ecosystem intelligence delivered as audio — entity narrations, channel digests, and weekly podcast roundups from the AaaS Knowledge Index.</itunes:summary>
    <itunes:category text="Technology">
      <itunes:category text="Tech News"/>
    </itunes:category>
    <itunes:image href="https://aaas.blog/og?title=AaaS+Podcast"/>
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <image>
      <url>https://aaas.blog/og?title=AaaS+Podcast</url>
      <title>AaaS Knowledge Index</title>
      <link>https://aaas.blog/listen</link>
    </image>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
