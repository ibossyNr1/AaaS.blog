/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";

interface LinkMetadata {
  url: string;
  title: string | null;
  description: string | null;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  statusCode: number | null;
  lastChecked: string;
  error?: string;
}

interface EntityLinkPreviewProps {
  type: string;
  slug: string;
}

export function EntityLinkPreview({ type, slug }: EntityLinkPreviewProps) {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchMetadata() {
      try {
        const res = await fetch(`/api/entity/${type}/${slug}/metadata`);
        if (!res.ok) {
          setFailed(true);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setMetadata(data);
        }
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchMetadata();
    return () => { cancelled = true; };
  }, [type, slug]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-4">
        <div className="animate-pulse rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 rounded bg-surface-alt" />
            <div className="h-4 w-48 rounded bg-surface-alt" />
          </div>
          <div className="mt-3 h-3 w-full rounded bg-surface-alt" />
          <div className="mt-2 h-3 w-3/4 rounded bg-surface-alt" />
        </div>
      </div>
    );
  }

  // No metadata available — don't render anything
  if (failed || !metadata) {
    return null;
  }

  const { url, title, description, faviconUrl, ogImageUrl, lastChecked } = metadata;

  // If metadata has an error and no useful data, skip rendering
  if (metadata.error && !title && !description) {
    return null;
  }

  const formattedDate = lastChecked
    ? new Date(lastChecked).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  let hostname = "";
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = url;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-4">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block overflow-hidden rounded-lg border border-border bg-surface transition-all hover:border-accent hover:shadow-md"
      >
        <div className="flex">
          {/* OG Image thumbnail */}
          {ogImageUrl && (
            <div className="hidden w-48 flex-shrink-0 sm:block">
              <img
                src={ogImageUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          {/* Content */}
          <div className="flex flex-1 flex-col justify-center p-4">
            {/* Site identity row */}
            <div className="flex items-center gap-2 text-xs text-text-muted">
              {faviconUrl && (
                <img
                  src={faviconUrl}
                  alt=""
                  className="h-4 w-4 rounded-sm"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <span>{hostname}</span>
            </div>

            {/* Title */}
            {title && (
              <h4 className="mt-1 text-sm font-semibold text-text group-hover:text-accent line-clamp-1">
                {title}
              </h4>
            )}

            {/* Description */}
            {description && (
              <p className="mt-1 text-xs text-text-muted line-clamp-2">
                {description}
              </p>
            )}

            {/* Footer */}
            {formattedDate && (
              <p className="mt-2 text-[10px] text-text-muted/60">
                Last checked {formattedDate}
              </p>
            )}
          </div>
        </div>
      </a>
    </div>
  );
}
