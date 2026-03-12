/**
 * Video Agent
 *
 * Generates video metadata (structured scene descriptions) for new or
 * recently updated entities. Uses the video template system to produce
 * scene data and queues jobs in Firestore `video_queue` for an external
 * renderer to pick up.
 *
 * Also generates daily roundup entries for channels with new content.
 *
 * Schedule: daily (after audio/media agent)
 * Idempotent: yes — only creates queue entries for entities without existing pending/rendering jobs
 */

import { db, logAgentAction } from "./logger";
import {
  entitySpotlightTemplate,
  dailyRoundupTemplate,
  type EntitySpotlightData,
  type DailyRoundupData,
} from "../lib/video-templates";

const AGENT_NAME = "video-agent";

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

function gradeFromComposite(composite: number): string {
  if (composite >= 90) return "S";
  if (composite >= 80) return "A";
  if (composite >= 70) return "B";
  if (composite >= 60) return "C";
  if (composite >= 50) return "D";
  return "F";
}

function toSpotlightData(entity: Record<string, unknown>, slug: string): EntitySpotlightData {
  const scores = (entity.scores as Record<string, number>) || {};
  const composite = scores.composite || 0;

  return {
    name: (entity.name as string) || slug,
    type: (entity.type as string) || "unknown",
    provider: (entity.provider as string) || "Unknown",
    description: (entity.description as string) || "",
    composite,
    grade: (entity.grade as string) || gradeFromComposite(composite),
    capabilities: (entity.capabilities as string[]) || [],
    audioUrl: (entity.audioUrl as string) || undefined,
  };
}

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting video metadata generation...`);

  let totalProcessed = 0;
  let spotlightsCreated = 0;
  let roundupsCreated = 0;
  let skipped = 0;

  try {
    // Load existing video queue entries to avoid duplicates
    const queueSnap = await db.collection("video_queue").get();
    const existingJobs = new Set<string>();
    for (const doc of queueSnap.docs) {
      const data = doc.data();
      const status = data.status as string;
      // Skip completed/published — allow re-generation
      if (status === "pending" || status === "rendering") {
        existingJobs.add(doc.id);
      }
    }

    console.log(`[${AGENT_NAME}] ${existingJobs.size} active jobs in queue`);

    // Find entities updated in last 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const cutoffIso = cutoff.toISOString();
    const channelEntities = new Map<string, EntitySpotlightData[]>();

    for (const collectionName of ENTITY_COLLECTIONS) {
      let snapshot;
      try {
        // Try updatedAt field first
        snapshot = await db.collection(collectionName)
          .where("updatedAt", ">=", cutoffIso)
          .get();
      } catch {
        // Fall back to getting all — some collections may not have updatedAt index
        snapshot = await db.collection(collectionName).get();
      }

      for (const doc of snapshot.docs) {
        totalProcessed++;
        const data = doc.data();
        const slug = doc.id;
        const type = (data.type as string) || collectionName.slice(0, -1);
        const jobId = `${type}_${slug}`;

        // Skip if already queued
        if (existingJobs.has(jobId)) {
          skipped++;
          continue;
        }

        const spotlightData = toSpotlightData(data, slug);
        const scenes = entitySpotlightTemplate.render(spotlightData);

        await db.collection("video_queue").doc(jobId).set({
          entityData: spotlightData,
          template: entitySpotlightTemplate.id,
          templateConfig: {
            width: entitySpotlightTemplate.width,
            height: entitySpotlightTemplate.height,
            fps: entitySpotlightTemplate.fps,
            durationFrames: entitySpotlightTemplate.durationFrames,
          },
          scenes,
          status: "pending",
          createdAt: new Date().toISOString(),
          generatedBy: AGENT_NAME,
        });

        spotlightsCreated++;
        console.log(`  [spotlight] ${type}/${slug}: ${scenes.length} scenes queued`);

        // Collect for channel roundups
        const channel = (data.category as string) || "";
        if (channel) {
          const list = channelEntities.get(channel) || [];
          list.push(spotlightData);
          channelEntities.set(channel, list);
        }
      }
    }

    // Generate daily roundup entries for channels with new content
    const today = new Date().toISOString().split("T")[0];

    for (const [channel, entities] of channelEntities) {
      if (entities.length < 2) continue;

      const roundupId = `roundup_${channel}_${today}`;
      if (existingJobs.has(roundupId)) {
        skipped++;
        continue;
      }

      const roundupData: DailyRoundupData = {
        date: today,
        entities: entities.slice(0, 5),
        channel: CHANNEL_NAMES[channel] || channel,
      };

      const scenes = dailyRoundupTemplate.render(roundupData);

      await db.collection("video_queue").doc(roundupId).set({
        entityData: roundupData,
        template: dailyRoundupTemplate.id,
        templateConfig: {
          width: dailyRoundupTemplate.width,
          height: dailyRoundupTemplate.height,
          fps: dailyRoundupTemplate.fps,
          durationFrames: dailyRoundupTemplate.durationFrames,
        },
        scenes,
        status: "pending",
        createdAt: new Date().toISOString(),
        generatedBy: AGENT_NAME,
      });

      roundupsCreated++;
      console.log(`  [roundup] ${channel}: ${entities.length} entities, ${scenes.length} scenes queued`);
    }

    await logAgentAction(
      AGENT_NAME,
      "video_generation_complete",
      { totalProcessed, spotlightsCreated, roundupsCreated, skipped },
      true,
    );

    console.log(
      `[${AGENT_NAME}] Complete. ${totalProcessed} entities processed, ${spotlightsCreated} spotlights, ${roundupsCreated} roundups created, ${skipped} skipped.`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentAction(
      AGENT_NAME,
      "video_generation_failed",
      { totalProcessed, spotlightsCreated, roundupsCreated, skipped },
      false,
      message,
    );
    console.error(`[${AGENT_NAME}] Failed:`, message);
    throw err;
  }
}
