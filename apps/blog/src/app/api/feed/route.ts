import { NextResponse } from "next/server";
import { getRecentEntities } from "@/lib/entities";
import type { Entity } from "@/lib/types";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function entityToItem(entity: Entity): string {
  const link = `https://aaas.blog/${entity.type}/${entity.slug}`;
  const pubDate = new Date(entity.addedDate).toUTCString();

  return `    <item>
      <title>${escapeXml(entity.name)}</title>
      <description>${escapeXml(entity.description)}</description>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(entity.type)}</category>
      <category>${escapeXml(entity.category)}</category>
    </item>`;
}

export async function GET() {
  const entities = await getRecentEntities(20);
  const lastBuildDate = entities.length > 0
    ? new Date(entities[0].addedDate).toUTCString()
    : new Date().toUTCString();

  const items = entities.map(entityToItem).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AaaS Knowledge Index</title>
    <link>https://aaas.blog</link>
    <description>The autonomous AI ecosystem database. Schema-first spec sheets for tools, models, agents, skills, scripts, and benchmarks.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="https://aaas.blog/api/feed" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
