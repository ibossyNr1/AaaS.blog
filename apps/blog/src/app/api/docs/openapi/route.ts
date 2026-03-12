export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

function generateOpenAPISpec() {
  return {
    openapi: "3.0.3",
    info: {
      title: "AaaS Knowledge Index API",
      description:
        "Schema-first AI ecosystem database cataloging tools, models, agents, skills, scripts, and benchmarks.",
      version: "2.0.0",
      contact: { name: "AaaS", url: "https://aaas.blog" },
    },
    servers: [
      { url: "https://aaas.blog", description: "Production" },
      { url: "http://localhost:3000", description: "Local development" },
    ],
    security: [],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description: "API key for analytics, webhook, and admin endpoints",
        },
        UserAuth: {
          type: "apiKey",
          in: "header",
          name: "x-user-id",
          description: "User identifier for user-scoped endpoints",
        },
      },
      schemas: {
        Entity: {
          type: "object",
          properties: {
            slug: { type: "string", example: "gpt-4o" },
            name: { type: "string", example: "GPT-4o" },
            description: { type: "string" },
            category: { type: "string" },
            score: { type: "number", example: 92 },
            tags: { type: "array", items: { type: "string" } },
            metadata: { type: "object" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        EntityList: {
          type: "object",
          properties: {
            entities: { type: "array", items: { $ref: "#/components/schemas/Entity" } },
            total: { type: "integer" },
            page: { type: "integer" },
            pageSize: { type: "integer" },
          },
        },
        SearchResult: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  entity: { $ref: "#/components/schemas/Entity" },
                  score: { type: "number" },
                  highlights: { type: "array", items: { type: "string" } },
                },
              },
            },
            query: { type: "string" },
            total: { type: "integer" },
          },
        },
        SemanticSearchRequest: {
          type: "object",
          required: ["query"],
          properties: {
            query: { type: "string", example: "best language models for code generation" },
            topK: { type: "integer", default: 10 },
            types: { type: "array", items: { type: "string" } },
          },
        },
        HybridSearchRequest: {
          type: "object",
          required: ["query"],
          properties: {
            query: { type: "string" },
            topK: { type: "integer", default: 10 },
            alpha: { type: "number", default: 0.5, description: "Weight between semantic (1.0) and keyword (0.0)" },
            types: { type: "array", items: { type: "string" } },
          },
        },
        AiQueryRequest: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", example: "What are the top code generation models?" },
            conversationId: { type: "string" },
          },
        },
        AiQueryResponse: {
          type: "object",
          properties: {
            answer: { type: "string" },
            sources: { type: "array", items: { $ref: "#/components/schemas/Entity" } },
            conversationId: { type: "string" },
            intent: { type: "string" },
          },
        },
        AiSuggestResponse: {
          type: "object",
          properties: {
            suggestions: { type: "array", items: { type: "string" } },
          },
        },
        Webhook: {
          type: "object",
          properties: {
            id: { type: "string" },
            url: { type: "string", format: "uri" },
            events: { type: "array", items: { type: "string" } },
            secret: { type: "string" },
            active: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        WebhookCreate: {
          type: "object",
          required: ["url", "events"],
          properties: {
            url: { type: "string", format: "uri" },
            events: { type: "array", items: { type: "string" }, example: ["entity.created", "entity.updated"] },
            secret: { type: "string" },
          },
        },
        WebhookUpdate: {
          type: "object",
          properties: {
            url: { type: "string", format: "uri" },
            events: { type: "array", items: { type: "string" } },
            active: { type: "boolean" },
          },
        },
        Notification: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { type: "string" },
            title: { type: "string" },
            body: { type: "string" },
            read: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Achievement: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            tier: { type: "string", enum: ["bronze", "silver", "gold", "platinum"] },
            completed: { type: "boolean" },
            progress: { type: "number" },
          },
        },
        Workspace: {
          type: "object",
          properties: {
            id: { type: "string" },
            slug: { type: "string" },
            name: { type: "string" },
            ownerId: { type: "string" },
            memberCount: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        WorkspaceCreate: {
          type: "object",
          required: ["name", "slug"],
          properties: {
            name: { type: "string" },
            slug: { type: "string" },
          },
        },
        ApiKey: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            key: { type: "string", description: "Only returned on creation" },
            permissions: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        ApiKeyCreate: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            permissions: { type: "array", items: { type: "string" }, default: ["read"] },
          },
        },
        HealthResponse: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["healthy", "degraded", "down"] },
            uptime: { type: "number" },
            firestoreLatency: { type: "number" },
            memoryUsage: { type: "object", properties: { heapUsed: { type: "number" }, heapTotal: { type: "number" }, rss: { type: "number" } } },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        RecommendationResponse: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  entity: { $ref: "#/components/schemas/Entity" },
                  score: { type: "number" },
                  reason: { type: "string" },
                },
              },
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
          },
        },
      },
    },
    paths: {
      "/api/entities": {
        get: {
          tags: ["Entities"],
          summary: "List entities",
          description: "Returns paginated entities with optional type, category, and sort filters.",
          parameters: [
            { name: "type", in: "query", schema: { type: "string", enum: ["tool", "model", "agent", "skill", "script", "benchmark"] } },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "sort", in: "query", schema: { type: "string", enum: ["score", "name", "createdAt", "updatedAt"] } },
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "pageSize", in: "query", schema: { type: "integer", default: 20 } },
          ],
          responses: {
            "200": { description: "Entity list", content: { "application/json": { schema: { $ref: "#/components/schemas/EntityList" } } } },
          },
        },
      },
      "/api/entity/{type}/{slug}": {
        get: {
          tags: ["Entities"],
          summary: "Get entity",
          description: "Returns a single entity by type and slug.",
          parameters: [
            { name: "type", in: "path", required: true, schema: { type: "string" } },
            { name: "slug", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Entity details", content: { "application/json": { schema: { $ref: "#/components/schemas/Entity" } } } },
            "404": { description: "Entity not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/api/search": {
        get: {
          tags: ["Search"],
          summary: "Keyword search",
          description: "Full-text keyword search across all entity types.",
          parameters: [
            { name: "q", in: "query", required: true, schema: { type: "string" } },
            { name: "type", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          ],
          responses: {
            "200": { description: "Search results", content: { "application/json": { schema: { $ref: "#/components/schemas/SearchResult" } } } },
          },
        },
      },
      "/api/search/semantic": {
        post: {
          tags: ["Search"],
          summary: "Semantic search",
          description: "Vector-based semantic search using Pinecone embeddings.",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SemanticSearchRequest" } } } },
          responses: {
            "200": { description: "Search results", content: { "application/json": { schema: { $ref: "#/components/schemas/SearchResult" } } } },
          },
        },
      },
      "/api/search/hybrid": {
        post: {
          tags: ["Search"],
          summary: "Hybrid search",
          description: "Combined semantic + keyword search with configurable alpha weighting.",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/HybridSearchRequest" } } } },
          responses: {
            "200": { description: "Search results", content: { "application/json": { schema: { $ref: "#/components/schemas/SearchResult" } } } },
          },
        },
      },
      "/api/keys": {
        get: {
          tags: ["API Keys"],
          summary: "List API keys",
          security: [{ UserAuth: [] }],
          responses: {
            "200": { description: "List of API keys", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/ApiKey" } } } } },
            "401": { description: "Unauthorized" },
          },
        },
        post: {
          tags: ["API Keys"],
          summary: "Create API key",
          security: [{ UserAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ApiKeyCreate" } } } },
          responses: {
            "201": { description: "Created API key (includes secret)", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiKey" } } } },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/api/webhooks/v2": {
        get: {
          tags: ["Webhooks"],
          summary: "List webhooks",
          security: [{ ApiKeyAuth: [] }],
          responses: {
            "200": { description: "Webhook list", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Webhook" } } } } },
            "401": { description: "Unauthorized" },
          },
        },
        post: {
          tags: ["Webhooks"],
          summary: "Create webhook",
          security: [{ ApiKeyAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/WebhookCreate" } } } },
          responses: {
            "201": { description: "Created webhook", content: { "application/json": { schema: { $ref: "#/components/schemas/Webhook" } } } },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/api/webhooks/v2/{id}": {
        get: {
          tags: ["Webhooks"],
          summary: "Get webhook details",
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Webhook with delivery history", content: { "application/json": { schema: { $ref: "#/components/schemas/Webhook" } } } },
            "404": { description: "Not found" },
          },
        },
        put: {
          tags: ["Webhooks"],
          summary: "Update webhook",
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/WebhookUpdate" } } } },
          responses: {
            "200": { description: "Updated webhook", content: { "application/json": { schema: { $ref: "#/components/schemas/Webhook" } } } },
            "404": { description: "Not found" },
          },
        },
        delete: {
          tags: ["Webhooks"],
          summary: "Delete webhook",
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "204": { description: "Deleted" },
            "404": { description: "Not found" },
          },
        },
      },
      "/api/notifications": {
        get: {
          tags: ["Notifications"],
          summary: "Get notifications",
          security: [{ UserAuth: [] }],
          parameters: [
            { name: "unread", in: "query", schema: { type: "boolean" } },
            { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
          ],
          responses: {
            "200": { description: "Notification list", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Notification" } } } } },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/api/achievements": {
        get: {
          tags: ["Achievements"],
          summary: "Get achievements",
          security: [{ UserAuth: [] }],
          responses: {
            "200": { description: "Achievement list", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Achievement" } } } } },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/api/workspaces": {
        get: {
          tags: ["Workspaces"],
          summary: "List workspaces",
          security: [{ UserAuth: [] }],
          responses: {
            "200": { description: "Workspace list", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Workspace" } } } } },
            "401": { description: "Unauthorized" },
          },
        },
        post: {
          tags: ["Workspaces"],
          summary: "Create workspace",
          security: [{ UserAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/WorkspaceCreate" } } } },
          responses: {
            "201": { description: "Created workspace", content: { "application/json": { schema: { $ref: "#/components/schemas/Workspace" } } } },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/api/health": {
        get: {
          tags: ["System"],
          summary: "Health check",
          description: "Returns system health status, Firestore latency, memory usage, and uptime.",
          responses: {
            "200": { description: "Health status", content: { "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } } } },
          },
        },
      },
      "/api/health/ready": {
        get: {
          tags: ["System"],
          summary: "Readiness probe",
          description: "Returns 200 if the service is ready to accept traffic.",
          responses: {
            "200": { description: "Ready" },
            "503": { description: "Not ready" },
          },
        },
      },
      "/api/ai/query": {
        post: {
          tags: ["AI"],
          summary: "AI conversational query",
          description: "Ask a natural-language question about entities in the knowledge index.",
          security: [{ UserAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/AiQueryRequest" } } } },
          responses: {
            "200": { description: "AI response with sources", content: { "application/json": { schema: { $ref: "#/components/schemas/AiQueryResponse" } } } },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/api/ai/suggest": {
        post: {
          tags: ["AI"],
          summary: "Query suggestions",
          description: "Get AI-generated query suggestions based on partial input.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { partial: { type: "string" } },
                  required: ["partial"],
                },
              },
            },
          },
          responses: {
            "200": { description: "Suggestions", content: { "application/json": { schema: { $ref: "#/components/schemas/AiSuggestResponse" } } } },
          },
        },
      },
      "/api/recommendations": {
        get: {
          tags: ["Recommendations"],
          summary: "Get recommendations",
          description: "Collaborative filtering recommendations based on user behavior.",
          security: [{ UserAuth: [] }],
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          ],
          responses: {
            "200": { description: "Recommendations", content: { "application/json": { schema: { $ref: "#/components/schemas/RecommendationResponse" } } } },
            "401": { description: "Unauthorized" },
          },
        },
      },
    },
    tags: [
      { name: "Entities", description: "Entity CRUD operations" },
      { name: "Search", description: "Keyword, semantic, and hybrid search" },
      { name: "AI", description: "Conversational AI and suggestions" },
      { name: "Recommendations", description: "Personalized recommendations" },
      { name: "Webhooks", description: "Webhook management and delivery" },
      { name: "Notifications", description: "User notifications" },
      { name: "Achievements", description: "Gamification and achievements" },
      { name: "Workspaces", description: "Multi-tenant workspaces" },
      { name: "API Keys", description: "API key management" },
      { name: "System", description: "Health checks and system status" },
    ],
  };
}

export async function GET() {
  const spec = generateOpenAPISpec();
  return NextResponse.json(spec, {
    headers: { "Content-Type": "application/json" },
  });
}
