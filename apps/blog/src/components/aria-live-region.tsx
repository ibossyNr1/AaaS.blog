"use client";

import { useEffect, useState } from "react";

/**
 * Global aria-live regions for screen reader announcements.
 * Renders both a "polite" and "assertive" region.
 *
 * Works in tandem with `announceToScreenReader()` from `@/lib/accessibility`,
 * which programmatically updates these regions. This component ensures the
 * regions exist in the React tree for SSR hydration consistency.
 */
export function AriaLiveRegion() {
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");

  useEffect(() => {
    // Observe mutations on the aria-live regions set by announceToScreenReader()
    const politeEl = document.getElementById("aaas-aria-live-polite");
    const assertiveEl = document.getElementById("aaas-aria-live-assertive");

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const target = mutation.target as HTMLElement;
        if (target.id === "aaas-aria-live-polite") {
          setPoliteMessage(target.textContent ?? "");
        } else if (target.id === "aaas-aria-live-assertive") {
          setAssertiveMessage(target.textContent ?? "");
        }
      }
    });

    if (politeEl) {
      observer.observe(politeEl, { childList: true, characterData: true, subtree: true });
    }
    if (assertiveEl) {
      observer.observe(assertiveEl, { childList: true, characterData: true, subtree: true });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        id="aaas-aria-live-polite"
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
      >
        {politeMessage}
      </div>
      <div
        id="aaas-aria-live-assertive"
        aria-live="assertive"
        aria-atomic="true"
        role="alert"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </>
  );
}
