import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ type: string; slug: string; commentId: string }>;
  },
) {
  try {
    const { commentId } = await params;

    const commentRef = doc(db, "comments", commentId);
    await updateDoc(commentRef, { upvotes: increment(1) });

    return NextResponse.json({ message: "Vote recorded." });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
