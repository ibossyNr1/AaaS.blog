"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@aaas/ui";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";

export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = SUPPORTED_LOCALES.find((l) => l.code === locale);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm",
          "border border-border bg-surface text-text",
          "hover:bg-surface/80 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-circuit/40"
        )}
        aria-label="Change language"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="text-base leading-none">{current?.flag}</span>
        <span className="hidden sm:inline font-medium">
          {current?.code.toUpperCase()}
        </span>
        <svg
          className={cn(
            "w-3.5 h-3.5 text-text-muted transition-transform",
            open && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-full mt-1.5 z-50",
            "min-w-[180px] py-1 rounded-lg",
            "border border-border bg-surface shadow-lg",
            "animate-in fade-in slide-in-from-top-1 duration-150"
          )}
          role="listbox"
          aria-label="Select language"
        >
          {SUPPORTED_LOCALES.map((loc) => (
            <button
              key={loc.code}
              role="option"
              aria-selected={loc.code === locale}
              onClick={() => {
                setLocale(loc.code);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left",
                "hover:bg-circuit/10 transition-colors",
                loc.code === locale
                  ? "text-circuit font-medium"
                  : "text-text"
              )}
            >
              <span className="text-base leading-none">{loc.flag}</span>
              <span className="flex-1">{loc.nativeName}</span>
              {loc.code === locale && (
                <svg
                  className="w-4 h-4 text-circuit"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
