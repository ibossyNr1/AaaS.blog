import { notFound } from "next/navigation";
import { Section, Container, Button } from "@aaas/ui";
import type { EntityType } from "@/lib/types";
import { getEntity } from "@/lib/entities";
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

interface EntityPageProps {
  type: EntityType;
  slug: string;
}

export async function EntityPage({ type, slug }: EntityPageProps) {
  const entity = await getEntity(type, slug);
  if (!entity) return notFound();

  return (
    <>
      <EntityJsonLd entity={entity} />
      <EntityHeader entity={entity} />
      <EntitySchemaTable entity={entity} />
      <EntityScores entity={entity} />
      <ScoreHistoryChart type={type} slug={slug} />
      <EntityRelations entity={entity} />
      <Section className="py-8">
        <Container className="max-w-4xl">
          <RelationshipEditor entity={entity} />
        </Container>
      </Section>
      <EntityChangelog type={type} slug={slug} />
      <EntityDiffViewer type={type} slug={slug} />
      <SimilarEntities type={type} slug={slug} />
      <Section variant="surface" className="py-12">
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
