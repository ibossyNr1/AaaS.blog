/**
 * Media pipeline — generates narration scripts, digests, and podcast outlines
 * from entity data. The output is text that gets fed to the TTS provider.
 */

import type { Entity, EntityType } from "./types";
import { ENTITY_TYPES } from "./types";
import { getChannelName } from "./channels";

// ─── Narration Script Generation ─────────────────────────────────────

/** Generate a narration script for a single entity (2-3 min read) */
export function generateNarrationScript(entity: Entity): string {
  const typeLabel = ENTITY_TYPES[entity.type].label;
  const channelName = getChannelName(entity.category);

  const lines: string[] = [
    `This is the AaaS Knowledge Index. Today we're looking at ${entity.name}, a ${typeLabel.toLowerCase()} in the ${channelName} channel.`,
    "",
    entity.description,
    "",
    `${entity.name} is provided by ${entity.provider}, currently at version ${entity.version}, with a ${entity.pricingModel} pricing model.`,
  ];

  if (entity.capabilities.length > 0) {
    lines.push(
      "",
      `Key capabilities include: ${entity.capabilities.slice(0, 5).join(", ")}.`,
    );
  }

  if (entity.integrations.length > 0) {
    lines.push(
      `It integrates with ${entity.integrations.slice(0, 4).join(", ")}.`,
    );
  }

  if (entity.useCases.length > 0) {
    lines.push(
      "",
      `Common use cases: ${entity.useCases.slice(0, 4).join(", ")}.`,
    );
  }

  // Type-specific details
  if (entity.type === "model") {
    const m = entity;
    if (m.contextWindow) lines.push(`Context window: ${m.contextWindow}.`);
    if (m.parameterCount) lines.push(`Parameters: ${m.parameterCount}.`);
    if (m.modalities.length > 0) lines.push(`Modalities: ${m.modalities.join(", ")}.`);
  }

  if (entity.type === "agent") {
    const a = entity;
    lines.push(`Autonomy level: ${a.autonomyLevel}. Trust score: ${a.trustScore} out of 100.`);
  }

  lines.push(
    "",
    `In the Knowledge Index, ${entity.name} has a composite score of ${entity.scores.composite}, with an adoption score of ${entity.scores.adoption} and a quality score of ${entity.scores.quality}.`,
    "",
    `That's ${entity.name} on the AaaS Knowledge Index. For the full spec sheet, visit aaas.blog/${entity.type}/${entity.slug}.`,
  );

  return lines.join("\n");
}

// ─── Digest Script Generation ────────────────────────────────────────

/** Generate a channel digest script from multiple entities (5-10 min read) */
export function generateDigestScript(
  channelSlug: string,
  entities: Entity[],
  date: string,
): string {
  const channelName = getChannelName(channelSlug);

  const lines: string[] = [
    `AaaS Knowledge Index — ${channelName} Daily Digest for ${date}.`,
    "",
    `Today we have ${entities.length} ${entities.length === 1 ? "update" : "updates"} in the ${channelName} channel.`,
    "",
  ];

  entities.forEach((entity, i) => {
    const typeLabel = ENTITY_TYPES[entity.type].label;
    lines.push(
      `Number ${i + 1}: ${entity.name}, a ${typeLabel.toLowerCase()} by ${entity.provider}.`,
      entity.description,
      `Composite score: ${entity.scores.composite}.`,
      "",
    );
  });

  lines.push(
    `That wraps up today's ${channelName} digest. Visit aaas.blog for the full index.`,
  );

  return lines.join("\n");
}

// ─── Podcast Outline Generation ──────────────────────────────────────

export interface PodcastSegment {
  speaker: "host-a" | "host-b";
  text: string;
}

/** Generate a weekly podcast script with two hosts (15-20 min read) */
export function generatePodcastScript(
  trendingEntities: Entity[],
  weekDate: string,
): PodcastSegment[] {
  const segments: PodcastSegment[] = [];

  // Intro
  segments.push({
    speaker: "host-a",
    text: `Welcome to the AaaS Knowledge Index Weekly, your podcast for the AI ecosystem. I'm your host, and joining me as always is my co-host. This is our roundup for the week of ${weekDate}.`,
  });

  segments.push({
    speaker: "host-b",
    text: `Great to be here. We've got ${trendingEntities.length} trending entities to cover this week. Let's dive in.`,
  });

  // Group by type for discussion
  const byType = new Map<EntityType, Entity[]>();
  for (const entity of trendingEntities) {
    const list = byType.get(entity.type) || [];
    list.push(entity);
    byType.set(entity.type, list);
  }

  for (const [type, entities] of byType) {
    const typeInfo = ENTITY_TYPES[type];
    const isHostA = segments.length % 2 === 0;

    segments.push({
      speaker: isHostA ? "host-a" : "host-b",
      text: `Let's talk about ${typeInfo.plural.toLowerCase()}. We have ${entities.length} trending this week.`,
    });

    for (const entity of entities.slice(0, 3)) {
      segments.push({
        speaker: isHostA ? "host-b" : "host-a",
        text: `${entity.name} by ${entity.provider} is sitting at a composite score of ${entity.scores.composite}. ${entity.description}`,
      });

      segments.push({
        speaker: isHostA ? "host-a" : "host-b",
        text: entity.scores.adoption > 80
          ? `That's strong adoption. It's clearly gaining traction in the ecosystem.`
          : entity.scores.quality > 80
            ? `Quality scores are impressive there. Worth keeping an eye on.`
            : `Interesting. Let's see how it develops.`,
      });
    }
  }

  // Outro
  segments.push({
    speaker: "host-a",
    text: `That's our weekly roundup. You can find the full specs for everything we discussed at aaas.blog.`,
  });

  segments.push({
    speaker: "host-b",
    text: `Subscribe via the Vault at agents-as-a-service.com to get these updates delivered. Until next week.`,
  });

  return segments;
}
