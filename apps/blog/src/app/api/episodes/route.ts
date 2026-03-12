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

interface Episode {
  id: string;
  title: string;
  description: string;
  format: "narration" | "digest" | "podcast";
  duration: number;
  audioUrl: string;
  publishedAt: string;
  sourceRef: string | null;
  sourceType: string | null;
  channel: string | null;
  tags: string[];
  playCount: number;
}

const VALID_FORMATS = new Set(["narration", "digest", "podcast"]);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const format = searchParams.get("format");
  const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

  try {
    const constraints: QueryConstraint[] = [
      orderBy("publishedAt", "desc"),
      firestoreLimit(limit),
    ];

    if (format && VALID_FORMATS.has(format)) {
      constraints.unshift(where("format", "==", format));
    }

    const q = query(collection(db, "episodes"), ...constraints);
    const snapshot = await getDocs(q);

    const episodes: Episode[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Episode, "id">),
    }));

    return NextResponse.json({
      data: episodes,
      count: episodes.length,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch episodes" },
      { status: 500 }
    );
  }
}
