import Link from "next/link";
import { Card, Badge } from "@aaas/ui";
import type { Entity } from "@/lib/types";
import { ENTITY_TYPES } from "@/lib/types";
import { getChannelName } from "@/lib/channels";
import { GradeBadge } from "@/components/grade-badge";
import { EntitySparkline } from "@/components/entity-sparkline";

interface EntityCardProps {
  entity: Entity;
}

const TYPE_DOT_COLORS: Record<string, string> = {
  model: "bg-red",
  benchmark: "bg-red",
  agent: "bg-circuit",
  tool: "bg-accent-teal",
  skill: "bg-pastel-lavender",
  script: "bg-pastel-gold",
};

export function EntityCard({ entity }: EntityCardProps) {
  const typeInfo = ENTITY_TYPES[entity.type];
  const accentColor = ["model", "benchmark"].includes(entity.type) ? "red" : "circuit";
  const dotColor = TYPE_DOT_COLORS[entity.type] || "bg-circuit";

  return (
    <Link href={`/${entity.type}/${entity.slug}`}>
      <Card variant="glass" spotlight accentColor={accentColor} className="h-full flex flex-col group cursor-pointer">
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor}`} />
          <Badge variant="circuit">
            {typeInfo.label}
          </Badge>
          <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
            {getChannelName(entity.category)}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-text mb-1 group-hover:text-circuit transition-colors">
          {entity.name}
        </h3>
        <p className="text-xs text-text-muted mb-3">
          by {entity.provider}
        </p>
        <p className="text-sm text-text-muted leading-relaxed flex-grow line-clamp-3">
          {entity.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {entity.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono text-text-muted bg-surface/50 backdrop-blur-sm px-2 py-0.5 rounded border border-border"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <EntitySparkline
              type={entity.type}
              slug={entity.slug}
              width={60}
              height={20}
            />
            <span className="text-xs font-mono text-circuit">
              {entity.scores.composite}
            </span>
            <GradeBadge composite={entity.scores.composite} size="sm" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
