import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Activity {
  id: string;
  kind: "submission" | "comment";
  timestamp: string;
  title: string;
  entityType?: string;
  entitySlug?: string;
  status?: string;
}

export async function GET(req: NextRequest) {
  const author = req.nextUrl.searchParams.get("author");

  if (!author || author.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing required query parameter: author" },
      { status: 400 },
    );
  }

  try {
    // Fetch submissions by author
    const submissionsSnap = await getDocs(
      query(
        collection(db, "submissions"),
        where("submittedBy", "==", author),
        orderBy("submittedAt", "desc"),
      ),
    );

    let pending = 0;
    let approved = 0;
    let rejected = 0;
    const activities: Activity[] = [];

    for (const doc of submissionsSnap.docs) {
      const d = doc.data();
      const status = d.status ?? "pending";
      if (status === "pending") pending++;
      else if (status === "approved") approved++;
      else if (status === "rejected") rejected++;

      const ts = d.submittedAt?.toDate?.()
        ? d.submittedAt.toDate().toISOString()
        : typeof d.submittedAt === "string"
          ? d.submittedAt
          : new Date().toISOString();

      activities.push({
        id: doc.id,
        kind: "submission",
        timestamp: ts,
        title: d.entity?.name ?? "Unknown entity",
        entityType: d.entity?.type,
        entitySlug: d.entity?.slug,
        status,
      });
    }

    const submissionStats = {
      total: submissionsSnap.size,
      pending,
      approved,
      rejected,
    };

    // Fetch comments by author (graceful fallback if collection doesn't exist)
    let commentTotal = 0;
    let upvotesReceived = 0;

    try {
      const commentsSnap = await getDocs(
        query(
          collection(db, "comments"),
          where("author", "==", author),
          orderBy("createdAt", "desc"),
        ),
      );

      commentTotal = commentsSnap.size;

      for (const doc of commentsSnap.docs) {
        const d = doc.data();
        upvotesReceived += d.upvotes ?? 0;

        const ts = d.createdAt?.toDate?.()
          ? d.createdAt.toDate().toISOString()
          : typeof d.createdAt === "string"
            ? d.createdAt
            : new Date().toISOString();

        activities.push({
          id: doc.id,
          kind: "comment",
          timestamp: ts,
          title: d.text
            ? d.text.length > 80
              ? d.text.slice(0, 80) + "..."
              : d.text
            : "Comment",
          entityType: d.entityType,
          entitySlug: d.entitySlug,
        });
      }
    } catch {
      // Comments collection may not exist yet — ignore
    }

    // Sort activities by date descending, take top 20
    activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    const recentActivity = activities.slice(0, 20);

    return NextResponse.json(
      {
        submissions: submissionStats,
        comments: { total: commentTotal, upvotesReceived },
        recentActivity,
      },
      {
        headers: { "Cache-Control": "public, max-age=30" },
      },
    );
  } catch (err) {
    console.error("[api/profile] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch profile data" },
      { status: 500 },
    );
  }
}
