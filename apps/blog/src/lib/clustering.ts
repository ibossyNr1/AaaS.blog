/**
 * Entity Clustering, Topic Mapping, and Discovery Path Generation
 *
 * Provides algorithms for:
 * - Tag-based entity clustering using Jaccard similarity
 * - Topic graph construction from entity tags and relations
 * - Learning path generation through related entities
 */

import type { Entity, EntityType } from "./types";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface EntityCluster {
  id: string;
  name: string;
  description: string;
  entities: string[]; // slugs as "type/slug"
  centroidTags: string[];
  size: number;
}

export interface TopicMap {
  topics: Topic[];
  connections: TopicConnection[];
}

export interface Topic {
  id: string;
  name: string;
  entityCount: number;
  avgScore: number;
  trending: boolean;
}

export interface TopicConnection {
  from: string;
  to: string;
  strength: number;
}

export interface DiscoveryPath {
  id: string;
  name: string;
  description: string;
  steps: PathStep[];
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
}

export interface PathStep {
  entitySlug: string;
  entityType: string;
  entityName: string;
  description: string;
  order: number;
}

/* -------------------------------------------------------------------------- */
/*  Jaccard similarity                                                         */
/* -------------------------------------------------------------------------- */

export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/* -------------------------------------------------------------------------- */
/*  Entity clustering                                                          */
/* -------------------------------------------------------------------------- */

const SIMILARITY_THRESHOLD = 0.25;

/**
 * Cluster entities by tag similarity using single-linkage agglomerative approach.
 * Entities with Jaccard similarity >= threshold on their tags are grouped together.
 */
export function clusterEntities(entities: Entity[]): EntityCluster[] {
  if (entities.length === 0) return [];

  // Build adjacency based on Jaccard similarity of tags
  const n = entities.length;
  const parent = Array.from({ length: n }, (_, i) => i);

  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  }

  function union(a: number, b: number): void {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  }

  // Compare all pairs
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = jaccardSimilarity(entities[i].tags || [], entities[j].tags || []);
      if (sim >= SIMILARITY_THRESHOLD) {
        union(i, j);
      }
    }
  }

  // Group entities by root
  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(i);
  }

  // Build cluster objects (skip singletons)
  const clusters: EntityCluster[] = [];
  let clusterId = 0;

  for (const indices of groups.values()) {
    if (indices.length < 2) continue;

    const clusterEntities = indices.map((i) => entities[i]);
    const entityKeys = clusterEntities.map((e) => `${e.type}/${e.slug}`);

    // Compute centroid tags: tags that appear in >= 40% of cluster members
    const tagCounts = new Map<string, number>();
    for (const e of clusterEntities) {
      for (const tag of e.tags || []) {
        const t = tag.toLowerCase();
        tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
      }
    }
    const threshold = Math.max(2, Math.ceil(clusterEntities.length * 0.4));
    const centroidTags = [...tagCounts.entries()]
      .filter(([, count]) => count >= threshold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);

    const name = centroidTags.length > 0
      ? centroidTags.slice(0, 3).map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(" + ")
      : `Cluster ${clusterId + 1}`;

    clusters.push({
      id: `cluster-${clusterId}`,
      name,
      description: `${clusterEntities.length} entities grouped by shared tags: ${centroidTags.slice(0, 5).join(", ")}`,
      entities: entityKeys,
      centroidTags,
      size: clusterEntities.length,
    });

    clusterId++;
  }

  // Sort clusters by size descending
  clusters.sort((a, b) => b.size - a.size);
  return clusters;
}

/* -------------------------------------------------------------------------- */
/*  Topic map                                                                  */
/* -------------------------------------------------------------------------- */

const MIN_ENTITY_COUNT_FOR_TOPIC = 2;

/**
 * Build a topic graph from entity tags and relations.
 * Topics are derived from tags that appear across multiple entities.
 * Connections represent co-occurrence of topics within the same entities.
 */
