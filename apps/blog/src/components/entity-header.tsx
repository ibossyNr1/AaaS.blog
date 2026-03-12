import { Badge, Container, Section } from "@aaas/ui";
import type { Entity } from "@/lib/types";
import { ENTITY_TYPES } from "@/lib/types";
import { getChannelName } from "@/lib/channels";
import { computeDetailedGrades } from "@/lib/grades";
import { GradeBadge } from "@/components/grade-badge";
import { WatchButton } from "./watch-button";
import { PrintButton } from "./print-button";
import { FollowButton } from "./follow-button";
import { EntitySparkline } from "@/components/entity-sparkline";

export function EntityHeader({ entity }: { entity: Entity }) {
  const typeInfo = ENTITY_TYPES[entity.type];
  const { overall, dimensions } = computeDetailedGrades(entity.scores);

  return (
    <Section className="pt-28 pb-8">
      <Container className="max-w-4xl">
        <div className="flex items-center gap-3 mb-4">
          <Badge variant="circuit">{typeInfo.label}</Badge>
          <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
            {getChannelName(entity.category)}
          </span>
          <span className="text-xs text-text-muted">
            v{entity.version}
          </span>
          <WatchButton type={entity.type} slug={entity.slug} name={entity.name} />
          <FollowButton type="entity" id={`${entity.type}:${entity.slug}`} name={entity.name} />
          <PrintButton />
          <a
            href={`/api/entity/${entity.type}/${entity.slug}/feed`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-border text-text-muted hover:text-circuit hover:border-circuit transition-colors"
            title="Changelog RSS Feed"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="6.18" cy="17.82" r="2.18" />
              <path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z" />
            </svg>
          </a>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-text mb-2">
          {entity.name}
        </h1>
        <p className="text-sm text-text-muted mb-4">
          by {entity.provider} · {entity.pricingModel} · Last verified {entity.lastVerified}
        </p>
        <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
          {entity.description}
        </p>
        {entity.url && (
          <a
            href={entity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-sm text-circuit hover:underline font-mono"
          >
            {entity.url} ↗
          </a>
        )}
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <GradeBadge composite={entity.scores.composite} size="lg" />
            <div>
              <span className={`text-lg font-bold font-mono ${overall.color}`}>
                {overall.letter}
              </span>
              <span className="text-text-muted mx-2">—</span>
              <span className="text-text">{overall.label}</span>
            </div>
            <EntitySparkline
              type={entity.type}
              slug={entity.slug}
              width={120}
              height={32}
              className="ml-2"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {dimensions.map((d) => (
              <span
                key={d.key}
                className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full ${d.grade.bgColor} ${d.grade.color}`}
              >
                {d.label}: {d.grade.letter}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
