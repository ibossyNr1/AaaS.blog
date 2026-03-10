/** Score breakdown for leaderboard ranking */
export interface EntityScores {
  adoption: number;    // 0-100
  quality: number;     // 0-100
  freshness: number;   // 0-100
  citations: number;   // 0-100
  engagement: number;  // 0-100, from PostHog analytics
  composite: number;   // Weighted: adoption*0.4 + citations*0.25 + quality*0.2 + engagement*0.15
}

/** Base fields shared by all entity types */
export interface BaseEntity {
  slug: string;
  type: EntityType;
  name: string;
  category: string;
  tags: string[];
  description: string;
  provider: string;
  version: string;
  pricingModel: "free" | "freemium" | "paid" | "open-source";
  license: string;
  url: string;
  apiAvailable: boolean;
  apiDocsUrl: string;
  capabilities: string[];
  integrations: string[];
  useCases: string[];
  relatedTools: string[];
  relatedModels: string[];
  relatedAgents: string[];
  relatedSkills: string[];
  scores: EntityScores;
  schemaCompleteness: number;
  lastVerified: string;
  lastUpdated: string;
  addedDate: string;
  addedBy: string;
  // Note: changelog is stored as a Firestore subcollection, not on the entity document.
}

export type EntityType = "tool" | "model" | "agent" | "skill" | "script" | "benchmark";

export interface ToolEntity extends BaseEntity {
  type: "tool";
  sdkLanguages: string[];
  deploymentOptions: string[];
  rateLimits: string;
  dataPrivacy: string;
}

export interface ModelEntity extends BaseEntity {
  type: "model";
  parameterCount: string;
  contextWindow: string;
  modalities: string[];
  trainingDataCutoff: string;
  benchmarkScores: Record<string, number>;
}

export interface AgentEntity extends BaseEntity {
  type: "agent";
  autonomyLevel: "supervised" | "semi-autonomous" | "fully-autonomous";
  toolsUsed: string[];
  skills: string[];
  trustScore: number;
  contributionCount: number;
}

export interface SkillEntity extends BaseEntity {
  type: "skill";
  supportedAgents: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  prerequisites: string[];
  implementationGuideUrl: string;
}

export interface ScriptEntity extends BaseEntity {
  type: "script";
  language: string;
  dependencies: string[];
  executionEnvironment: string;
  estimatedRuntime: string;
}

export interface BenchmarkEntity extends BaseEntity {
  type: "benchmark";
  evaluatedModels: string[];
  metrics: string[];
  methodology: string;
  lastRunDate: string;
  resultsTable: Record<string, Record<string, number>>;
}

export type Entity = ToolEntity | ModelEntity | AgentEntity | SkillEntity | ScriptEntity | BenchmarkEntity;

export const ENTITY_TYPES: Record<EntityType, { label: string; plural: string; color: string }> = {
  tool: { label: "Tool", plural: "Tools", color: "blue" },
  model: { label: "Model", plural: "Models", color: "purple" },
  agent: { label: "Agent", plural: "Agents", color: "green" },
  skill: { label: "Skill", plural: "Skills", color: "gold" },
  script: { label: "Script", plural: "Scripts", color: "pink" },
  benchmark: { label: "Benchmark", plural: "Benchmarks", color: "circuit" },
};

export interface Channel {
  slug: string;
  name: string;
  description: string;
  entityCount: number;
}
