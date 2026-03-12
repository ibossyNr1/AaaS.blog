/**
 * Audio Agent
 *
 * Generates audio narration episodes for entities and channel digests.
 * Extends the media pipeline with dedicated audio generation using the
 * pluggable TTS provider system.
 *
 * Outputs:
 *   - Entity narrations: `audio_episodes/{type}_{slug}` — 2-3 min per entity
 *   - Channel digests: `audio_episodes/channel_{channelSlug}_YYYY-MM-DD` — 5-10 min per channel
 *
 * Idempotent: skips entities that already have up-to-date audio (based on lastUpdated).
 *
 * Schedule: daily (runs after media agent)
 */

import { db, logAgentAction } from "./logger";
import { generateEntityNarration, generateChannelDigest } from "../lib/tts";

const AGENT_NAME = "audio-agent";

const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];

const CHANNEL_NAMES: Record<string, string> = {
  llms: "LLMs",
  "ai-tools": "AI Tools & APIs",
  "ai-agents": "AI Agents",
  "computer-vision": "Computer Vision",
  "prompt-engineering": "Prompt Engineering",
  "ai-infrastructure": "AI Infrastructure",
  "ai-safety": "AI Ethics & Safety",
  "ai-business": "AI Business & Strategy",
  "ai-code": "AI for Code",
  "speech-audio": "Speech & Audio AI",
};

// ─── Main Run ───────────────────────────────────────────────────────

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting audio generation pass...`);

  let totalEntities = 0;
  let skippedUpToDate = 0;
  let newNarrations = 0;
  let updatedNarrations = 0;
  let newDigests = 0;
  let errors = 0;

  try {
    // ─── Phase 1: Entity narrations ──────────────────────────────

    for (const collectionName of ENTITY_COLLECTIONS) {
      const snapshot = await db.collection(collectionName).get();

      for (const doc of snapshot.docs) {
        totalEntities++;
        const data = doc.data();
        const slug = doc.id;
        const type = (data.type as string) || collectionName.slice(0, -1);
        const entityLastUpdated = (data.lastUpdated as string) || "";

        const audioDocId = `${type}_${slug}`;
        const audioDocRef = db.collection("audio_episodes").doc(audioDocId);

        try {
          // Check if up-to-date audio already exists
          const existingDoc = await audioDocRef.get();
          if (existingDoc.exists) {
            const existingData = existingDoc.data();
            const audioGeneratedAt = (existingData?.generatedAt as string) || "";

            // Skip if audio was generated after the entity was last updated
            if (audioGeneratedAt && entityLastUpdated && audioGeneratedAt >= entityLastUpdated) {
              skippedUpToDate++;
              continue;
            }
          }

          const entityData = { ...data, slug };
          const result = await generateEntityNarration(entityData);

          await audioDocRef.set({
            type,
            slug,
            entityName: data.name || slug,
            duration: result.duration,
            audioUrl: result.audioUrl,
            generatedAt: new Date().toISOString(),
            script: result.script,
            provider: result.provider,
            generatedBy: AGENT_NAME,
          });

          if (existingDoc.exists) {
            updatedNarrations++;
            console.log(`  [updated] ${type}/${slug}: ${result.duration}s (${result.provider})`);
          } else {
            newNarrations++;
            console.log(`  [new] ${type}/${slug}: ${result.duration}s (${result.provider})`);
          }
        } catch (err) {
          errors++;
          const message = err instanceof Error ? err.message : String(err);
          console.error(`  [error] ${type}/${slug}: ${message}`);

          await logAgentAction(AGENT_NAME, "entity_narration_failed", {
            type,
            slug,
            error: message,
          }, false, message);
        }
      }
    }

    console.log(`[${AGENT_NAME}] Entity narrations: ${newNarrations} new, ${updatedNarrations} updated, ${skippedUpToDate} skipped (up-to-date)`);

    // ─── Phase 2: Channel digests ────────────────────────────────

    const today = new Date().toISOString().split("T")[0];
    const channelEntities = new Map<string, Array<Record<string, unknown>>>();

    // Gather recently updated entities per channel
    for (const collectionName of ENTITY_COLLECTIONS) {
      const snapshot = await db.collection(collectionName).get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const channel = (data.category as string) || "";
        if (!channel) continue;

        const lastUpdated = (data.lastUpdated as string) || "";
        // Include entities updated in the last 24 hours, or all if no timestamp
        if (lastUpdated) {
          const updatedDate = new Date(lastUpdated);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          if (updatedDate < oneDayAgo) continue;
        }

        const list = channelEntities.get(channel) || [];
        list.push({ ...data, slug: doc.id });
        channelEntities.set(channel, list);
      }
    }

    for (const [channel, entities] of channelEntities) {
      if (entities.length < 2) continue;

      const digestDocId = `channel_${channel}_${today}`;
      const digestDocRef = db.collection("audio_episodes").doc(digestDocId);

      try {
        // Skip if today's digest already exists for this channel
        const existingDigest = await digestDocRef.get();
        if (existingDigest.exists) {
          console.log(`  [skip] Channel digest ${channel} already exists for ${today}`);
          continue;
        }

        const result = await generateChannelDigest(channel, entities.slice(0, 8));

        await digestDocRef.set({
          type: "channel_digest",
          slug: channel,
          entityName: CHANNEL_NAMES[channel] || channel,
          duration: result.duration,
          audioUrl: result.audioUrl,
          generatedAt: new Date().toISOString(),
          script: result.script,
          provider: result.provider,
          generatedBy: AGENT_NAME,
          entityCount: entities.length,
          date: today,
        });

        newDigests++;
        console.log(`  [digest] ${channel}: ${result.duration}s covering ${entities.length} entities (${result.provider})`);
      } catch (err) {
        errors++;
        const message = err instanceof Error ? err.message : String(err);
        console.error(`  [error] Channel digest ${channel}: ${message}`);

        await logAgentAction(AGENT_NAME, "channel_digest_failed", {
          channel,
          entityCount: entities.length,
          error: message,
        }, false, message);
      }
    }

    // ─── Summary ─────────────────────────────────────────────────

    await logAgentAction(AGENT_NAME, "audio_generation_complete", {
      totalEntities,
      skippedUpToDate,
      newNarrations,
      updatedNarrations,
      newDigests,
      errors,
    }, true);

    console.log(
      `[${AGENT_NAME}] Audio generation complete. ` +
      `${totalEntities} entities scanned, ${newNarrations} new narrations, ` +
      `${updatedNarrations} updated, ${newDigests} digests, ${errors} errors.`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentAction(AGENT_NAME, "audio_generation_failed", {
      totalEntities,
      newNarrations,
      updatedNarrations,
      newDigests,
      errors,
    }, false, message);
    console.error(`[${AGENT_NAME}] Audio generation failed:`, message);
    throw err;
  }
}
