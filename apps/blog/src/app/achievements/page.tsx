import { Suspense } from "react";
import type { Metadata } from "next";
import { AchievementsClient } from "./achievements-client";

export const metadata: Metadata = {
  title: "Achievements — AaaS Knowledge Index",
  description:
    "Track your progress, unlock achievements, and climb the leaderboard on the AaaS Knowledge Index.",
};

export default function AchievementsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <span className="text-text-muted font-mono text-sm animate-pulse">
            Loading achievements...
          </span>
        </div>
      }
    >
      <AchievementsClient />
    </Suspense>
  );
}
