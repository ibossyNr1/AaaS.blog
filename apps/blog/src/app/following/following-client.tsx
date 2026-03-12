"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Container, Section, Card, Badge } from "@aaas/ui";
import { useFollows } from "@/lib/follows";
import { ENTITY_TYPES, type EntityType } from "@/lib/types";
import { getChannelName } from "@/lib/channels";

interface FeedItem {
  entityName: string;
  entityType: string;
  entitySlug: string;
  changeSummary: string;
  timestamp: string;
}

export function FollowingClient() {
  const {
    followedEntities,
    followedChannels,
    unfollowEntity,
    unfollowChannel,
  } = useFollows();

  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);

  const totalCount = followedEntities.length + followedChannels.length;

  // Fetch activity feed for followed entities
  useEffect(() => {
    if (followedEntities.length === 0) {
      setFeed([]);
      return;
    }
    setFeedLoading(true);
    const ids = followedEntities.join(",");
    fetch(`/api/following/feed?ids=${encodeURIComponent(ids)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setFeed(Array.isArray(data) ? data : []))
      .catch(() => setFeed([]))
      .finally(() => setFeedLoading(false));
  }, [followedEntities]);

  return (
    <Section className="pt-28 pb-16">
      <Container className="max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-1">Following</h1>
          <p className="text-sm text-text-muted font-mono">
            {totalCount} {totalCount === 1 ? "item" : "items"} followed
          </p>
        </div>

        {/* Empty state */}
        {totalCount === 0 && (
          <Card className="text-center py-16">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
              className="w-12 h-12 mx-auto text-text-muted/40 mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
            <p className="text-text-muted mb-2">You&apos;re not following anything yet.</p>
            <p className="text-sm text-text-muted">
              Visit entity pages and click the bell icon to follow them.
            </p>
            <Link
              href="/explore"
              className="inline-block mt-6 text-sm text-circuit hover:underline font-mono"
            >
              Explore entities →
            </Link>
          </Card>
        )}

        {/* Followed Entities */}
        {followedEntities.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              Entities
              <span className="text-xs font-mono text-text-muted">({followedEntities.length})</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {followedEntities.map((id) => {
                const [type, slug] = id.split(":");
                const typeInfo = ENTITY_TYPES[type as EntityType];
                return (
                  <Card key={id} className="flex items-center gap-3 group relative">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="circuit" className="text-[10px]">
                          {typeInfo?.label ?? type}
                        </Badge>
                      </div>
                      <Link
                        href={`/${type}/${slug}`}
                        className="text-sm font-semibold text-text group-hover:text-circuit transition-colors truncate block"
                      >
                        {slug}
                      </Link>
                    </div>
                    <button
                      onClick={() => unfollowEntity(id)}
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors"
                      aria-label={`Unfollow ${slug}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-3.5 h-3.5"
                      >
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Followed Channels */}
        {followedChannels.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              Channels
              <span className="text-xs font-mono text-text-muted">({followedChannels.length})</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {followedChannels.map((slug) => (
                <Card key={slug} className="flex items-center gap-3 group relative">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/channel/${slug}`}
                      className="text-sm font-semibold text-text group-hover:text-circuit transition-colors truncate block"
                    >
                      {getChannelName(slug)}
                    </Link>
                    <span className="text-xs font-mono text-text-muted">/channel/{slug}</span>
                  </div>
                  <button
                    onClick={() => unfollowChannel(slug)}
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors"
                    aria-label={`Unfollow ${getChannelName(slug)}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Activity Feed */}
        {followedEntities.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              Activity Feed
              {feedLoading && (
                <span className="text-xs font-mono text-text-muted animate-pulse">loading...</span>
              )}
            </h2>
            {!feedLoading && feed.length === 0 && (
              <Card className="py-8 text-center">
                <p className="text-sm text-text-muted">No recent activity for your followed entities.</p>
              </Card>
            )}
            {feed.length > 0 && (
              <div className="space-y-2">
                {feed.map((item, i) => (
                  <Card key={i} className="flex items-start gap-3 py-3 px-4">
                    <div className="shrink-0 mt-0.5">
                      <Badge variant="circuit" className="text-[10px]">
                        {item.entityType}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/${item.entityType}/${item.entitySlug}`}
                        className="text-sm font-semibold text-text hover:text-circuit transition-colors"
                      >
                        {item.entityName}
                      </Link>
                      <p className="text-xs text-text-muted mt-0.5">{item.changeSummary}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-mono text-text-muted">
                      {new Date(item.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </Container>
    </Section>
  );
}
