// ---------------------------------------------------------------------------
// SDK Code Generation — Template-based string interpolation
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = "https://aaas.blog/api";

// ---------------------------------------------------------------------------
// TypeScript SDK
// ---------------------------------------------------------------------------

export function generateTypeScriptSDK(baseUrl: string = DEFAULT_BASE_URL): string {
  return `// AaaS Knowledge Index — TypeScript SDK
// Generated at ${new Date().toISOString()}
// Docs: https://aaas.blog/developer

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EntityType = "tool" | "model" | "agent" | "skill" | "script" | "benchmark";

export interface EntityScores {
  composite: number;
  adoption: number;
  quality: number;
  freshness: number;
  citations: number;
  engagement: number;
}

export interface Entity {
  slug: string;
  name: string;
  type: EntityType;
  description: string;
  provider: string;
  category: string;
  version: string;
  pricingModel: string;
  license: string;
  url: string;
  tags: string[];
  capabilities: string[];
  scores: EntityScores;
  addedDate: string;
  lastUpdated: string;
}

export interface EntityListResponse {
  data: Entity[];
  count: number;
  timestamp: string;
}

export interface EntityDetailResponse {
  data: Entity;
  timestamp: string;
}

export interface SearchResponse {
  data: Entity[];
  count: number;
  total: number;
  query: string | null;
  filters: {
    type: string | null;
    channel: string | null;
    sort: string;
  };
  timestamp: string;
}

export interface LeaderboardResponse {
  data: Entity[];
  category: string;
  count: number;
  timestamp: string;
}

export interface SubmitEntityPayload {
  name: string;
  type: EntityType;
  description: string;
  provider: string;
  category: string;
  version?: string;
  url?: string;
  tags?: string[];
  capabilities?: string[];
  pricingModel?: string;
  license?: string;
}

export interface SubmitResponse {
  id: string;
  status: "pending";
  message: string;
}

export interface ApiKeyCreatePayload {
  name: string;
  email: string;
  description?: string;
}

export interface ApiKeyResponse {
  id: string;
  key: string;
  keyPrefix: string;
  name: string;
  rateLimit: number;
  createdAt: string;
}

export interface ApiKeyInfo {
  id: string;
  keyPrefix: string;
  name: string;
  status: string;
  requestCount: number;
  rateLimit: number;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface WebhookPayload {
  url: string;
  events: string[];
}

export interface TrendingAlert {
  id: string;
  entityName: string;
  entityType: string;
  entitySlug: string;
  direction: "up" | "down";
  delta: number;
  detectedAt: string;
}

export interface ActivityItem {
  id: string;
  type: "agent_log" | "trending" | "submission";
  timestamp: string;
  title: string;
  detail: string;
  icon: string;
  entityType?: string;
  entitySlug?: string;
  success?: boolean;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export interface AaaSClientOptions {
  baseUrl?: string;
  apiKey?: string;
}

export class AaaSClient {
  private baseUrl: string;
  private apiKey: string | undefined;

  constructor(options: AaaSClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "${baseUrl}";
    this.apiKey = options.apiKey;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string>),
    };
    if (this.apiKey) {
      headers["x-api-key"] = this.apiKey;
    }

    const res = await fetch(\`\${this.baseUrl}\${path}\`, {
      ...init,
      headers,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error ?? \`HTTP \${res.status}\`);
    }

    return res.json();
  }

  // --- Entities ---

  async listEntities(params?: {
    type?: EntityType;
    channel?: string;
    limit?: number;
  }): Promise<EntityListResponse> {
    const qs = new URLSearchParams();
    if (params?.type) qs.set("type", params.type);
    if (params?.channel) qs.set("channel", params.channel);
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return this.request(\`/entities\${query ? \`?\${query}\` : ""}\`);
  }

  async getEntity(type: EntityType, slug: string): Promise<EntityDetailResponse> {
    return this.request(\`/entity/\${type}/\${slug}\`);
  }

  // --- Search ---

  async search(params: {
    q?: string;
    type?: EntityType;
    channel?: string;
    sort?: "composite" | "newest" | "name";
    limit?: number;
  }): Promise<SearchResponse> {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.type) qs.set("type", params.type);
    if (params.channel) qs.set("channel", params.channel);
    if (params.sort) qs.set("sort", params.sort);
    if (params.limit) qs.set("limit", String(params.limit));
    return this.request(\`/search?\${qs.toString()}\`);
  }

  // --- Leaderboard ---

  async getLeaderboard(
    category: EntityType | "all" = "all",
    limit?: number,
  ): Promise<LeaderboardResponse> {
    const qs = limit ? \`?limit=\${limit}\` : "";
    return this.request(\`/leaderboard/\${category}\${qs}\`);
  }

  // --- Submit ---

  async submitEntity(payload: SubmitEntityPayload): Promise<SubmitResponse> {
    return this.request("/submit", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // --- Trending ---

  async getTrending(): Promise<TrendingAlert[]> {
    return this.request("/trending");
  }

  // --- Activity ---

  async getActivity(): Promise<ActivityItem[]> {
    return this.request("/activity");
  }

  // --- API Keys ---

  async createApiKey(payload: ApiKeyCreatePayload): Promise<ApiKeyResponse> {
    return this.request("/keys", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async listApiKeys(email: string): Promise<{ keys: ApiKeyInfo[] }> {
    return this.request(\`/keys?email=\${encodeURIComponent(email)}\`);
  }

  // --- Webhooks ---

  async registerWebhook(payload: WebhookPayload): Promise<{ id: string; status: string }> {
    return this.request("/webhooks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // --- Subscriptions ---

  async subscribe(email: string): Promise<{ message: string }> {
    return this.request("/subscribe", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async unsubscribe(token: string): Promise<{ message: string }> {
    return this.request(\`/unsubscribe?token=\${encodeURIComponent(token)}\`);
  }

  // --- Bookmarks ---

  async getBookmarks(): Promise<{ data: Entity[] }> {
    return this.request("/bookmarks");
  }

  async addBookmark(entityType: EntityType, entitySlug: string): Promise<{ message: string }> {
    return this.request("/bookmarks", {
      method: "POST",
      body: JSON.stringify({ entityType, entitySlug }),
    });
  }

  async removeBookmark(entityType: EntityType, entitySlug: string): Promise<{ message: string }> {
    return this.request(\`/bookmarks/\${entityType}/\${entitySlug}\`, {
      method: "DELETE",
    });
  }

  // --- Collections ---

  async listCollections(): Promise<{ data: { id: string; name: string; entityCount: number }[] }> {
    return this.request("/collections");
  }

  async getCollection(id: string): Promise<{ data: { id: string; name: string; entities: Entity[] } }> {
    return this.request(\`/collections/\${id}\`);
  }

  async createCollection(name: string, description?: string): Promise<{ id: string }> {
    return this.request("/collections", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    });
  }

  // --- Export ---

  async exportEntities(params?: {
    format?: "json" | "csv" | "jsonl";
    type?: EntityType;
    fields?: string;
  }): Promise<string> {
    const qs = new URLSearchParams();
    if (params?.format) qs.set("format", params.format);
    if (params?.type) qs.set("type", params.type);
    if (params?.fields) qs.set("fields", params.fields);
    const query = qs.toString();
    const res = await fetch(\`\${this.baseUrl}/export/entities\${query ? \`?\${query}\` : ""}\`, {
      headers: this.apiKey ? { "x-api-key": this.apiKey } : {},
    });
    return res.text();
  }

  // --- Badge URL ---

  badgeUrl(type: EntityType, slug: string, metric?: string): string {
    const qs = metric ? \`?metric=\${metric}\` : "";
    return \`\${this.baseUrl}/badge/\${type}/\${slug}\${qs}\`;
  }
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default AaaSClient;
`;
}

