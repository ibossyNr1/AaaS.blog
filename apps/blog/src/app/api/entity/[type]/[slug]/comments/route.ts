import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

function sanitize(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> },
) {
  try {
    const { type, slug } = await params;

    const q = query(
      collection(db, "comments"),
      where("entityType", "==", type),
      where("entitySlug", "==", slug),
      where("status", "==", "active"),
      orderBy("createdAt", "desc"),
      limit(50),
    );

    const snap = await getDocs(q);
    const comments = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? null,
    }));

    return NextResponse.json(
      { data: comments, count: comments.length },
      { headers: { "Cache-Control": "public, max-age=60" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> },
) {
  try {
    const { type, slug } = await params;
    const body = await req.json();

    const author = sanitize(String(body.author ?? ""));
    const content = sanitize(String(body.content ?? ""));
    const parentId = body.parentId ? String(body.parentId) : null;

    if (!author || author.length > 50) {
      return NextResponse.json(
        { error: "Author name must be 1-50 characters." },
        { status: 400 },
      );
    }

    if (!content || content.length > 1000) {
      return NextResponse.json(
        { error: "Content must be 1-1000 characters." },
        { status: 400 },
      );
    }

    const docRef = await addDoc(collection(db, "comments"), {
      entityType: type,
      entitySlug: slug,
      author,
      content,
      parentId,
      upvotes: 0,
      createdAt: Timestamp.now(),
      status: "active",
    });

    return NextResponse.json(
      { id: docRef.id, message: "Comment created." },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
