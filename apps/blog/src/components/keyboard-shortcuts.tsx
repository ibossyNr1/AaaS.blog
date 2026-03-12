"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ShortcutsHelp } from "@/components/shortcuts-help";

/* ------------------------------------------------------------------ */
/*  Vim-style "g" prefix routes                                        */
/* ------------------------------------------------------------------ */

const gRoutes: Record<string, string> = {
  e: "/explore",
  l: "/leaderboard",
  s: "/submit",
  d: "/dashboard",
  a: "/activity",
  w: "/watchlist",
  h: "/",
  t: "/stats",
  i: "/listen",
  m: "/embed",
  p: "/api-docs",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function KeyboardShortcuts() {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);
  const [gPending, setGPending] = useState(false);
  const gTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearGState = useCallback(() => {
    if (gTimerRef.current) {
      clearTimeout(gTimerRef.current);
      gTimerRef.current = null;
    }
    setGPending(false);
  }, []);

  const toggleHelp = useCallback(() => {
    setHelpOpen((prev) => !prev);
  }, []);

  const closeHelp = useCallback(() => {
    setHelpOpen(false);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Never fire shortcuts when typing in inputs
      if (isInputFocused()) return;

      // Ignore if modifier keys are held (except shift for ?)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key;

      // --- Help overlay is open: only ? toggles it, Esc handled by ShortcutsHelp ---
      if (helpOpen) {
        if (key === "?") {
          e.preventDefault();
          closeHelp();
        }
        return;
      }

      // --- "g" prefix pending: check second key ---
      if (gPending) {
        clearGState();
        const route = gRoutes[key];
        if (route) {
          e.preventDefault();
          router.push(route);
        }
        return;
      }

      // --- Single key shortcuts ---
      switch (key) {
        case "?":
          e.preventDefault();
          toggleHelp();
          break;

        case "/":
          e.preventDefault();
          // Dispatch Cmd+K to open command palette
          window.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: "k",
              code: "KeyK",
              metaKey: true,
              bubbles: true,
            }),
          );
          break;

        case "g":
          e.preventDefault();
          setGPending(true);
          gTimerRef.current = setTimeout(() => {
            setGPending(false);
          }, 1000);
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [helpOpen, gPending, clearGState, closeHelp, toggleHelp, router]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (gTimerRef.current) clearTimeout(gTimerRef.current);
    };
  }, []);

  return (
    <>
      {/* "g" prefix toast indicator */}
      {gPending && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[55] px-3 py-1.5 rounded-lg bg-surface border border-border shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="text-sm font-mono text-circuit">g…</span>
        </div>
      )}

      {/* Help overlay */}
      <ShortcutsHelp open={helpOpen} onClose={closeHelp} />
    </>
  );
}
