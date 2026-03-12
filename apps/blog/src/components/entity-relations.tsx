"use client";

import { Card, Container, Section, Badge } from "@aaas/ui";
import type { Entity } from "@/lib/types";
import { EntityLink } from "./entity-link";

function RelationGroup({ label, slugs, type }: { label: string; slugs: string[]; type: string }) {
  if (slugs.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {slugs.map((slug) => (
          <EntityLink key={slug} type={type} slug={slug}>
            <Badge variant="circuit" className="cursor-pointer hover:bg-circuit/10 transition-colors">
              {slug}
            </Badge>
          </EntityLink>
        ))}
      </div>
    </div>
  );
}

export function EntityRelations({ entity }: { entity: Entity }) {
  const hasRelations =
    entity.relatedTools.length > 0 ||
    entity.relatedModels.length > 0 ||
    entity.relatedAgents.length > 0 ||
    entity.relatedSkills.length > 0;

  if (!hasRelations) return null;

  return (
    <Section className="py-8">
      <Container className="max-w-4xl">
        <Card>
          <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-6">
            Related Entities
          </h2>
          <div className="space-y-4">
            <RelationGroup label="Tools" slugs={entity.relatedTools} type="tool" />
            <RelationGroup label="Models" slugs={entity.relatedModels} type="model" />
            <RelationGroup label="Agents" slugs={entity.relatedAgents} type="agent" />
            <RelationGroup label="Skills" slugs={entity.relatedSkills} type="skill" />
          </div>
        </Card>
      </Container>
    </Section>
  );
}
