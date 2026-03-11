import { Container, Section, Card } from "@aaas/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit — AaaS Knowledge Index",
  description:
    "Submit tools, models, agents, and skills to the AI ecosystem index via the Submission API.",
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const REQUIRED_FIELDS = [
  { field: "name", type: "string", description: "Display name of the entity" },
  { field: "type", type: "EntityType", description: '"tool" | "model" | "agent" | "skill" | "script" | "benchmark"' },
  { field: "description", type: "string", description: "Short summary (1-3 sentences)" },
  { field: "provider", type: "string", description: "Organization or author" },
  { field: "category", type: "string", description: "Primary category / channel slug" },
];

const TYPE_SPECIFIC_FIELDS: Record<string, { field: string; type: string; description: string }[]> = {
  tool: [
    { field: "sdkLanguages", type: "string[]", description: "Supported SDK languages" },
    { field: "deploymentOptions", type: "string[]", description: "Deployment targets (cloud, on-prem, edge)" },
    { field: "rateLimits", type: "string", description: "Rate limit details" },
    { field: "dataPrivacy", type: "string", description: "Data privacy posture" },
  ],
  model: [
    { field: "parameterCount", type: "string", description: "Parameter count (e.g. '70B')" },
    { field: "contextWindow", type: "string", description: "Max context length (e.g. '128k tokens')" },
    { field: "modalities", type: "string[]", description: "Supported modalities (text, image, audio)" },
    { field: "trainingDataCutoff", type: "string", description: "Training data cutoff date" },
    { field: "benchmarkScores", type: "Record<string, number>", description: "Key benchmark scores" },
  ],
  agent: [
    { field: "autonomyLevel", type: "string", description: '"supervised" | "semi-autonomous" | "fully-autonomous"' },
    { field: "toolsUsed", type: "string[]", description: "Tools the agent can invoke" },
    { field: "skills", type: "string[]", description: "Registered skill slugs" },
    { field: "trustScore", type: "number", description: "Trust score (0-100)" },
  ],
  skill: [
    { field: "supportedAgents", type: "string[]", description: "Agents that support this skill" },
    { field: "difficulty", type: "string", description: '"beginner" | "intermediate" | "advanced"' },
    { field: "prerequisites", type: "string[]", description: "Required skills or knowledge" },
    { field: "implementationGuideUrl", type: "string", description: "URL to implementation guide" },
  ],
  script: [
    { field: "language", type: "string", description: "Primary language (Python, TypeScript, etc.)" },
    { field: "dependencies", type: "string[]", description: "Package dependencies" },
    { field: "executionEnvironment", type: "string", description: "Runtime environment" },
    { field: "estimatedRuntime", type: "string", description: "Expected execution time" },
  ],
  benchmark: [
    { field: "evaluatedModels", type: "string[]", description: "Models evaluated" },
    { field: "metrics", type: "string[]", description: "Metrics measured" },
    { field: "methodology", type: "string", description: "Evaluation methodology" },
    { field: "lastRunDate", type: "string", description: "Last benchmark run date (ISO)" },
    { field: "resultsTable", type: "Record<string, Record<string, number>>", description: "Results matrix (model -> metric -> score)" },
  ],
};

const CURL_EXAMPLE = `curl -X POST https://aaas.blog/api/submit \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "name": "Cursor",
    "type": "tool",
    "description": "AI-native code editor with integrated LLM assistance.",
    "provider": "Anysphere",
    "category": "ai-code",
    "sdkLanguages": ["typescript", "python"],
    "deploymentOptions": ["desktop"],
    "rateLimits": "Varies by plan",
    "dataPrivacy": "SOC 2 compliant"
  }'`;

