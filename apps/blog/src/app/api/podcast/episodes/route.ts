import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  limit as firestoreLimit,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export const dynamic = "force-dynamic";

interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  duration: number;
  type: string;
  generatedAt: string;
}

const VALID_TYPES = new Set(["entity", "channel", "weekly"]);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");

  try {
    const constraints: QueryConstraint[] = [
      orderBy("generatedAt", "desc"),
      firestoreLimit(100),
    ];

    if (type && VALID_TYPES.has(type)) {
      constraints.unshift(where("type", "==", type));
    }

    const q = query(collection(db, "audio_episodes"), ...constraints);
    const snapshot = await getDocs(q);

    const episodes: PodcastEpisode[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title ?? "",
        description: data.description ?? "",
        audioUrl: data.audioUrl ?? "",
        duration: data.duration ?? 0,
        type: data.type ?? "entity",
        generatedAt: data.generatedAt ?? "",
      };
    });

    return NextResponse.json(episodes, {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch podcast episodes" },
      { status: 500 },
    );
  }
}
