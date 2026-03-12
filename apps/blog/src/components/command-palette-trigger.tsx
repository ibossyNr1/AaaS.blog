"use client";

import { useEffect, useState } from "react";

export function CommandPaletteTrigger() {
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(navigator.platform?.toUpperCase().includes("MAC") ?? true);
  }, []);

  function openPalette() {
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
        bubbles: true,
      }),
    );
  }

  return (
    <button
      onClick={openPalette}
      className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-base/50 text-xs text-text-muted hover:text-text hover:border-circuit/40 transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
      </svg>
      <span>Search...</span>
      <kbd className="font-mono text-[10px] px-1 py-0.5 rounded bg-surface border border-border">
        {isMac ? "⌘" : "Ctrl+"}K
      </kbd>
    </button>
  );
}
