import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { NextResponse } from "next/server";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface AudioEpisode {
  id: string;
  entityType: string;
  entitySlug: string;
  title: string;
  type: "entity" | "channel" | "weekly";
  duration: number; // seconds
  createdAt: string;
  audioUrl: string | null;
}

interface VideoJob {
  id: string;
  entityType: string;
  entitySlug: string;
  title: string;
  status: "pending" | "rendering" | "complete" | "failed";
  createdAt: string;
  completedAt: string | null;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function toISO(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === "object" && val !== null && "toDate" in val) {
    const d = (val as { toDate: () => Date }).toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : null;
  }
  if (typeof val === "string") {
    const d = new Date(val);
    return !isNaN(d.getTime()) ? d.toISOString() : null;
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Entity type collections for coverage calculation                           */
/* -------------------------------------------------------------------------- */

const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];

/* -------------------------------------------------------------------------- */
/*  GET                                                                        */
/* -------------------------------------------------------------------------- */

export async function GET() {
  try {
    // Fetch audio episodes
    const audioSnap = await getDocs(
      query(collection(db, "audio_episodes"), orderBy("createdAt", "desc")),
    );

    const allAudio: AudioEpisode[] = audioSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        entityType: (d.entityType as string) ?? "",
        entitySlug: (d.entitySlug as string) ?? "",
        title: (d.title as string) ?? "Untitled",
        type: (d.type as "entity" | "channel" | "weekly") ?? "entity",
        duration: (d.duration as number) ?? 0,
        createdAt: toISO(d.createdAt) ?? new Date().toISOString(),
        audioUrl: (d.audioUrl as string) ?? null,
      };
    });

    // Fetch video queue
    const videoSnap = await getDocs(
      query(collection(db, "video_queue"), orderBy("createdAt", "desc")),
    );

    const allVideos: VideoJob[] = videoSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        entityType: (d.entityType as string) ?? "",
        entitySlug: (d.entitySlug as string) ?? "",
        title: (d.title as string) ?? "Untitled",
        status: (d.status as VideoJob["status"]) ?? "pending",
        createdAt: toISO(d.createdAt) ?? new Date().toISOString(),
        completedAt: toISO(d.completedAt),
      };
    });

    // Stats
    const totalAudio = allAudio.length;
    const totalByType = {
      entity: allAudio.filter((a) => a.type === "entity").length,
      channel: allAudio.filter((a) => a.type === "channel").length,
      weekly: allAudio.filter((a) => a.type === "weekly").length,
    };
    const totalDuration = allAudio.reduce((sum, a) => sum + a.duration, 0);
    const averageDuration = totalAudio > 0 ? Math.round(totalDuration / totalAudio) : 0;
    const pendingVideos = allVideos.filter((v) => v.status === "pending" || v.status === "rendering").length;
    const completedVideos = allVideos.filter((v) => v.status === "complete").length;

    // Coverage: percentage of entities per type that have audio narration
    const coveragePromises = ENTITY_COLLECTIONS.map(async (col) => {
      const entitySnap = await getDocs(collection(db, col));
      const totalEntities = entitySnap.size;
      // Count audio episodes that reference this entity type
      const singularType = col.replace(/s$/, "");
      const audioForType = allAudio.filter(
        (a) => a.type === "entity" && a.entityType === singularType,
      );
      // Unique slugs that have audio
      const slugsWithAudio = new Set(audioForType.map((a) => a.entitySlug));
      const covered = slugsWithAudio.size;
      return {
        type: col,
        total: totalEntities,
        covered,
        percentage: totalEntities > 0 ? Math.round((covered / totalEntities) * 100) : 0,
      };
    });

    const coverage = await Promise.all(coveragePromises);

    // Recent activity
    const recentAudio = allAudio.slice(0, 10);
    const recentVideos = allVideos.slice(0, 10);

    return NextResponse.json(
      {
        stats: {
          totalAudio,
          totalByType,
          totalDuration,
          averageDuration,
          pendingVideos,
          completedVideos,
        },
        coverage,
        recentAudio,
        recentVideos,
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=120",
        },
      },
    );
  } catch (err) {
    console.error("[api/media/stats] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch media statistics" },
      { status: 500 },
    );
  }
}
