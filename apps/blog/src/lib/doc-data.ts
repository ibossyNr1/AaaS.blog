/**
 * Centralized documentation data for the docs pages.
 */

export interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  auth?: string;
  category: string;
}

export const API_ENDPOINTS: ApiEndpoint[] = [
  // Entities
  { method: "GET", path: "/api/entities", description: "List entities with optional filters", category: "Entities" },
  { method: "GET", path: "/api/entity/:type/:slug", description: "Get a single entity by type and slug", category: "Entities" },
  { method: "POST", path: "/api/submit", description: "Submit a new entity for review", auth: "x-user-id", category: "Entities" },

  // Search
  { method: "GET", path: "/api/search", description: "Full-text keyword search", category: "Search" },
  { method: "POST", path: "/api/search/semantic", description: "Semantic vector search", category: "Search" },
  { method: "POST", path: "/api/search/hybrid", description: "Hybrid search (semantic + keyword)", category: "Search" },

  // AI
  { method: "POST", path: "/api/ai/query", description: "Conversational AI query", auth: "x-user-id", category: "AI" },
  { method: "POST", path: "/api/ai/suggest", description: "Get query suggestions", category: "AI" },

  // Discovery
  { method: "GET", path: "/api/discover/clusters", description: "Get entity clusters", category: "Discovery" },
  { method: "GET", path: "/api/discover/topics", description: "Get topic map", category: "Discovery" },
  { method: "GET", path: "/api/discover/paths", description: "Get discovery paths", category: "Discovery" },
  { method: "GET", path: "/api/discover/suggestions", description: "Get personalized suggestions", auth: "x-user-id", category: "Discovery" },

  // Recommendations
  { method: "GET", path: "/api/recommendations", description: "Get collaborative recommendations", auth: "x-user-id", category: "Recommendations" },
  { method: "GET", path: "/api/recommendations/similar-users", description: "Get similar user stats", auth: "x-user-id", category: "Recommendations" },

  // Analytics
  { method: "GET", path: "/api/analytics/snapshot", description: "Get analytics snapshot", auth: "x-api-key", category: "Analytics" },
  { method: "GET", path: "/api/analytics/timeseries", description: "Get entity time series data", auth: "x-api-key", category: "Analytics" },
  { method: "GET", path: "/api/analytics/search-trends", description: "Get search trend data", auth: "x-api-key", category: "Analytics" },

  // Webhooks
  { method: "GET", path: "/api/webhooks/v2", description: "List webhooks", auth: "x-api-key", category: "Webhooks" },
  { method: "POST", path: "/api/webhooks/v2", description: "Create a webhook", auth: "x-api-key", category: "Webhooks" },
  { method: "GET", path: "/api/webhooks/v2/:id", description: "Get webhook details + deliveries", auth: "x-api-key", category: "Webhooks" },
  { method: "PUT", path: "/api/webhooks/v2/:id", description: "Update webhook", auth: "x-api-key", category: "Webhooks" },
  { method: "DELETE", path: "/api/webhooks/v2/:id", description: "Delete webhook", auth: "x-api-key", category: "Webhooks" },

  // Notifications
  { method: "GET", path: "/api/notifications", description: "Get user notifications", auth: "x-user-id", category: "Notifications" },
  { method: "POST", path: "/api/notifications/read", description: "Mark notification as read", auth: "x-user-id", category: "Notifications" },
  { method: "POST", path: "/api/notifications/read-all", description: "Mark all notifications as read", auth: "x-user-id", category: "Notifications" },

  // Achievements
  { method: "GET", path: "/api/achievements", description: "Get user achievements", auth: "x-user-id", category: "Achievements" },
  { method: "GET", path: "/api/achievements/leaderboard", description: "Get achievement leaderboard", category: "Achievements" },

  // Workspaces
  { method: "GET", path: "/api/workspaces", description: "List workspaces", auth: "x-user-id", category: "Workspaces" },
  { method: "POST", path: "/api/workspaces", description: "Create workspace", auth: "x-user-id", category: "Workspaces" },

  // Collections
  { method: "GET", path: "/api/collections", description: "List public collections", category: "Collections" },
  { method: "POST", path: "/api/collections", description: "Create collection", auth: "x-user-id", category: "Collections" },

  // API Keys
  { method: "GET", path: "/api/keys", description: "List API keys", auth: "x-user-id", category: "API Keys" },
  { method: "POST", path: "/api/keys", description: "Create API key", auth: "x-user-id", category: "API Keys" },

  // System
  { method: "GET", path: "/api/health", description: "Health check", category: "System" },
  { method: "GET", path: "/api/health/ready", description: "Readiness probe", category: "System" },
  { method: "GET", path: "/api/agents/status", description: "Agent status overview", category: "System" },
  { method: "GET", path: "/api/docs/openapi", description: "OpenAPI 3.0.3 specification", category: "System" },
];

