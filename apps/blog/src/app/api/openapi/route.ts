export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Shared schema helpers
// ---------------------------------------------------------------------------

const entityTypeEnum = ["tool", "model", "agent", "skill", "script", "benchmark"];
const sortEnum = ["composite", "newest", "name"];
const channelExamples = ["llms", "ai-tools", "ai-agents", "ai-code"];
const metricEnum = ["composite", "adoption", "quality", "freshness", "citations", "engagement"];
const webhookEvents = ["entity.created", "entity.updated", "entity.deleted", "leaderboard.updated", "changelog.new"];

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const errorResponse = (description: string) => ({
  description,
  content: {
    "application/json": {
      schema: ref("Error"),
    },
  },
});

const paginatedList = (itemRef: string) => ({
  type: "object" as const,
  properties: {
    data: { type: "array" as const, items: ref(itemRef) },
    count: { type: "integer" as const },
    timestamp: { type: "string" as const, format: "date-time" },
  },
});

// ---------------------------------------------------------------------------
// Full OpenAPI 3.0.3 Specification
// ---------------------------------------------------------------------------

const spec = {
  openapi: "3.0.3",
  info: {
    title: "AaaS Knowledge Index API",
    description:
      "Schema-first AI ecosystem database API. Browse, search, and contribute to the autonomous knowledge index of tools, models, agents, skills, scripts, and benchmarks.",
    version: "2.0.0",
    contact: {
      name: "AaaS / Superforge",
      url: "https://aaas.blog",
      email: "hello@superforge.dev",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    { url: "https://aaas.blog/api", description: "Production" },
  ],
  tags: [
    { name: "Entities", description: "Browse and retrieve entities" },
    { name: "Search", description: "Full-text search across all entity types" },
    { name: "Leaderboard", description: "Ranked entity listings by score" },
    { name: "Submit", description: "Submit new entities for review" },
    { name: "Export", description: "Bulk data export in JSON, CSV, or JSONL" },
    { name: "Trending", description: "Trending alerts and score changes" },
    { name: "Activity", description: "Unified activity feed" },
    { name: "Badge", description: "Embeddable SVG score badges" },
    { name: "Keys", description: "API key registration and management" },
    { name: "Media", description: "Episodes, podcast RSS, and entity RSS feeds" },
    { name: "Subscriptions", description: "Email subscription management" },
    { name: "Bookmarks", description: "User bookmark management" },
    { name: "Collections", description: "Curated entity collections" },
    { name: "Webhooks", description: "Webhook registration and management" },
    { name: "Admin", description: "Admin operations (requires elevated key)" },
    { name: "SDKs", description: "SDK downloads" },
  ],
  paths: {
    // ---- Entities ----
    "/entities": {
      get: {
        tags: ["Entities"],
        summary: "List entities",
        description:
          "Returns entities filtered by type or channel. Defaults to trending entities when no filter is provided.",
        parameters: [
          { name: "type", in: "query", schema: { type: "string", enum: entityTypeEnum }, description: "Filter by entity type" },
          { name: "channel", in: "query", schema: { type: "string" }, description: `Filter by channel (e.g. ${channelExamples.join(", ")})` },
          { name: "limit", in: "query", schema: { type: "integer", default: 50, minimum: 1, maximum: 100 }, description: "Max results to return" },
        ],
        responses: {
          "200": { description: "Entity list", content: { "application/json": { schema: paginatedList("Entity") } } },
          "500": errorResponse("Server error"),
        },
      },
    },
    "/entity/{type}/{slug}": {
      get: {
        tags: ["Entities"],
        summary: "Get a single entity",
        description: "Retrieve full details for one entity by type and slug.",
        parameters: [
          { name: "type", in: "path", required: true, schema: { type: "string", enum: entityTypeEnum }, description: "Entity type" },
          { name: "slug", in: "path", required: true, schema: { type: "string" }, description: "Entity slug identifier" },
        ],
        responses: {
          "200": { description: "Entity details", content: { "application/json": { schema: { type: "object", properties: { data: ref("Entity"), timestamp: { type: "string", format: "date-time" } } } } } },
          "400": errorResponse("Invalid entity type"),
          "404": errorResponse("Entity not found"),
          "500": errorResponse("Server error"),
        },
      },
    },
    "/entity/{type}/{slug}/changelog": {
      get: {
        tags: ["Entities"],
        summary: "Get entity changelog",
        description: "Returns the change history for a specific entity.",
        parameters: [
          { name: "type", in: "path", required: true, schema: { type: "string", enum: entityTypeEnum } },
          { name: "slug", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Changelog entries", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: ref("ChangelogEntry") }, count: { type: "integer" } } } } } },
          "404": errorResponse("Entity not found"),
          "500": errorResponse("Server error"),
        },
      },
    },
    "/entity/{type}/{slug}/similar": {
      get: {
        tags: ["Entities"],
        summary: "Find similar entities",
        description: "Returns entities similar to the specified one based on tags, capabilities, and category.",
        parameters: [
          { name: "type", in: "path", required: true, schema: { type: "string", enum: entityTypeEnum } },
          { name: "slug", in: "path", required: true, schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 5, minimum: 1, maximum: 20 } },
        ],
        responses: {
          "200": { description: "Similar entities", content: { "application/json": { schema: paginatedList("Entity") } } },
          "404": errorResponse("Entity not found"),
          "500": errorResponse("Server error"),
        },
      },
    },

    // ---- Search ----
    "/search": {
      get: {
        tags: ["Search"],
        summary: "Search entities",
        description: "Full-text search across entity names, descriptions, providers, and tags.",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, description: "Search query" },
          { name: "type", in: "query", schema: { type: "string", enum: entityTypeEnum }, description: "Filter by entity type" },
          { name: "channel", in: "query", schema: { type: "string" }, description: "Filter by channel" },
          { name: "sort", in: "query", schema: { type: "string", enum: sortEnum, default: "composite" }, description: "Sort order" },
          { name: "limit", in: "query", schema: { type: "integer", default: 100, minimum: 1, maximum: 200 }, description: "Max results" },
        ],
        responses: {
          "200": { description: "Search results", content: { "application/json": { schema: ref("SearchResponse") } } },
          "400": errorResponse("Invalid sort parameter"),
          "500": errorResponse("Search failed"),
        },
      },
    },

    // ---- Leaderboard ----
    "/leaderboard/{category}": {
      get: {
        tags: ["Leaderboard"],
        summary: "Get leaderboard",
        description: "Returns top-ranked entities by composite score. Use 'all' for a cross-type leaderboard.",
        parameters: [
          { name: "category", in: "path", required: true, schema: { type: "string", enum: ["all", ...entityTypeEnum] }, description: "Entity type or 'all'" },
          { name: "limit", in: "query", schema: { type: "integer", default: 25, minimum: 1, maximum: 100 }, description: "Max results" },
        ],
        responses: {
          "200": { description: "Leaderboard results", content: { "application/json": { schema: ref("LeaderboardResponse") } } },
          "400": errorResponse("Invalid category"),
          "500": errorResponse("Server error"),
        },
      },
    },

    // ---- Submit ----
    "/submit": {
      post: {
        tags: ["Submit"],
        summary: "Submit a new entity",
        description: "Submit an entity for review. Requires an API key in the x-api-key header.",
        security: [{ apiKey: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: ref("SubmitEntityPayload") } },
        },
        responses: {
          "201": { description: "Submission accepted", content: { "application/json": { schema: ref("SubmitResponse") } } },
          "400": errorResponse("Validation error"),
          "401": errorResponse("Missing or invalid API key"),
          "500": errorResponse("Server error"),
        },
      },
    },

    // ---- Export ----
    "/export/entities": {
      get: {
        tags: ["Export"],
        summary: "Export entities",
        description: "Bulk export of entity data as JSON, CSV, or JSONL file download.",
        parameters: [
          { name: "format", in: "query", schema: { type: "string", enum: ["json", "csv", "jsonl"], default: "json" }, description: "Export format" },
          { name: "type", in: "query", schema: { type: "string", enum: entityTypeEnum }, description: "Filter by entity type" },
          { name: "fields", in: "query", schema: { type: "string" }, description: "Comma-separated field names to include" },
        ],
        responses: {
          "200": { description: "File download. Content-Type varies by format." },
          "400": errorResponse("Invalid type or format"),
          "500": errorResponse("Export failed"),
        },
      },
    },
    "/export/leaderboard": {
      get: {
        tags: ["Export"],
        summary: "Export leaderboard",
        description: "Export leaderboard data as JSON or CSV.",
        parameters: [
          { name: "format", in: "query", schema: { type: "string", enum: ["json", "csv"], default: "json" } },
          { name: "category", in: "query", schema: { type: "string", enum: ["all", ...entityTypeEnum], default: "all" } },
        ],
        responses: {
          "200": { description: "Leaderboard file download" },
          "500": errorResponse("Export failed"),
        },
      },
    },
    "/export/changelog": {
      get: {
        tags: ["Export"],
        summary: "Export changelog",
        description: "Export entity change history as JSON or CSV.",
        parameters: [
          { name: "format", in: "query", schema: { type: "string", enum: ["json", "csv"], default: "json" } },
          { name: "type", in: "query", schema: { type: "string", enum: entityTypeEnum } },
          { name: "since", in: "query", schema: { type: "string", format: "date" }, description: "ISO date to filter from" },
        ],
        responses: {
          "200": { description: "Changelog file download" },
          "500": errorResponse("Export failed"),
        },
      },
    },

    // ---- Trending ----
    "/trending": {
      get: {
        tags: ["Trending"],
        summary: "Get trending alerts",
        description: "Returns the most recent trending score changes detected by autonomous agents.",
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", default: 10, minimum: 1, maximum: 50 } },
        ],
        responses: {
          "200": { description: "Trending alerts", content: { "application/json": { schema: { type: "array", items: ref("TrendingAlert") } } } },
          "500": errorResponse("Server error"),
        },
      },
    },

    // ---- Activity ----
    "/activity": {
      get: {
        tags: ["Activity"],
        summary: "Get activity feed",
        description: "Unified feed of agent logs, trending alerts, and submissions sorted by recency.",
        responses: {
          "200": { description: "Activity items", content: { "application/json": { schema: { type: "array", items: ref("ActivityItem") } } } },
          "500": errorResponse("Server error"),
        },
      },
    },

    // ---- Badge ----
    "/badge/{type}/{slug}": {
      get: {
        tags: ["Badge"],
        summary: "Get embeddable score badge",
        description: "Returns an SVG badge showing the entity score. Embed in README files or dashboards.",
        parameters: [
          { name: "type", in: "path", required: true, schema: { type: "string", enum: entityTypeEnum } },
          { name: "slug", in: "path", required: true, schema: { type: "string" } },
          { name: "metric", in: "query", schema: { type: "string", enum: metricEnum, default: "composite" }, description: "Score metric to display" },
        ],
        responses: {
          "200": { description: "SVG badge image", content: { "image/svg+xml": { schema: { type: "string" } } } },
        },
      },
    },

    // ---- Keys ----
    "/keys": {
      post: {
        tags: ["Keys"],
        summary: "Register a new API key",
        description: "Creates a new API key. The raw key is returned only once in the response.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: ref("ApiKeyCreatePayload") } },
        },
        responses: {
          "201": { description: "Key created", content: { "application/json": { schema: ref("ApiKeyResponse") } } },
          "400": errorResponse("Validation error"),
          "500": errorResponse("Server error"),
        },
      },
      get: {
        tags: ["Keys"],
        summary: "List API keys by email",
        description: "Returns all API keys registered to the given email address.",
        parameters: [
          { name: "email", in: "query", required: true, schema: { type: "string", format: "email" } },
        ],
        responses: {
          "200": { description: "Key list", content: { "application/json": { schema: { type: "object", properties: { keys: { type: "array", items: ref("ApiKeyInfo") } } } } } },
          "400": errorResponse("Missing or invalid email"),
          "500": errorResponse("Server error"),
        },
      },
    },
    "/keys/{id}": {
      delete: {
        tags: ["Keys"],
        summary: "Revoke an API key",
        description: "Revokes a specific API key. Requires the API key in the x-api-key header.",
        security: [{ apiKey: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Key revoked", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
          "401": errorResponse("Unauthorized"),
          "404": errorResponse("Key not found"),
        },
      },
    },

    // ---- Subscriptions ----
    "/subscribe": {
      post: {
        tags: ["Subscriptions"],
        summary: "Subscribe to updates",
        description: "Subscribe an email address to receive Knowledge Index updates.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["email"], properties: { email: { type: "string", format: "email" } } } } },
        },
        responses: {
          "200": { description: "Subscribed", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
          "400": errorResponse("Invalid email"),
          "500": errorResponse("Server error"),
        },
      },
    },
    "/unsubscribe": {
      get: {
        tags: ["Subscriptions"],
        summary: "Unsubscribe from updates",
        description: "Unsubscribe via a one-time token.",
        parameters: [
          { name: "token", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Unsubscribed", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
          "400": errorResponse("Invalid or expired token"),
        },
      },
    },

    // ---- Bookmarks ----
    "/bookmarks": {
      get: {
        tags: ["Bookmarks"],
        summary: "Get bookmarks",
        description: "Get the authenticated user's bookmarked entities.",
        security: [{ apiKey: [] }],
        responses: {
          "200": { description: "Bookmark list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: ref("Entity") } } } } } },
          "401": errorResponse("Unauthorized"),
        },
      },
      post: {
        tags: ["Bookmarks"],
        summary: "Add bookmark",
        description: "Bookmark an entity.",
        security: [{ apiKey: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["entityType", "entitySlug"], properties: { entityType: { type: "string", enum: entityTypeEnum }, entitySlug: { type: "string" } } } } },
        },
        responses: {
          "200": { description: "Bookmarked", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
          "401": errorResponse("Unauthorized"),
        },
      },
    },
    "/bookmarks/{type}/{slug}": {
      delete: {
        tags: ["Bookmarks"],
        summary: "Remove bookmark",
        description: "Remove a bookmark by entity type and slug.",
        security: [{ apiKey: [] }],
        parameters: [
          { name: "type", in: "path", required: true, schema: { type: "string", enum: entityTypeEnum } },
          { name: "slug", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Removed", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
          "401": errorResponse("Unauthorized"),
          "404": errorResponse("Bookmark not found"),
        },
      },
    },

    // ---- Collections ----
    "/collections": {
      get: {
        tags: ["Collections"],
        summary: "List collections",
        description: "Returns all public collections.",
        responses: {
          "200": { description: "Collection list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: ref("CollectionSummary") } } } } } },
        },
      },
      post: {
        tags: ["Collections"],
        summary: "Create a collection",
        description: "Create a new entity collection.",
        security: [{ apiKey: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" }, description: { type: "string" } } } } },
        },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: { type: "object", properties: { id: { type: "string" } } } } } },
          "401": errorResponse("Unauthorized"),
        },
      },
    },
    "/collections/{id}": {
      get: {
        tags: ["Collections"],
        summary: "Get collection",
        description: "Get a collection with its entities.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Collection", content: { "application/json": { schema: ref("CollectionDetail") } } },
          "404": errorResponse("Not found"),
        },
      },
    },

    // ---- Webhooks ----
    "/webhooks": {
      post: {
        tags: ["Webhooks"],
        summary: "Register a webhook",
        description: "Register an HTTPS endpoint to receive real-time notifications.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: ref("WebhookPayload") } },
        },
        responses: {
          "201": { description: "Registered", content: { "application/json": { schema: { type: "object", properties: { id: { type: "string" }, status: { type: "string" } } } } } },
          "400": errorResponse("Invalid URL or events"),
        },
      },
    },

    // ---- Admin ----
    "/admin/entities/{type}/{slug}": {
      put: {
        tags: ["Admin"],
        summary: "Update entity (admin)",
        description: "Admin-only endpoint to update an entity directly.",
        security: [{ apiKey: [] }],
        parameters: [
          { name: "type", in: "path", required: true, schema: { type: "string", enum: entityTypeEnum } },
          { name: "slug", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", description: "Partial entity fields to update" } } },
        },
        responses: {
          "200": { description: "Updated", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Forbidden — admin key required"),
          "404": errorResponse("Entity not found"),
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete entity (admin)",
        description: "Admin-only endpoint to delete an entity.",
        security: [{ apiKey: [] }],
        parameters: [
          { name: "type", in: "path", required: true, schema: { type: "string", enum: entityTypeEnum } },
          { name: "slug", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Deleted", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Forbidden — admin key required"),
          "404": errorResponse("Entity not found"),
        },
      },
    },
    "/admin/submissions": {
      get: {
        tags: ["Admin"],
        summary: "List pending submissions",
        description: "Returns all pending entity submissions for review.",
        security: [{ apiKey: [] }],
        responses: {
          "200": { description: "Submissions", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: ref("Submission") } } } } } },
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Forbidden"),
        },
      },
    },
    "/admin/submissions/{id}/approve": {
      post: {
        tags: ["Admin"],
        summary: "Approve submission",
        description: "Approve a pending entity submission.",
        security: [{ apiKey: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Approved", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Forbidden"),
          "404": errorResponse("Submission not found"),
        },
      },
    },
    "/admin/submissions/{id}/reject": {
      post: {
        tags: ["Admin"],
        summary: "Reject submission",
        description: "Reject a pending entity submission with an optional reason.",
        security: [{ apiKey: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: { "application/json": { schema: { type: "object", properties: { reason: { type: "string" } } } } },
        },
        responses: {
          "200": { description: "Rejected", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Forbidden"),
          "404": errorResponse("Submission not found"),
        },
      },
    },

    // ---- SDKs ----
    "/sdk/typescript": {
      get: {
        tags: ["SDKs"],
        summary: "Download TypeScript SDK",
        description: "Downloads a generated TypeScript SDK client as a .ts file.",
        responses: {
          "200": { description: "TypeScript SDK file", content: { "text/plain": { schema: { type: "string" } } } },
        },
      },
    },
    "/sdk/python": {
      get: {
        tags: ["SDKs"],
        summary: "Download Python SDK",
        description: "Downloads a generated Python SDK client as a .py file.",
        responses: {
          "200": { description: "Python SDK file", content: { "text/plain": { schema: { type: "string" } } } },
        },
      },
    },

    // ---- Media ----
    "/episodes": {
      get: {
        tags: ["Media"],
        summary: "List audio episodes",
        description: "Returns audio episodes (narrations, digests, podcasts) sorted by publish date.",
        parameters: [
          { name: "format", in: "query", schema: { type: "string", enum: ["narration", "digest", "podcast"] }, description: "Filter by audio format" },
          { name: "limit", in: "query", schema: { type: "integer", default: 50, minimum: 1, maximum: 100 } },
        ],
        responses: {
          "200": { description: "Episode list", content: { "application/json": { schema: paginatedList("Episode") } } },
          "500": errorResponse("Server error"),
        },
      },
    },
    "/podcast": {
      get: {
        tags: ["Media"],
        summary: "Podcast RSS feed",
        description: "iTunes-compatible RSS feed for podcast clients. Returns XML.",
        responses: {
          "200": { description: "RSS XML feed", content: { "application/xml": { schema: { type: "string" } } } },
        },
      },
    },
    "/feed": {
      get: {
        tags: ["Media"],
        summary: "Entity RSS feed",
        description: "RSS feed of recently added entities. Subscribe in any feed reader.",
        responses: {
          "200": { description: "RSS XML feed", content: { "application/xml": { schema: { type: "string" } } } },
        },
      },
    },

    // ---- OpenAPI ----
    "/openapi": {
      get: {
        tags: ["SDKs"],
        summary: "OpenAPI specification",
        description: "Returns this OpenAPI 3.0.3 specification as JSON.",
        responses: {
          "200": { description: "OpenAPI spec", content: { "application/json": { schema: { type: "object" } } } },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      apiKey: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "API key obtained via POST /keys. Pass in the x-api-key header.",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
      EntityScores: {
        type: "object",
        properties: {
          composite: { type: "number" },
          adoption: { type: "number" },
          quality: { type: "number" },
          freshness: { type: "number" },
          citations: { type: "number" },
          engagement: { type: "number" },
        },
      },
      Entity: {
        type: "object",
        properties: {
          slug: { type: "string" },
          name: { type: "string" },
          type: { type: "string", enum: entityTypeEnum },
          description: { type: "string" },
          provider: { type: "string" },
          category: { type: "string" },
          version: { type: "string" },
          pricingModel: { type: "string" },
          license: { type: "string" },
          url: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          capabilities: { type: "array", items: { type: "string" } },
          scores: { $ref: "#/components/schemas/EntityScores" },
          addedDate: { type: "string", format: "date" },
          lastUpdated: { type: "string", format: "date-time" },
        },
      },
      SearchResponse: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Entity" } },
          count: { type: "integer" },
          total: { type: "integer" },
          query: { type: "string", nullable: true },
          filters: {
            type: "object",
            properties: {
              type: { type: "string", nullable: true },
              channel: { type: "string", nullable: true },
              sort: { type: "string" },
            },
          },
          timestamp: { type: "string", format: "date-time" },
        },
      },
      LeaderboardResponse: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Entity" } },
          category: { type: "string" },
          count: { type: "integer" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
      SubmitEntityPayload: {
        type: "object",
        required: ["name", "type", "description", "provider", "category"],
        properties: {
          name: { type: "string" },
          type: { type: "string", enum: entityTypeEnum },
          description: { type: "string" },
          provider: { type: "string" },
          category: { type: "string" },
          version: { type: "string" },
          url: { type: "string", format: "uri" },
          tags: { type: "array", items: { type: "string" } },
          capabilities: { type: "array", items: { type: "string" } },
          pricingModel: { type: "string" },
          license: { type: "string" },
        },
      },
      SubmitResponse: {
        type: "object",
        properties: {
          id: { type: "string" },
          status: { type: "string", enum: ["pending"] },
          message: { type: "string" },
        },
      },
      TrendingAlert: {
        type: "object",
        properties: {
          id: { type: "string" },
          entityName: { type: "string" },
          entityType: { type: "string" },
          entitySlug: { type: "string" },
          direction: { type: "string", enum: ["up", "down"] },
          delta: { type: "number" },
          detectedAt: { type: "string", format: "date-time" },
        },
      },
      ActivityItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string", enum: ["agent_log", "trending", "submission"] },
          timestamp: { type: "string", format: "date-time" },
          title: { type: "string" },
          detail: { type: "string" },
          icon: { type: "string" },
          entityType: { type: "string" },
          entitySlug: { type: "string" },
          success: { type: "boolean" },
        },
      },
      ChangelogEntry: {
        type: "object",
        properties: {
          id: { type: "string" },
          field: { type: "string" },
          oldValue: { type: "string" },
          newValue: { type: "string" },
          changedAt: { type: "string", format: "date-time" },
          changedBy: { type: "string" },
        },
      },
      ApiKeyCreatePayload: {
        type: "object",
        required: ["name", "email"],
        properties: {
          name: { type: "string", minLength: 3, maxLength: 50 },
          email: { type: "string", format: "email" },
          description: { type: "string" },
        },
      },
      ApiKeyResponse: {
        type: "object",
        properties: {
          id: { type: "string" },
          key: { type: "string", description: "The raw API key (shown only once)" },
          keyPrefix: { type: "string" },
          name: { type: "string" },
          rateLimit: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      ApiKeyInfo: {
        type: "object",
        properties: {
          id: { type: "string" },
          keyPrefix: { type: "string" },
          name: { type: "string" },
          status: { type: "string" },
          requestCount: { type: "integer" },
          rateLimit: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          lastUsedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      WebhookPayload: {
        type: "object",
        required: ["url", "events"],
        properties: {
          url: { type: "string", format: "uri", description: "HTTPS endpoint URL" },
          events: { type: "array", items: { type: "string", enum: webhookEvents }, description: "Event types to subscribe to" },
        },
      },
      CollectionSummary: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          entityCount: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      CollectionDetail: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          entities: { type: "array", items: { $ref: "#/components/schemas/Entity" } },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Submission: {
        type: "object",
        properties: {
          id: { type: "string" },
          entity: { type: "object" },
          submittedBy: { type: "string" },
          submittedAt: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["pending", "approved", "rejected"] },
        },
      },
      Episode: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          format: { type: "string", enum: ["narration", "digest", "podcast"] },
          duration: { type: "integer" },
          audioUrl: { type: "string", format: "uri" },
          publishedAt: { type: "string", format: "date-time" },
          tags: { type: "array", items: { type: "string" } },
          playCount: { type: "integer" },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