// ---------------------------------------------------------------------------
// Python SDK
// ---------------------------------------------------------------------------

export function generatePythonSDK(baseUrl: string = DEFAULT_BASE_URL): string {
  return `"""
AaaS Knowledge Index — Python SDK
Generated at ${new Date().toISOString()}
Docs: https://aaas.blog/developer

Install: pip install requests
"""

from __future__ import annotations

import requests
from dataclasses import dataclass, field
from typing import Any, Dict, List, Literal, Optional


EntityType = Literal["tool", "model", "agent", "skill", "script", "benchmark"]


@dataclass
class AaaSClient:
    """Client for the AaaS Knowledge Index API."""

    base_url: str = "${baseUrl}"
    api_key: Optional[str] = None
    timeout: int = 30

    # -- internal --------------------------------------------------------

    def _headers(self) -> Dict[str, str]:
        h: Dict[str, str] = {"Content-Type": "application/json"}
        if self.api_key:
            h["x-api-key"] = self.api_key
        return h

    def _get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Any:
        r = requests.get(
            f"{self.base_url}{path}",
            headers=self._headers(),
            params=params,
            timeout=self.timeout,
        )
        r.raise_for_status()
        return r.json()

    def _post(self, path: str, json: Optional[Dict[str, Any]] = None) -> Any:
        r = requests.post(
            f"{self.base_url}{path}",
            headers=self._headers(),
            json=json,
            timeout=self.timeout,
        )
        r.raise_for_status()
        return r.json()

    def _delete(self, path: str) -> Any:
        r = requests.delete(
            f"{self.base_url}{path}",
            headers=self._headers(),
            timeout=self.timeout,
        )
        r.raise_for_status()
        return r.json()

    # -- Entities --------------------------------------------------------

    def list_entities(
        self,
        type: Optional[EntityType] = None,
        channel: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> Dict[str, Any]:
        """List entities with optional filters."""
        params: Dict[str, Any] = {}
        if type:
            params["type"] = type
        if channel:
            params["channel"] = channel
        if limit:
            params["limit"] = limit
        return self._get("/entities", params=params)

    def get_entity(self, type: EntityType, slug: str) -> Dict[str, Any]:
        """Get a single entity by type and slug."""
        return self._get(f"/entity/{type}/{slug}")

    # -- Search ----------------------------------------------------------

    def search(
        self,
        q: Optional[str] = None,
        type: Optional[EntityType] = None,
        channel: Optional[str] = None,
        sort: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Full-text search across entities."""
        params: Dict[str, Any] = {}
        if q:
            params["q"] = q
        if type:
            params["type"] = type
        if channel:
            params["channel"] = channel
        if sort:
            params["sort"] = sort
        if limit:
            params["limit"] = limit
        return self._get("/search", params=params)

    # -- Leaderboard -----------------------------------------------------

    def get_leaderboard(
        self, category: str = "all", limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get leaderboard rankings."""
        params: Dict[str, Any] = {}
        if limit:
            params["limit"] = limit
        return self._get(f"/leaderboard/{category}", params=params)

    # -- Submit ----------------------------------------------------------

    def submit_entity(
        self,
        name: str,
        type: EntityType,
        description: str,
        provider: str,
        category: str,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """Submit a new entity for review."""
        payload = {
            "name": name,
            "type": type,
            "description": description,
            "provider": provider,
            "category": category,
            **kwargs,
        }
        return self._post("/submit", json=payload)

    # -- Trending --------------------------------------------------------

    def get_trending(self) -> List[Dict[str, Any]]:
        """Get trending score changes."""
        return self._get("/trending")

    # -- Activity --------------------------------------------------------

    def get_activity(self) -> List[Dict[str, Any]]:
        """Get unified activity feed."""
        return self._get("/activity")

    # -- API Keys --------------------------------------------------------

    def create_api_key(
        self, name: str, email: str, description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Register a new API key."""
        payload: Dict[str, Any] = {"name": name, "email": email}
        if description:
            payload["description"] = description
        return self._post("/keys", json=payload)

    def list_api_keys(self, email: str) -> Dict[str, Any]:
        """List API keys for an email."""
        return self._get("/keys", params={"email": email})

    # -- Webhooks --------------------------------------------------------

    def register_webhook(
        self, url: str, events: List[str]
    ) -> Dict[str, Any]:
        """Register a webhook endpoint."""
        return self._post("/webhooks", json={"url": url, "events": events})

    # -- Subscriptions ---------------------------------------------------

    def subscribe(self, email: str) -> Dict[str, Any]:
        """Subscribe to the newsletter."""
        return self._post("/subscribe", json={"email": email})

    def unsubscribe(self, token: str) -> Dict[str, Any]:
        """Unsubscribe via token."""
        return self._get(f"/unsubscribe", params={"token": token})

    # -- Bookmarks -------------------------------------------------------

    def get_bookmarks(self) -> Dict[str, Any]:
        """Get bookmarked entities."""
        return self._get("/bookmarks")

    def add_bookmark(self, entity_type: EntityType, entity_slug: str) -> Dict[str, Any]:
        """Add a bookmark."""
        return self._post(
            "/bookmarks",
            json={"entityType": entity_type, "entitySlug": entity_slug},
        )

    def remove_bookmark(self, entity_type: EntityType, entity_slug: str) -> Dict[str, Any]:
        """Remove a bookmark."""
        return self._delete(f"/bookmarks/{entity_type}/{entity_slug}")

    # -- Collections -----------------------------------------------------

    def list_collections(self) -> Dict[str, Any]:
        """List all collections."""
        return self._get("/collections")

    def get_collection(self, collection_id: str) -> Dict[str, Any]:
        """Get a collection by ID."""
        return self._get(f"/collections/{collection_id}")

    def create_collection(
        self, name: str, description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new collection."""
        payload: Dict[str, Any] = {"name": name}
        if description:
            payload["description"] = description
        return self._post("/collections", json=payload)

    # -- Export ----------------------------------------------------------

    def export_entities(
        self,
        format: str = "json",
        type: Optional[EntityType] = None,
        fields: Optional[str] = None,
    ) -> str:
        """Export entities as raw text (JSON, CSV, or JSONL)."""
        params: Dict[str, Any] = {"format": format}
        if type:
            params["type"] = type
        if fields:
            params["fields"] = fields
        r = requests.get(
            f"{self.base_url}/export/entities",
            headers=self._headers(),
            params=params,
            timeout=self.timeout,
        )
        r.raise_for_status()
        return r.text

    # -- Badge -----------------------------------------------------------

    def badge_url(
        self, type: EntityType, slug: str, metric: Optional[str] = None
    ) -> str:
        """Get the URL for an embeddable score badge."""
        qs = f"?metric={metric}" if metric else ""
        return f"{self.base_url}/badge/{type}/{slug}{qs}"


# ---------------------------------------------------------------------------
# Quick start
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    client = AaaSClient(api_key="aaas_your_key_here")

    # List tools
    tools = client.list_entities(type="tool", limit=5)
    print(f"Found {tools['count']} tools")

    # Search
    results = client.search(q="langchain")
    for entity in results["data"]:
        print(f"  {entity['name']} ({entity['type']}) — score: {entity['scores']['composite']}")
`;
}

// ---------------------------------------------------------------------------
// Curl Examples
// ---------------------------------------------------------------------------

export function generateCurlExamples(
  endpoint: string,
  method: string,
  baseUrl: string = DEFAULT_BASE_URL,
): string {
  const url = `${baseUrl}${endpoint}`;

  if (method === "GET") {
    return `curl -X GET "${url}" \\
  -H "x-api-key: aaas_your_key_here"`;
  }

  if (method === "POST") {
    return `curl -X POST "${url}" \\
  -H "x-api-key: aaas_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{}'`;
  }

  if (method === "DELETE") {
    return `curl -X DELETE "${url}" \\
  -H "x-api-key: aaas_your_key_here"`;
  }

  return `curl -X ${method} "${url}" \\
  -H "x-api-key: aaas_your_key_here"`;
}
