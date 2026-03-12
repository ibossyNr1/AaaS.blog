"use client";

import { useEffect, useState } from "react";

export function SimilarUsersBadge() {
  const [count, setCount] = useState(0);
  const [topInterests, setTopInterests] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const userId = getLocalUserId();
        if (!userId) return;

        const res = await fetch("/api/recommendations/similar-users", {
          headers: { "x-user-id": userId },
        });
        if (!res.ok) return;
        const data = await res.json();

        if (!cancelled && data.count > 0) {
          setCount(data.count);
          setTopInterests(data.topInterests || []);
        }
      } catch {
        // Non-critical
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || count === 0) return null;

  const interestLabel =
    topInterests.length > 0
      ? ` interested in ${topInterests.join(", ")}`
      : "";

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border text-xs text-text-muted">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-circuit animate-pulse" />
      <span>
        {count} user{count !== 1 ? "s" : ""} with similar interests
        {interestLabel}
      </span>
    </div>
  );
}

function getLocalUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const authUid = localStorage.getItem("aaas-uid");
    if (authUid) return authUid;

    const behavior = localStorage.getItem("aaas-behavior");
    if (behavior) {
      const parsed = JSON.parse(behavior);
      return parsed.uid || null;
    }
    return null;
  } catch {
    return null;
  }
}
