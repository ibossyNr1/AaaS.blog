/**
 * Media Agent
 *
 * Checks for entities that lack a narration episode in the `episodes`
 * collection and generates one. Uses a self-contained narration script
 * generator and stub TTS provider (same logic as the lib/ versions, but
 * inlined to avoid Next.js path alias issues when running with tsx).
 *
 * Schedule: daily (runs after new entities are ingested)
 * Idempotent: yes — only creates episodes for entities that don't have one
 */

import { db, logAgentAction } from "./logger";

const AGENT_NAME = "media-agent";

const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];

const ENTITY_TYPE_LABELS: Record<string, string> = {
  tool: "Tool",
  model: "Model",
  agent: "Agent",
  skill: "Skill",
  script: "Script",
  benchmark: "Benchmark",
};

// ─── Inlined Narration Script Generator ──────────────────────────────
// Mirrors ../lib/media.ts generateNarrationScript but self-contained

function generateNarrationScript(entity: Record<string, unknown>): string {
  const typeLabel = ENTITY_TYPE_LABELS[(entity.type as string) || ""] || "entity";
  const name = (entity.name as string) || "Unknown";
  const description = (entity.description as string) || "";
  const provider = (entity.provider as string) || "Unknown";
  const version = (entity.version as string) || "Unknown";
  const pricingModel = (entity.pricingModel as string) || "Unknown";
  const category = (entity.category as string) || "";
  const slug = (entity.slug as string) || "";
  const type = (entity.type as string) || "";
  const capabilities = (entity.capabilities as string[]) || [];
  const integrations = (entity.integrations as string[]) || [];
  const useCases = (entity.useCases as string[]) || [];
  const scores = (entity.scores as Record<string, number>) || {};

  const lines: string[] = [
    `This is the AaaS Knowledge Index. Today we're looking at ${name}, a ${typeLabel.toLowerCase()} in the ${category} channel.`,
    "",
    description,
    "",
    `${name} is provided by ${provider}, currently at version ${version}, with a ${pricingModel} pricing model.`,
  ];

  if (capabilities.length > 0) {
    lines.push("", `Key capabilities include: ${capabilities.slice(0, 5).join(", ")}.`);
  }

  if (integrations.length > 0) {
    lines.push(`It integrates with ${integrations.slice(0, 4).join(", ")}.`);
  }

  if (useCases.length > 0) {
    lines.push("", `Common use cases: ${useCases.slice(0, 4).join(", ")}.`);
  }

  lines.push(
    "",
    `In the Knowledge Index, ${name} has a composite score of ${scores.composite || 0}, with an adoption score of ${scores.adoption || 0} and a quality score of ${scores.quality || 0}.`,
    "",
    `That's ${name} on the AaaS Knowledge Index. For the full spec sheet, visit aaas.blog/${type}/${slug}.`,
  );

  return lines.join("\n");
}

// ─── Inlined Stub TTS Provider ───────────────────────────────────────
// Mirrors ../lib/tts.ts StubTTSProvider

function estimateDuration(text: string): number {
  const wordCount = text.split(/\s+/).length;
  return Math.round((wordCount / 150) * 60);
}

function getPlaceholderAudioUrl(): string {
  return "https://storage.googleapis.com/aaas-platform.appspot.com/audio/placeholder.mp3";
}

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting media generation pass...`);

  let totalEntities = 0;
  let existingEpisodes = 0;
  let newEpisodes = 0;

  try {
    // Load all existing narration episodes to check which entities already have one
    const episodesSnap = await db
      .collection("episodes")
      .where("format", "==", "narration")
      .get();

    const existingEntitySlugs = new Set<string>();
    for (const doc of episodesSnap.docs) {
      const data = doc.data();
      if (data.sourceRef) {
        existingEntitySlugs.add(data.sourceRef);
      }
    }
    existingEpisodes = existingEntitySlugs.size;

    console.log(`[${AGENT_NAME}] Found ${existingEpisodes} existing narration episodes.`);

    // Scan all entities for missing episodes
    for (const collection of ENTITY_COLLECTIONS) {
      const snapshot = await db.collection(collection).get();

      for (const doc of snapshot.docs) {
        totalEntities++;
        const data = doc.data();
        const slug = doc.id;

        // Skip if episode already exists
        if (existingEntitySlugs.has(slug)) {
          continue;
        }

        // Generate narration script
        const entityData = { ...data, slug };
        const script = generateNarrationScript(entityData);

        // Synthesize audio (stub — returns placeholder)
        const duration = estimateDuration(script);
        const audioUrl = getPlaceholderAudioUrl();

        // Create episode document
        const episodeId = `narration-${data.type || collection.slice(0, -1)}-${slug}`;
        const now = new Date().toISOString();

        await db.collection("episodes").doc(episodeId).set({
          title: `${data.name || slug} — Entity Overview`,
          description: `Auto-generated narration overview for ${data.name || slug}.`,
          format: "narration",
          duration,
          audioUrl,
          publishedAt: now,
          sourceRef: slug,
          sourceType: data.type || collection.slice(0, -1),
          channel: data.category || null,
          tags: [
            data.type || collection.slice(0, -1),
            ...(Array.isArray(data.tags) ? data.tags.slice(0, 3) : []),
          ],
          playCount: 0,
          generatedBy: AGENT_NAME,
          ttsProvider: "stub",
          scriptLength: script.length,
          scriptWordCount: script.split(/\s+/).length,
        });

        newEpisodes++;
        console.log(
          `  Created episode for ${collection}/${slug}: ${duration}s estimated duration`,
        );
      }
    }

    await logAgentAction(
      AGENT_NAME,
      "media_generation_complete",
      { totalEntities, existingEpisodes, newEpisodes },
      true,
    );

    console.log(
      `[${AGENT_NAME}] Media generation complete. ${totalEntities} entities scanned, ${newEpisodes} new episodes created.`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentAction(
      AGENT_NAME,
      "media_generation_failed",
      { totalEntities, newEpisodes },
      false,
      message,
    );
    console.error(`[${AGENT_NAME}] Media generation failed:`, message);
    throw err;
  }
}
