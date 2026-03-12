"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, cn } from "@aaas/ui";
import type { Achievement, AchievementCategory, AchievementTier } from "@/lib/achievements";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LoadingSkeleton } from "@/components/loading-skeleton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EnrichedAchievement extends Achievement {
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
}

interface AchievementStats {
  totalPoints: number;
  completedCount: number;
  totalCount: number;
}

interface LeaderboardEntry {
  userId: string;
  points: number;
  achievementCount: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: { key: AchievementCategory; label: string; icon: string }[] = [
  { key: "explorer", label: "Explorer", icon: "🧭" },
  { key: "contributor", label: "Contributor", icon: "✍️" },
  { key: "curator", label: "Curator", icon: "🎨" },
  { key: "social", label: "Social", icon: "🌐" },
  { key: "streak", label: "Streak", icon: "🔥" },
];

const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: "text-amber-600 border-amber-600/30 bg-amber-600/10",
  silver: "text-gray-400 border-gray-400/30 bg-gray-400/10",
  gold: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  platinum: "text-circuit border-circuit/30 bg-circuit/10",
};

const TIER_LABELS: Record<AchievementTier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AchievementsClient() {
  const [achievements, setAchievements] = useState<EnrichedAchievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [achRes, lbRes] = await Promise.all([
          fetch("/api/achievements", {
            headers: { "x-user-id": "current-user" },
          }),
          fetch("/api/achievements/leaderboard?limit=10"),
        ]);

        if (achRes.ok) {
          const data = await achRes.json();
          setAchievements(data.achievements ?? []);
          setStats(data.stats ?? null);
        }

        if (lbRes.ok) {
          const data = await lbRes.json();
          setLeaderboard(data.leaderboard ?? []);
        }
      } catch {
        // Silently fail — UI will show empty state
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return achievements;
    return achievements.filter((a) => a.category === activeCategory);
  }, [achievements, activeCategory]);

  const unlockedCount = stats?.completedCount ?? 0;
  const totalPoints = stats?.totalPoints ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Achievements" },
            ]}
          />
          <LoadingSkeleton variant="card" count={6} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-surface py-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Achievements" },
          ]}
        />

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-text tracking-tight">
            Achievements
          </h1>
          <p className="text-text-muted max-w-xl mx-auto">
            Explore, contribute, and curate to unlock achievements and earn points.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <Card variant="glass" className="p-4 text-center">
            <p className="text-2xl font-bold text-circuit font-mono">{totalPoints}</p>
            <p className="text-xs text-text-muted mt-1">Points</p>
          </Card>
          <Card variant="glass" className="p-4 text-center">
            <p className="text-2xl font-bold text-text font-mono">
              {unlockedCount}/{stats?.totalCount ?? 0}
            </p>
            <p className="text-xs text-text-muted mt-1">Unlocked</p>
          </Card>
          <Card variant="glass" className="p-4 text-center">
            <p className="text-2xl font-bold text-text font-mono">
              {stats?.totalCount
                ? Math.round((unlockedCount / stats.totalCount) * 100)
                : 0}
              %
            </p>
            <p className="text-xs text-text-muted mt-1">Complete</p>
          </Card>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
              activeCategory === "all"
                ? "bg-circuit/15 text-circuit border-circuit/30"
                : "text-text-muted border-border hover:border-circuit/30 hover:text-text",
            )}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                activeCategory === cat.key
                  ? "bg-circuit/15 text-circuit border-circuit/30"
                  : "text-text-muted border-border hover:border-circuit/30 hover:text-text",
              )}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Achievement grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-text-muted py-12">
            No achievements in this category yet.
          </p>
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-text text-center">
              Leaderboard
            </h2>
            <Card variant="glass" className="overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-text-muted font-medium">
                      Rank
                    </th>
                    <th className="text-left px-4 py-3 text-text-muted font-medium">
                      User
                    </th>
                    <th className="text-right px-4 py-3 text-text-muted font-medium">
                      Achievements
                    </th>
                    <th className="text-right px-4 py-3 text-text-muted font-medium">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, i) => (
                    <tr
                      key={entry.userId}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-4 py-3 font-mono text-text-muted">
                        #{i + 1}
                      </td>
                      <td className="px-4 py-3 text-text font-medium truncate max-w-[200px]">
                        {entry.userId}
                      </td>
                      <td className="px-4 py-3 text-right text-text-muted font-mono">
                        {entry.achievementCount}
                      </td>
                      <td className="px-4 py-3 text-right text-circuit font-mono font-bold">
                        {entry.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// AchievementCard
// ---------------------------------------------------------------------------

function AchievementCard({
  achievement,
}: {
  achievement: EnrichedAchievement;
}) {
  const { unlocked, progress, icon, name, description, tier, requirement, points } =
    achievement;

  const progressPercent = Math.min(
    (progress / requirement.threshold) * 100,
    100,
  );

  return (
    <Card
      variant="glass"
      className={cn(
        "p-5 transition-all duration-300",
        unlocked
          ? "border-circuit/20"
          : "opacity-60 grayscale hover:opacity-80 hover:grayscale-0",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className="text-2xl flex-shrink-0" role="img" aria-label={name}>
          {icon}
        </span>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Title row */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-text truncate">
              {name}
            </h3>
            <span
              className={cn(
                "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border",
                TIER_COLORS[tier],
              )}
            >
              {TIER_LABELS[tier]}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-text-muted leading-relaxed">
            {description}
          </p>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-border/50 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  unlocked ? "bg-circuit" : "bg-text-muted/40",
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-text-muted font-mono">
              <span>
                {progress}/{requirement.threshold}
              </span>
              <span>{points} pts</span>
            </div>
          </div>

          {/* Unlocked timestamp */}
          {unlocked && achievement.unlockedAt && (
            <p className="text-[10px] text-circuit font-mono">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
