"use client";

import { useEffect, useRef } from "react";
import { cn } from "@aaas/ui";

/* ------------------------------------------------------------------ */
/*  Shortcut definitions                                               */
/* ------------------------------------------------------------------ */

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  label: string;
  shortcuts: Shortcut[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    label: "Navigation",
    shortcuts: [
      { keys: ["g", "h"], description: "Go to Home" },
      { keys: ["g", "e"], description: "Go to Explore" },
      { keys: ["g", "l"], description: "Go to Leaderboard" },
      { keys: ["g", "s"], description: "Go to Submit" },
      { keys: ["g", "d"], description: "Go to Dashboard" },
      { keys: ["g", "a"], description: "Go to Activity" },
      { keys: ["g", "w"], description: "Go to Watchlist" },
      { keys: ["g", "t"], description: "Go to Stats" },
      { keys: ["g", "i"], description: "Go to Listen" },
      { keys: ["g", "m"], description: "Go to Embed" },
      { keys: ["g", "p"], description: "Go to API Docs" },
    ],
  },
  {
    label: "Search",
    shortcuts: [
      { keys: ["/"], description: "Open command palette" },
      { keys: ["⌘", "K"], description: "Open command palette" },
    ],
  },
  {
    label: "General",
    shortcuts: [
      { keys: ["?"], description: "Show keyboard shortcuts" },
      { keys: ["Esc"], description: "Close overlay" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface ShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsHelp({ open, onClose }: ShortcutsHelpProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl mx-4 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-medium text-text">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-6 h-6 rounded text-text-muted hover:text-text hover:bg-base transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-5">
          {shortcutGroups.map((group) => (
            <div key={group.label}>
              <h3 className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
                {group.label}
              </h3>
              <div className="space-y-1.5">
                {group.shortcuts.map((shortcut, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm text-text-muted">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, ki) => (
                        <span key={ki}>
                          {ki > 0 && (
                            <span className="text-text-muted text-xs mx-0.5">then</span>
                          )}
                          <kbd
                            className={cn(
                              "inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded",
                              "bg-base text-[11px] font-mono text-text-muted border border-border",
                            )}
                          >
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border">
          <p className="text-[11px] text-text-muted font-mono text-center">
            Press <kbd className="px-1 py-0.5 rounded bg-base border border-border text-[10px]">?</kbd> to toggle this overlay
          </p>
        </div>
      </div>
    </div>
  );
}