export interface AgentInfo {
  name: string;
  file: string;
  schedule: string;
  description: string;
  category: string;
}

export const AGENTS: AgentInfo[] = [
  // Core
  { name: "Audit Agent", file: "audit-agent.ts", schedule: "Daily", description: "Validates entity data integrity and flags issues", category: "Core" },
  { name: "Health Agent", file: "health-agent.ts", schedule: "Daily", description: "Monitors system health metrics and alerts", category: "Core" },
  { name: "Heal Agent", file: "heal-agent.ts", schedule: "Daily", description: "Auto-fixes common data issues found by audit", category: "Core" },
  { name: "Enrich Agent", file: "enrich-agent.ts", schedule: "Daily", description: "Enriches entities with additional metadata", category: "Core" },
  { name: "Summary Agent", file: "summary-agent.ts", schedule: "Daily", description: "Generates entity summaries and descriptions", category: "Core" },
  // Freshness
  { name: "Freshness Agent", file: "freshness-agent.ts", schedule: "Daily", description: "Checks data staleness and triggers updates", category: "Freshness" },
  { name: "Changelog Agent", file: "changelog-agent.ts", schedule: "Daily", description: "Tracks and records entity changes", category: "Freshness" },
  { name: "Validate Links Agent", file: "validate-links-agent.ts", schedule: "Daily", description: "Validates external links in entity data", category: "Freshness" },
  // Ranking
  { name: "Rank Agent", file: "rank-agent.ts", schedule: "Daily", description: "Calculates entity relevance scores", category: "Ranking" },
  { name: "Views Agent", file: "views-agent.ts", schedule: "Daily", description: "Aggregates and processes view counts", category: "Ranking" },
  { name: "Trending Agent", file: "trending-agent.ts", schedule: "Daily", description: "Identifies trending entities", category: "Ranking" },
  // Classification
  { name: "Categorize Agent", file: "categorize-agent.ts", schedule: "Daily", description: "Auto-categorizes and tags entities", category: "Classification" },
  { name: "Similarity Agent", file: "similarity-agent.ts", schedule: "Daily", description: "Computes entity similarity scores", category: "Classification" },
  // Intelligence
  { name: "Embedding Agent", file: "embedding-agent.ts", schedule: "Daily", description: "Syncs entity vectors to Pinecone", category: "Intelligence" },
  { name: "Clustering Agent", file: "clustering-agent.ts", schedule: "Weekly", description: "Groups entities into semantic clusters", category: "Intelligence" },
  { name: "Discovery Agent", file: "discovery-agent.ts", schedule: "Daily", description: "Generates personalized discovery suggestions", category: "Intelligence" },
  // Comparison
  { name: "Comparison Agent", file: "comparison-agent.ts", schedule: "Daily", description: "Generates entity comparison data", category: "Comparison" },
  // Media
  { name: "Media Agent", file: "media-agent.ts", schedule: "Daily", description: "Processes media assets for entities", category: "Media" },
  { name: "Audio Agent", file: "audio-agent.ts", schedule: "Daily", description: "Generates audio content for entities", category: "Media" },
  { name: "Video Agent", file: "video-agent.ts", schedule: "Daily", description: "Processes video content for entities", category: "Media" },
  { name: "Metadata Agent", file: "metadata-agent.ts", schedule: "Daily", description: "Extracts and enriches metadata", category: "Media" },
  // Pipeline
  { name: "Ingest Agent", file: "ingest-agent.ts", schedule: "Daily", description: "Ingests data from external sources", category: "Pipeline" },
  { name: "Auto Review Agent", file: "auto-review-agent.ts", schedule: "Daily", description: "Auto-reviews submitted entities", category: "Pipeline" },
  { name: "Webhook Agent", file: "webhook-agent.ts", schedule: "Daily", description: "Processes pending webhook deliveries", category: "Pipeline" },
  // Analytics
  { name: "Search Analytics Agent", file: "search-analytics-agent.ts", schedule: "Daily", description: "Analyzes search patterns and trends", category: "Analytics" },
  { name: "Anomaly Agent", file: "anomaly-agent.ts", schedule: "Daily", description: "Detects data and traffic anomalies", category: "Analytics" },
  { name: "Reporting Agent", file: "reporting-agent.ts", schedule: "Weekly", description: "Generates system-wide reports", category: "Analytics" },
  // Engagement
  { name: "Subscription Agent", file: "subscription-agent.ts", schedule: "Daily", description: "Manages user subscriptions", category: "Engagement" },
  { name: "Digest Agent", file: "digest-agent.ts", schedule: "Daily", description: "Compiles daily digest content", category: "Engagement" },
  { name: "Digest Email Agent", file: "digest-email-agent.ts", schedule: "Daily", description: "Sends digest emails to subscribers", category: "Engagement" },
  { name: "Alerting Agent", file: "alerting-agent.ts", schedule: "Daily", description: "Sends alerts based on subscriptions", category: "Engagement" },
];

