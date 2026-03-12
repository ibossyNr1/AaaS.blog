"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Badge, cn } from "@aaas/ui";
import Link from "next/link";
import type {
  EntityCluster,
  TopicMap,
  DiscoveryPath,
} from "@/lib/clustering";

/* -------------------------------------------------------------------------- */
/*  Types for API responses                                                    */
/* -------------------------------------------------------------------------- */

type Tab = "clusters" | "topics" | "paths";

const TABS: { key: Tab; label: string }[] = [
  { key: "clusters", label: "Clusters" },
  { key: "topics", label: "Topic Map" },
  { key: "paths", label: "Learning Paths" },
];

const DIFFICULTY_OPTIONS = ["all", "beginner", "intermediate", "advanced"] as const;

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-green-400",
  intermediate: "text-yellow-400",
  advanced: "text-red-400",
};

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-surface-alt/50",
        className,
      )}
      style={style}
    />
  );
}

function ClusterSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} variant="glass" className="p-5 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-4 w-1/3" />
        </Card>
      ))}
    </div>
  );
}

function TopicSkeleton() {
  return (
    <div className="flex flex-wrap gap-4 justify-center py-12">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton
          key={i}
          className="rounded-full"
          style={{
            width: `${60 + Math.random() * 80}px`,
            height: `${60 + Math.random() * 80}px`,
          }}
        />
      ))}
    </div>
  );
}

function PathSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} variant="glass" className="p-5 space-y-3">
          <Skeleton className="h-5 w-1/2" />
          <div className="flex gap-3">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
        </Card>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Clusters tab                                                               */
/* -------------------------------------------------------------------------- */

