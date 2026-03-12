import { Suspense } from "react";
import type { Metadata } from "next";
import { FollowingClient } from "./following-client";

export const metadata: Metadata = {
  title: "Following — AaaS Knowledge Index",
  description: "View and manage your followed entities and channels on the AaaS Knowledge Index.",
};

export default function FollowingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <span className="text-text-muted font-mono text-sm animate-pulse">Loading following...</span>
        </div>
      }
    >
      <FollowingClient />
    </Suspense>
  );
}
