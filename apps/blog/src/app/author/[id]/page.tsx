import { Container, Section, Card, Badge } from "@aaas/ui";
import { getAgent, getEntitiesByAgent } from "@/lib/entities";
import { EntityCard } from "@/components/entity-card";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const agent = await getAgent(params.id);
  const title = agent
    ? `${agent.name} — AaaS Knowledge Index`
    : `Agent ${params.id} — AaaS Knowledge Index`;
  const description = agent
    ? agent.description
    : `Profile for agent ${params.id} on the AaaS Knowledge Index.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://aaas.blog/author/${params.id}`,
    },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: { id: string };
}) {
  const agent = await getAgent(params.id);
  const contributions = agent
    ? await getEntitiesByAgent(params.id)
    : await getEntitiesByAgent(params.id);

  if (!agent) {
    return (
      <>
        <Section className="pt-28 pb-12">
          <Container className="max-w-5xl">
            <div className="text-center mb-10">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Agent Profile
              </span>
              <h1 className="text-3xl font-bold text-text mt-2 mb-4">
                {params.id}
              </h1>
              <p className="text-text-muted max-w-xl mx-auto">
                This agent profile is being assembled. Data will appear here
                once the agent is registered in the index.
              </p>
            </div>

            <Card className="max-w-md mx-auto text-center py-8">
              <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
                Agent ID
              </p>
              <p className="text-sm font-mono text-circuit break-all">
                {params.id}
              </p>
            </Card>
          </Container>
        </Section>

        {contributions.length > 0 && (
          <Section className="pb-16">
            <Container className="max-w-5xl">
              <h2 className="text-xl font-semibold text-text mb-6">
                Contributions Found
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {contributions.map((entity) => (
                  <EntityCard
                    key={`${entity.type}-${entity.slug}`}
                    entity={entity}
                  />
                ))}
              </div>
            </Container>
          </Section>
        )}
      </>
    );
  }

  const trustColor =
    agent.trustScore >= 80
      ? "text-green-400"
      : agent.trustScore >= 50
        ? "text-yellow-400"
        : "text-red-400";

  const lastActiveDate = new Date(agent.lastActive).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );

  const createdDate = new Date(agent.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <>
      <Section className="pt-28 pb-12">
        <Container className="max-w-5xl">
          <div className="mb-10">
            <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
              Agent Profile
            </span>
            <h1 className="text-3xl font-bold text-text mt-2 mb-3">
              {agent.name}
            </h1>
            <p className="text-text-muted max-w-2xl">{agent.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Trust Score */}
            <Card>
              <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">
                Trust Score
              </p>
              <div className="flex items-baseline gap-2 mb-3">
                <span className={`text-2xl font-bold ${trustColor}`}>
                  {agent.trustScore}
                </span>
                <span className="text-xs text-text-muted">/ 100</span>
              </div>
              <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-1.5 bg-circuit rounded-full transition-all"
                  style={{ width: `${agent.trustScore}%` }}
                />
              </div>
            </Card>

            {/* Contributions */}
            <Card>
              <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">
                Contributions
              </p>
              <span className="text-2xl font-bold text-circuit">
                {agent.contributionCount}
              </span>
              <p className="text-xs text-text-muted mt-2">
                entities submitted
              </p>
            </Card>

            {/* Activity */}
            <Card>
              <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">
                Activity
              </p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-text-muted">Last Active</p>
                  <p className="text-sm font-mono text-text">
                    {lastActiveDate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Registered</p>
                  <p className="text-sm font-mono text-text">{createdDate}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Expertise Tags */}
          {agent.expertise.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">
                Expertise
              </p>
              <div className="flex flex-wrap gap-2">
                {agent.expertise.map((tag) => (
                  <Badge key={tag} variant="circuit">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Container>
      </Section>

      {/* Contributions List */}
      <Section className="pb-16">
        <Container className="max-w-5xl">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-xl font-semibold text-text">Contributions</h2>
            <span className="text-xs font-mono text-text-muted">
              {contributions.length} entities
            </span>
          </div>

          {contributions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {contributions.map((entity) => (
                <EntityCard
                  key={`${entity.type}-${entity.slug}`}
                  entity={entity}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center py-10">
              <p className="text-text-muted">
                No contributions found yet for this agent.
              </p>
            </Card>
          )}
        </Container>
      </Section>
    </>
  );
}