const RESPONSE_EXAMPLE = `{
  "id": "abc123xyz",
  "status": "pending",
  "message": "Submission received and queued for review."
}`;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SubmitPage() {
  return (
    <>
      {/* Hero */}
      <Section className="pt-28 pb-12">
        <Container className="max-w-3xl">
          <p className="text-xs font-mono uppercase tracking-wider text-circuit mb-3">
            Submission API
          </p>
          <h1 className="text-3xl font-bold text-text mb-4">
            Submit to the Knowledge Index
          </h1>
          <p className="text-text-muted leading-relaxed max-w-2xl">
            External agents and humans can programmatically submit new entities
            to the AaaS Knowledge Index. Every submission enters a review queue
            before being published. Authenticate with an API key, send a POST
            request, and we handle the rest.
          </p>
        </Container>
      </Section>

      {/* Endpoint Reference */}
      <Section className="pb-10">
        <Container className="max-w-3xl space-y-6">
          <Card>
            <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">
              Endpoint
            </h2>
            <div className="bg-surface rounded-lg p-4 font-mono text-sm text-text">
              <span className="text-circuit font-semibold">POST</span>{" "}
              https://aaas.blog/api/submit
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">
              Headers
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 pr-4 font-mono text-xs text-text-muted">Header</th>
                    <th className="pb-2 pr-4 font-mono text-xs text-text-muted">Required</th>
                    <th className="pb-2 font-mono text-xs text-text-muted">Description</th>
                  </tr>
                </thead>
                <tbody className="text-text">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 font-mono text-xs">Content-Type</td>
                    <td className="py-2 pr-4 text-xs">Yes</td>
                    <td className="py-2 text-xs text-text-muted">application/json</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs">x-api-key</td>
                    <td className="py-2 pr-4 text-xs">Yes</td>
                    <td className="py-2 text-xs text-text-muted">Your API key for authentication</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </Container>
      </Section>

      {/* Required Fields */}
      <Section className="pb-10">
        <Container className="max-w-3xl">
          <Card>
            <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">
              Required Fields
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 pr-4 font-mono text-xs text-text-muted">Field</th>
                    <th className="pb-2 pr-4 font-mono text-xs text-text-muted">Type</th>
                    <th className="pb-2 font-mono text-xs text-text-muted">Description</th>
                  </tr>
                </thead>
                <tbody className="text-text">
                  {REQUIRED_FIELDS.map((f) => (
                    <tr key={f.field} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{f.field}</td>
                      <td className="py-2 pr-4 font-mono text-xs text-circuit">{f.type}</td>
                      <td className="py-2 text-xs text-text-muted">{f.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Container>
      </Section>

      {/* Example Request & Response */}
      <Section className="pb-10">
        <Container className="max-w-3xl space-y-6">
          <Card>
            <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">
              Example Request
            </h2>
            <pre className="bg-surface rounded-lg p-4 text-xs font-mono text-text overflow-x-auto whitespace-pre">
              {CURL_EXAMPLE}
            </pre>
          </Card>

          <Card>
            <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">
              Example Response
            </h2>
            <p className="text-xs font-mono text-text-muted mb-2">201 Created</p>
            <pre className="bg-surface rounded-lg p-4 text-xs font-mono text-text overflow-x-auto whitespace-pre">
              {RESPONSE_EXAMPLE}
            </pre>
          </Card>

          <Card>
            <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">
              Error Responses
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs text-red-400 shrink-0">401</span>
                <span className="text-xs text-text-muted">Missing or empty <code className="font-mono text-text">x-api-key</code> header.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs text-red-400 shrink-0">400</span>
                <span className="text-xs text-text-muted">Validation failure &mdash; missing required fields or invalid entity type.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs text-red-400 shrink-0">500</span>
                <span className="text-xs text-text-muted">Internal server error.</span>
              </div>
            </div>
          </Card>
        </Container>
      </Section>

      {/* Type-Specific Fields */}
      <Section className="pb-20">
        <Container className="max-w-3xl space-y-6">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-circuit mb-1">
              Schema Reference
            </p>
            <h2 className="text-2xl font-bold text-text mb-2">
              Type-Specific Fields
            </h2>
            <p className="text-sm text-text-muted mb-6">
              In addition to the required fields above, each entity type accepts
              the following optional fields.
            </p>
          </div>

          {Object.entries(TYPE_SPECIFIC_FIELDS).map(([type, fields]) => (
            <Card key={type}>
              <h3 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">
                {type}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 pr-4 font-mono text-xs text-text-muted">Field</th>
                      <th className="pb-2 pr-4 font-mono text-xs text-text-muted">Type</th>
                      <th className="pb-2 font-mono text-xs text-text-muted">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-text">
                    {fields.map((f) => (
                      <tr key={f.field} className="border-b border-border/50 last:border-0">
                        <td className="py-2 pr-4 font-mono text-xs">{f.field}</td>
                        <td className="py-2 pr-4 font-mono text-xs text-circuit">{f.type}</td>
                        <td className="py-2 text-xs text-text-muted">{f.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}

          {/* API Key Note */}
          <Card>
            <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-3">
              API Key Registration
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
              API key registration and management will be available through the{" "}
              <span className="text-text font-medium">Vault</span> in a future
              update. For now, include any non-empty string as your{" "}
              <code className="font-mono text-xs text-text">x-api-key</code>{" "}
              header to authenticate submissions during the preview period.
            </p>
          </Card>
        </Container>
      </Section>
    </>
  );
}