export function buildTopicMapFromEntities(entities: Entity[]): TopicMap {
  // Count tag occurrences and aggregate scores
  const tagStats = new Map<string, { count: number; totalScore: number; entities: Set<string> }>();

  for (const entity of entities) {
    for (const tag of entity.tags || []) {
      const t = tag.toLowerCase();
      if (!tagStats.has(t)) {
        tagStats.set(t, { count: 0, totalScore: 0, entities: new Set() });
      }
      const stat = tagStats.get(t)!;
      stat.count++;
      stat.totalScore += entity.scores?.composite || 0;
      stat.entities.add(`${entity.type}/${entity.slug}`);
    }
  }

  // Filter to topics with enough entities
  const topics: Topic[] = [];
  const topicEntities = new Map<string, Set<string>>();

  for (const [tag, stat] of tagStats.entries()) {
    if (stat.count < MIN_ENTITY_COUNT_FOR_TOPIC) continue;

    const avgScore = Math.round(stat.totalScore / stat.count);
    topics.push({
      id: tag,
      name: tag.charAt(0).toUpperCase() + tag.slice(1),
      entityCount: stat.count,
      avgScore,
      trending: avgScore >= 70,
    });
    topicEntities.set(tag, stat.entities);
  }

  // Sort topics by entity count descending
  topics.sort((a, b) => b.entityCount - a.entityCount);

  // Build connections based on co-occurrence
  const connections: TopicConnection[] = [];
  const topicIds = topics.map((t) => t.id);

  for (let i = 0; i < topicIds.length; i++) {
    for (let j = i + 1; j < topicIds.length; j++) {
      const setA = topicEntities.get(topicIds[i])!;
      const setB = topicEntities.get(topicIds[j])!;

      let overlap = 0;
      for (const e of setA) {
        if (setB.has(e)) overlap++;
      }

      if (overlap > 0) {
        const strength = overlap / Math.min(setA.size, setB.size);
        if (strength >= 0.2) {
          connections.push({
            from: topicIds[i],
            to: topicIds[j],
            strength: Math.round(strength * 100) / 100,
          });
        }
      }
    }
  }

  // Sort connections by strength descending
  connections.sort((a, b) => b.strength - a.strength);

  return { topics: topics.slice(0, 50), connections: connections.slice(0, 100) };
}

/* -------------------------------------------------------------------------- */
/*  Discovery paths                                                            */
/* -------------------------------------------------------------------------- */

const ENTITY_TYPE_ORDER: EntityType[] = ["benchmark", "model", "tool", "skill", "agent", "script"];

/**
 * Generate learning/discovery paths through related entities.
 * Paths follow natural progression: learn about models -> tools -> skills -> agents.
 */
export function generateDiscoveryPathsFromEntities(entities: Entity[]): DiscoveryPath[] {
  if (entities.length < 3) return [];

  const paths: DiscoveryPath[] = [];

  // Group entities by category
  const byCategory = new Map<string, Entity[]>();
  for (const e of entities) {
    const cat = e.category || "uncategorized";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(e);
  }

  let pathId = 0;

  for (const [category, categoryEntities] of byCategory.entries()) {
    if (categoryEntities.length < 3) continue;

    // Sort by entity type order, then by score
    const sorted = [...categoryEntities].sort((a, b) => {
      const orderA = ENTITY_TYPE_ORDER.indexOf(a.type);
      const orderB = ENTITY_TYPE_ORDER.indexOf(b.type);
      if (orderA !== orderB) return orderA - orderB;
      return (b.scores?.composite || 0) - (a.scores?.composite || 0);
    });

    // Take top entities to form a path (max 6 steps)
    const pathEntities = sorted.slice(0, 6);
    const steps: PathStep[] = pathEntities.map((e, i) => ({
      entitySlug: e.slug,
      entityType: e.type,
      entityName: e.name,
      description: e.description?.slice(0, 120) || `Explore ${e.name}`,
      order: i + 1,
    }));

    // Determine difficulty based on average schema completeness
    const avgCompleteness =
      pathEntities.reduce((sum, e) => sum + (e.schemaCompleteness || 50), 0) / pathEntities.length;
    const difficulty: DiscoveryPath["difficulty"] =
      avgCompleteness >= 80 ? "beginner" : avgCompleteness >= 50 ? "intermediate" : "advanced";

    const estimatedMinutes = steps.length * 5;

    const catName = category.replace(/-/g, " ").replace(/\bai\b/gi, "AI");

    paths.push({
      id: `path-${pathId}`,
      name: `${catName.charAt(0).toUpperCase() + catName.slice(1)} Journey`,
      description: `Explore ${steps.length} key entities in the ${catName} space, from foundational models to production agents.`,
      steps,
      difficulty,
      estimatedTime: `${estimatedMinutes} min`,
    });

    pathId++;
  }

  // Sort by step count descending (longer paths = richer content)
  paths.sort((a, b) => b.steps.length - a.steps.length);

  return paths;
}
