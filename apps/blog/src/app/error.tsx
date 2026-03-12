"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/error-fallback";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);

    // Report to error tracking API
    fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        url: typeof window !== "undefined" ? window.location.href : null,
      }),
    }).catch(() => {
      // Silently fail — error reporting should not cause more errors
    });
  }, [error]);

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Something went wrong"
      suggestion="An unexpected error occurred. You can try again or return to the homepage."
    />
  );
}