export interface CollectionInfo {
  name: string;
  description: string;
  keyFields: string[];
}

export const FIRESTORE_COLLECTIONS: CollectionInfo[] = [
  { name: "tools", description: "Tool entities", keyFields: ["slug", "name", "category", "score"] },
  { name: "models", description: "Model entities", keyFields: ["slug", "name", "provider", "score"] },
  { name: "agents", description: "Agent entities", keyFields: ["slug", "name", "type", "score"] },
  { name: "skills", description: "Skill entities", keyFields: ["slug", "name", "category", "score"] },
  { name: "scripts", description: "Script entities", keyFields: ["slug", "name", "language", "score"] },
  { name: "benchmarks", description: "Benchmark entities", keyFields: ["slug", "name", "domain", "score"] },
  { name: "entity_views", description: "View tracking", keyFields: ["entityType", "entitySlug", "count"] },
  { name: "search_queries", description: "Search analytics", keyFields: ["query", "resultCount", "timestamp"] },
  { name: "agent_logs", description: "Agent execution logs", keyFields: ["agent", "status", "timestamp"] },
  { name: "api_keys", description: "API key records", keyFields: ["key", "userId", "name", "permissions"] },
  { name: "submissions", description: "Entity submissions", keyFields: ["type", "status", "submittedBy"] },
  { name: "changelogs", description: "Entity change history", keyFields: ["entityType", "entitySlug", "changes"] },
  { name: "digests", description: "Daily digest content", keyFields: ["date", "entities", "stats"] },
  { name: "subscriptions", description: "User subscriptions", keyFields: ["userId", "entityType", "entitySlug"] },
  { name: "events", description: "System events timeline", keyFields: ["type", "data", "timestamp"] },
  { name: "comparisons", description: "Entity comparison data", keyFields: ["entityA", "entityB", "dimensions"] },
  { name: "user_behavior", description: "User behavior vectors", keyFields: ["userId", "dimensions", "updatedAt"] },
  { name: "clusters", description: "Entity clusters", keyFields: ["entities", "centroid", "label"] },
  { name: "discovery_suggestions", description: "Personalized suggestions", keyFields: ["userId", "entities", "reason"] },
  { name: "ai_conversations", description: "AI query history", keyFields: ["userId", "messages", "intent"] },
  { name: "analytics_snapshots", description: "Analytics snapshots", keyFields: ["period", "metrics", "timestamp"] },
  { name: "anomalies", description: "Detected anomalies", keyFields: ["type", "severity", "data"] },
  { name: "experiments", description: "A/B experiments", keyFields: ["name", "variants", "status"] },
  { name: "experiment_assignments", description: "User experiment assignments", keyFields: ["experimentId", "userId", "variant"] },
  { name: "system_reports", description: "Weekly system reports", keyFields: ["period", "summary", "metrics"] },
  { name: "workspaces", description: "Multi-tenant workspaces", keyFields: ["slug", "name", "ownerId"] },
  { name: "workspace_members", description: "Workspace memberships", keyFields: ["workspaceId", "userId", "role"] },
  { name: "workspace_themes", description: "Custom workspace themes", keyFields: ["workspaceId", "colors", "logo"] },
  { name: "collections", description: "Entity collections", keyFields: ["name", "ownerId", "entityIds"] },
  { name: "bookmarks", description: "User bookmarks", keyFields: ["userId", "entityType", "entitySlug"] },
  { name: "notifications", description: "User notifications", keyFields: ["userId", "type", "read"] },
  { name: "notification_preferences", description: "Notification settings", keyFields: ["userId", "channels", "mutedTypes"] },
  { name: "plugins", description: "Integration plugins", keyFields: ["pluginId", "workspaceId", "config"] },
  { name: "webhooks_v2", description: "Webhook endpoints", keyFields: ["url", "events", "secret"] },
  { name: "webhook_deliveries_v2", description: "Webhook delivery logs", keyFields: ["webhookId", "status", "attempts"] },
  { name: "achievements", description: "Achievement definitions", keyFields: ["id", "name", "category", "tier"] },
  { name: "user_achievements", description: "User achievement progress", keyFields: ["userId", "achievementId", "completed"] },
  { name: "user_progress", description: "User action counts", keyFields: ["userId", "type", "count"] },
];
