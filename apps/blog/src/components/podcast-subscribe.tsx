"use client";

import { useState } from "react";
import { cn } from "@aaas/ui";

const RSS_URL = "https://aaas.blog/api/podcast/feed";

const PLATFORMS = [
  {
    name: "RSS Feed",
    href: RSS_URL,
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1Z" />
      </svg>
    ),
    action: "link" as const,
  },
  {
    name: "Apple Podcasts",
    href: "https://podcasts.apple.com/podcast/aaas-knowledge-index",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm0 3a7 7 0 0 1 7 7c0 1.93-.78 3.68-2.05 4.95a1 1 0 0 1-1.41-1.42A4.98 4.98 0 0 0 17 12a5 5 0 1 0-8.54 3.53 1 1 0 0 1-1.41 1.42A7 7 0 0 1 12 5Zm0 4a3 3 0 0 1 2.12 5.12 1 1 0 0 1-1.41-1.41A1 1 0 1 0 11.3 11.3a1 1 0 0 1-1.42-1.42A3 3 0 0 1 12 9Zm-1 6h2l.5 5h-3l.5-5Z" />
      </svg>
    ),
    action: "link" as const,
  },
  {
    name: "Spotify",
    href: "https://open.spotify.com/show/aaas-knowledge-index",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    ),
    action: "link" as const,
  },
  {
    name: "Google Podcasts",
    href: `https://podcasts.google.com/feed/${btoa(RSS_URL)}`,
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2s-2-.9-2-2V2c0-1.1.9-2 2-2Zm0 16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2s-2-.9-2-2v-4c0-1.1.9-2 2-2Zm0 -6c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2s-2-.9-2-2v-2c0-1.1.9-2 2-2ZM6 8c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2v-6c0-1.1.9-2 2-2Zm12 0c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2v-6c0-1.1.9-2 2-2Z" />
      </svg>
    ),
    action: "link" as const,
  },
  {
    name: "Copy RSS",
    href: RSS_URL,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    ),
    action: "copy" as const,
  },
];

export function PodcastSubscribe({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(RSS_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: open in new tab
      window.open(RSS_URL, "_blank");
    }
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        className,
      )}
    >
      <span className="text-xs font-mono uppercase tracking-wider text-text-muted mr-1">
        Subscribe
      </span>
      {PLATFORMS.map((platform) =>
        platform.action === "copy" ? (
          <button
            key={platform.name}
            onClick={handleCopy}
            title={copied ? "Copied!" : platform.name}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono",
              "border border-border bg-surface hover:border-circuit/40 hover:text-circuit",
              "transition-colors duration-200",
              copied && "border-circuit text-circuit",
            )}
          >
            {platform.icon}
            <span>{copied ? "Copied!" : "Copy RSS"}</span>
          </button>
        ) : (
          <a
            key={platform.name}
            href={platform.href}
            target="_blank"
            rel="noopener noreferrer"
            title={platform.name}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono",
              "border border-border bg-surface hover:border-circuit/40 hover:text-circuit",
              "transition-colors duration-200",
            )}
          >
            {platform.icon}
            <span>{platform.name}</span>
          </a>
        ),
      )}
    </div>
  );
}
