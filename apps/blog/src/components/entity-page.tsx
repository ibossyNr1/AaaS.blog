import { notFound } from "next/navigation";
import { Section, Container, Button } from "@aaas/ui";
import type { EntityType } from "@/lib/types";
import { ENTITY_TYPES } from "@/lib/types";
import { getEntity } from "@/lib/entities";
import { Breadcrumbs } from "./breadcrumbs";
import { EntityHeader } from "./entity-header";
import { EntitySchemaTable } from "./entity-schema-table";
import { EntityScores } from "./entity-scores";
import { EntityRelations } from "./entity-relations";
import { RelationshipEditor } from "./relationship-editor";
import { EntityJsonLd } from "./entity-json-ld";
import { ScoreHistoryChart } from "./score-history-chart";
import { EntityChangelog } from "./entity-changelog";
import { EntityDiffViewer } from "./entity-diff-viewer";
import { SimilarEntities } from "./similar-entities";
import { EntityComments } from "./entity-comments";
import { EntityLinkPreview } from "./entity-link-preview";
import { EntitySummary } from "./entity-summary";
import { EntityViewTracker } from "./entity-view-tracker";
import { LazySection } from "./lazy-section";

interface EntityPageProps {
  type: EntityType;
  slug: string;
}

export async function EntityPage({ type, slug }: EntityPageProps) {
  const entity = await getEntity(type, slug);
  if (!entity) return notFound();

  const typeInfo = ENTITY_TYPES[type];

  return (
    <>
      <EntityViewTracker type={type} slug={slug} />
      <EntityJsonLd entity={entity} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: typeInfo.plural, href: `/explore?type=${type}` },
          { label: entity.name },
        ]}
      />
      <EntityHeader entity={entity} />
      {entity.url && entity.url !== "[unverified]" && (
        <EntityLinkPreview type={type} slug={slug} />
      )}
      <EntitySchemaTable entity={entity} />
      <EntitySummary type={type} slug={slug} />
      <EntityScores entity={entity} />
      <LazySection>
        <ScoreHistoryChart type={type} slug={slug} />
      </LazySection>
      <LazySection>
        <EntityRelations entity={entity} />
      </LazySection>
      <LazySection>
        <Section className="py-8" data-print-hide>
          <Container className="max-w-4xl">
            <RelationshipEditor entity={entity} />
          </Container>
        </Section>
      </LazySection>
      <LazySection>
        <EntityChangelog type={type} slug={slug} />
      </LazySection>
      <LazySection>
        <EntityDiffViewer type={type} slug={slug} />
      </LazySection>
      <LazySection>
        <SimilarEntities type={type} slug={slug} />
      </LazySection>
      <LazySection>
        <div data-print-hide>
          <EntityComments type={type} slug={slug} />
        </div>
      </LazySection>
      <Section variant="surface" className="py-12" data-print-hide>
        <Container className="max-w-4xl text-center">
          <p className="text-text-muted mb-4">
            Explore the full AI ecosystem on Agents as a Service
          </p>
          <a href="https://agents-as-a-service.com/vault" target="_blank" rel="noopener noreferrer">
            <Button variant="secondary">Subscribe via Vault →</Button>
          </a>
        </Container>
      </Section>
    </>
  );
}
