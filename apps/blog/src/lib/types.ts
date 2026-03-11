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

/** Persona types for role-based personalization */
export type Persona = "developer" | "researcher" | "executive" | "agent-builder" | "enterprise";

export const PERSONAS: Record<Persona, { label: string; description: string; channels: string[] }> = {
  developer: {
    label: "Developer",
    description: "Building with AI tools, SDKs, and APIs",
    channels: ["ai-tools", "ai-code", "ai-agents", "llms"],
  },
  researcher: {
    label: "Researcher",
    description: "Exploring models, benchmarks, and frontier research",
    channels: ["llms", "computer-vision", "speech-audio", "ai-safety"],
  },
  executive: {
    label: "Executive",
    description: "AI strategy, ROI, and business applications",
    channels: ["ai-business", "ai-infrastructure", "ai-safety"],
  },
  "agent-builder": {
    label: "Agent Builder",
    description: "Designing and deploying autonomous AI agents",
    channels: ["ai-agents", "ai-tools", "ai-code", "llms"],
  },
  enterprise: {
    label: "Enterprise",
    description: "AI infrastructure, governance, and scale deployment",
    channels: ["ai-infrastructure", "ai-business", "ai-safety", "ai-tools"],
  },
};

/** Registered agent identity for submissions and profiles */
export interface RegisteredAgent {
  id: string;
  name: string;
  description: string;
  trustScore: number;
  contributionCount: number;
  expertise: string[];
  createdAt: string;
  lastActive: string;
}

/** Submission status for the review pipeline */
export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface EntitySubmission {
  id: string;
  entity: Partial<BaseEntity>;
  submittedBy: string;
  submittedAt: string;
  status: SubmissionStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}