function ClustersView({ clusters }: { clusters: EntityCluster[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (clusters.length === 0) {
    return (
      <p className="text-text-muted text-sm py-8 text-center">
        No clusters computed yet. Run the clustering agent to generate data.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clusters.map((cluster) => {
        const isExpanded = expanded === cluster.id;
        return (
          <Card
            key={cluster.id}
            variant="glass"
            className="p-5 cursor-pointer transition-all hover:ring-1 hover:ring-circuit/30"
            onClick={() => setExpanded(isExpanded ? null : cluster.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-semibold text-text leading-tight">
                {cluster.name}
              </h3>
              <span className="text-xs text-text-muted whitespace-nowrap ml-2">
                {cluster.size} entities
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {cluster.centroidTags.slice(0, 5).map((tag) => (
                <Badge key={tag} variant="circuit" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                <p className="text-xs text-text-muted mb-2">
                  {cluster.description}
                </p>
                <div className="space-y-1">
                  {cluster.entities.slice(0, 10).map((entityKey) => {
                    const [type, ...slugParts] = entityKey.split("/");
                    const slug = slugParts.join("/");
                    return (
                      <Link
                        key={entityKey}
                        href={`/${type}/${slug}`}
                        className="block text-xs text-circuit hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {type}/{slug}
                      </Link>
                    );
                  })}
                  {cluster.entities.length > 10 && (
                    <p className="text-xs text-text-muted">
                      +{cluster.entities.length - 10} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Topic map tab                                                              */
/* -------------------------------------------------------------------------- */

function TopicMapView({ topicMap }: { topicMap: TopicMap | null }) {
  if (!topicMap || topicMap.topics.length === 0) {
    return (
      <p className="text-text-muted text-sm py-8 text-center">
        No topic map available yet. Run the clustering agent to generate data.
      </p>
    );
  }

  const maxCount = Math.max(...topicMap.topics.map((t) => t.entityCount));

  return (
    <div className="space-y-6">
      {/* Visual topic bubbles */}
      <div className="relative flex flex-wrap gap-3 justify-center py-8 min-h-[200px]">
        {topicMap.topics.slice(0, 30).map((topic) => {
          const sizeRatio = topic.entityCount / maxCount;
          const size = Math.max(56, Math.round(sizeRatio * 120));
          const scoreHue = topic.avgScore >= 70 ? 170 : topic.avgScore >= 40 ? 50 : 0;
          const opacity = 0.5 + sizeRatio * 0.5;

          return (
            <div
              key={topic.id}
              className={cn(
                "flex items-center justify-center rounded-full border transition-transform hover:scale-110",
                topic.trending
                  ? "border-circuit/60 shadow-[0_0_12px_rgba(0,243,255,0.2)]"
                  : "border-border/40",
              )}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: `hsla(${scoreHue}, 60%, 40%, ${opacity * 0.3})`,
              }}
              title={`${topic.name}: ${topic.entityCount} entities, avg score ${topic.avgScore}`}
            >
              <span
                className="text-text text-center leading-tight px-1"
                style={{ fontSize: `${Math.max(9, Math.round(sizeRatio * 13))}px` }}
              >
                {topic.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Connection list */}
      {topicMap.connections.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text mb-3">
            Top Connections
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {topicMap.connections.slice(0, 15).map((conn, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-text-muted bg-surface-alt/30 rounded-lg px-3 py-2"
              >
                <span className="text-text font-medium">{conn.from}</span>
                <span className="text-circuit">
                  {"<->"}
                </span>
                <span className="text-text font-medium">{conn.to}</span>
                <span className="ml-auto opacity-60">
                  {Math.round(conn.strength * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic stats table */}
      <div>
        <h3 className="text-sm font-semibold text-text mb-3">All Topics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="text-left py-2 pr-4">Topic</th>
                <th className="text-right py-2 px-4">Entities</th>
                <th className="text-right py-2 px-4">Avg Score</th>
                <th className="text-right py-2 pl-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {topicMap.topics.map((topic) => (
                <tr key={topic.id} className="border-b border-border/30">
                  <td className="py-2 pr-4 text-text font-medium">
                    {topic.name}
                  </td>
                  <td className="text-right py-2 px-4 text-text-muted">
                    {topic.entityCount}
                  </td>
                  <td className="text-right py-2 px-4 text-text-muted">
                    {topic.avgScore}
                  </td>
                  <td className="text-right py-2 pl-4">
                    {topic.trending ? (
                      <Badge variant="circuit" className="text-xs">
                        Trending
                      </Badge>
                    ) : (
                      <span className="text-text-muted">Stable</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Learning paths tab                                                         */
/* -------------------------------------------------------------------------- */

function PathsView({ paths }: { paths: DiscoveryPath[] }) {
  const [expandedPath, setExpandedPath] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  const filtered =
    difficultyFilter === "all"
      ? paths
      : paths.filter((p) => p.difficulty === difficultyFilter);

  if (paths.length === 0) {
    return (
      <p className="text-text-muted text-sm py-8 text-center">
        No discovery paths available yet. Run the clustering agent to generate
        data.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Difficulty filter */}
      <div className="flex gap-2 flex-wrap">
        {DIFFICULTY_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => setDifficultyFilter(opt)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
              difficultyFilter === opt
                ? "border-circuit/60 bg-circuit/10 text-circuit"
                : "border-border/40 text-text-muted hover:text-text hover:border-border",
            )}
          >
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </button>
        ))}
      </div>

      {/* Path cards */}
      {filtered.map((path) => {
        const isExpanded = expandedPath === path.id;
        return (
          <Card
            key={path.id}
            variant="glass"
            className="p-5 cursor-pointer transition-all hover:ring-1 hover:ring-circuit/30"
            onClick={() => setExpandedPath(isExpanded ? null : path.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-semibold text-text">
                {path.name}
              </h3>
              <div className="flex items-center gap-2 ml-3">
                <Badge variant="circuit" className="text-xs">
                  {path.steps.length} steps
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-text-muted mb-2">
              <span className={DIFFICULTY_COLORS[path.difficulty] || ""}>
                {path.difficulty}
              </span>
              <span>{path.estimatedTime}</span>
            </div>

            <p className="text-xs text-text-muted">{path.description}</p>

            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                {path.steps.map((step) => (
                  <div
                    key={step.order}
                    className="flex gap-3 items-start"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-circuit/20 text-circuit flex items-center justify-center text-xs font-bold">
                      {step.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/${step.entityType}/${step.entitySlug}`}
                        className="text-sm text-circuit hover:underline font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {step.entityName}
                      </Link>
                      <span className="text-xs text-text-muted ml-2">
                        {step.entityType}
                      </span>
                      <p className="text-xs text-text-muted mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}

      {filtered.length === 0 && (
        <p className="text-text-muted text-sm text-center py-4">
          No paths match the selected difficulty.
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main client component                                                      */
/* -------------------------------------------------------------------------- */

export function DiscoverClient() {
  const [activeTab, setActiveTab] = useState<Tab>("clusters");
  const [clusters, setClusters] = useState<EntityCluster[]>([]);
  const [topicMap, setTopicMap] = useState<TopicMap | null>(null);
  const [paths, setPaths] = useState<DiscoveryPath[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (tab: Tab) => {
    setLoading(true);
    try {
      if (tab === "clusters") {
        const res = await fetch("/api/discover/clusters");
        if (res.ok) setClusters(await res.json());
      } else if (tab === "topics") {
        const res = await fetch("/api/discover/topics");
        if (res.ok) setTopicMap(await res.json());
      } else if (tab === "paths") {
        const res = await fetch("/api/discover/paths");
        if (res.ok) setPaths(await res.json());
      }
    } catch (err) {
      console.error(`[discover] Failed to fetch ${tab}:`, err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, fetchData]);

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.key
                ? "border-circuit text-circuit"
                : "border-transparent text-text-muted hover:text-text",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? (
        <>
          {activeTab === "clusters" && <ClusterSkeleton />}
          {activeTab === "topics" && <TopicSkeleton />}
          {activeTab === "paths" && <PathSkeleton />}
        </>
      ) : (
        <>
          {activeTab === "clusters" && <ClustersView clusters={clusters} />}
          {activeTab === "topics" && <TopicMapView topicMap={topicMap} />}
          {activeTab === "paths" && <PathsView paths={paths} />}
        </>
      )}
    </div>
  );
}
