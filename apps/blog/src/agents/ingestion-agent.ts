/**
 * Ingestion Agent
 *
 * Discovers new AI entities from curated sources and creates submission
 * entries in the `submissions` collection for review. Currently operates
 * in "dry run" mode — logs what it would scan and creates placeholder
 * submissions. In production, this would use web scraping and LLM
 * classification to populate real entity data.
 *
 * Pipeline: discover -> deduplicate -> validate -> queue
 * Daily cap: 20 candidates per run
 *
 * Schedule: daily
 * Idempotent: yes — deduplicates against existing entities and submissions
 */

import { db, logAgentAction } from "./logger";

const AGENT_NAME = "ingestion-agent";
const DAILY_CAP = 20;

const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];

/** Curated sources for entity discovery */
const DISCOVERY_SOURCES = [
  {
    id: "github-trending",
    name: "GitHub Trending — AI/ML",
    url: "https://github.com/trending?since=daily&spoken_language_code=en",
    entityType: "tool" as const,
    description: "Trending AI/ML repositories on GitHub",
  },
  {
    id: "huggingface-models",
    name: "HuggingFace — New Models",
    url: "https://huggingface.co/models?sort=modified",
    entityType: "model" as const,
    description: "Recently updated models on HuggingFace Hub",
  },
  {
    id: "huggingface-spaces",
    name: "HuggingFace — Trending Spaces",
    url: "https://huggingface.co/spaces?sort=trending",
    entityType: "tool" as const,
    description: "Trending demo spaces on HuggingFace",
  },
  {
    id: "producthunt-ai",
    name: "Product Hunt — AI Category",
    url: "https://www.producthunt.com/topics/artificial-intelligence",
    entityType: "tool" as const,
    description: "New AI product launches on Product Hunt",
  },
  {
    id: "arxiv-cs-ai",
    name: "arXiv — CS.AI",
    url: "https://arxiv.org/list/cs.AI/recent",
    entityType: "benchmark" as const,
    description: "Recent AI research papers and benchmarks",
  },
  {
    id: "arxiv-cs-cl",
    name: "arXiv — CS.CL",
    url: "https://arxiv.org/list/cs.CL/recent",
    entityType: "model" as const,
    description: "Recent computational linguistics papers (new LLMs)",
  },
];

interface DiscoveryCandidate {
  sourceId: string;
  name: string;
  suggestedType: string;
  url: string;
  description: string;
}

/**
 * Simulate discovery from a source.
 * In production: scrape the source URL, extract entity candidates,
 * use LLM to classify type and extract metadata.
 */
function discoverFromSource(source: typeof DISCOVERY_SOURCES[number]): DiscoveryCandidate[] {
  // Stub: log that we would scan and return empty
  console.log(`  Scanning: ${source.name} (${source.url})`);
  console.log(`    -> In production: would scrape and extract candidates`);

  // Return empty — real implementation would return scraped candidates
  return [];
}

/**
 * Check if a candidate already exists as an entity or pending submission.
 */
async function isDuplicate(candidate: DiscoveryCandidate): Promise<boolean> {
  // Check existing entities across all collections
  for (const collection of ENTITY_COLLECTIONS) {
    const existing = await db.collection(collection)
      .where("name", "==", candidate.name)
      .limit(1)
      .get();
    if (!existing.empty) {
      return true;
    }
  }

  // Check pending submissions
  const pendingSub = await db.collection("submissions")
    .where("entity.name", "==", candidate.name)
    .where("status", "==", "pending")
    .limit(1)
    .get();

  return !pendingSub.empty;
}

/**
 * Validate a candidate has minimum required data.
 */
function validateCandidate(candidate: DiscoveryCandidate): {
  valid: boolean;
  reason?: string;
} {
  if (!candidate.name || candidate.name.trim().length === 0) {
    return { valid: false, reason: "missing_name" };
  }
  if (!candidate.url || candidate.url.trim().length === 0) {
    return { valid: false, reason: "missing_url" };
  }
  if (!candidate.description || candidate.description.trim().length < 10) {
    return { valid: false, reason: "description_too_short" };
  }

  // Basic URL format validation
  try {
    new URL(candidate.url);
  } catch {
    return { valid: false, reason: "invalid_url" };
  }

  return { valid: true };
}

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting entity discovery...`);
  console.log(`[${AGENT_NAME}] Daily cap: ${DAILY_CAP} candidates`);

  let sourcesScanned = 0;
  let candidatesFound = 0;
  let duplicatesSkipped = 0;
  let invalidSkipped = 0;
  let submissionsCreated = 0;

  try {
    const allCandidates: DiscoveryCandidate[] = [];

    // Phase 1: Discover candidates from all sources
    for (const source of DISCOVERY_SOURCES) {
      sourcesScanned++;
      const candidates = discoverFromSource(source);
      allCandidates.push(...candidates);
    }

    candidatesFound = allCandidates.length;

    // Apply daily cap
    const cappedCandidates = allCandidates.slice(0, DAILY_CAP);

    // Phase 2: Deduplicate and validate
    for (const candidate of cappedCandidates) {
      // Validate
      const validation = validateCandidate(candidate);
      if (!validation.valid) {
        console.log(
          `  Skipping "${candidate.name}": ${validation.reason}`,
        );
        invalidSkipped++;
        continue;
      }

      // Deduplicate
      const duplicate = await isDuplicate(candidate);
      if (duplicate) {
        console.log(`  Skipping "${candidate.name}": duplicate`);
        duplicatesSkipped++;
        continue;
      }

      // Phase 3: Create submission
      const now = new Date().toISOString();
      const submissionId = `auto-${Date.now()}-${candidate.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;

      await db.collection("submissions").doc(submissionId).set({
        entity: {
          name: candidate.name,
          type: candidate.suggestedType,
          description: candidate.description,
          url: candidate.url,
          provider: "[unverified]",
          version: "0.0.0",
          category: "uncategorized",
          tags: ["auto-discovered"],
          capabilities: [],
          integrations: [],
          useCases: [],
          pricingModel: "free",
          license: "",
          apiAvailable: false,
          apiDocsUrl: "",
          relatedTools: [],
          relatedModels: [],
          relatedAgents: [],
          relatedSkills: [],
          scores: {
            adoption: 0,
            quality: 0,
            freshness: 100,
            citations: 0,
            engagement: 0,
            composite: 0,
          },
          schemaCompleteness: 0,
        },
        submittedBy: AGENT_NAME,
        submittedAt: now,
        status: "pending",
        source: {
          id: candidate.sourceId,
          url: candidate.url,
        },
        autoDiscovered: true,
      });

      submissionsCreated++;
      console.log(
        `  Submitted: "${candidate.name}" (${candidate.suggestedType}) from ${candidate.sourceId}`,
      );
    }

    await logAgentAction(
      AGENT_NAME,
      "discovery_complete",
      {
        sourcesScanned,
        candidatesFound,
        duplicatesSkipped,
        invalidSkipped,
        submissionsCreated,
        dailyCap: DAILY_CAP,
      },
      true,
    );

    console.log(
      `[${AGENT_NAME}] Discovery complete. ${sourcesScanned} sources scanned, ${candidatesFound} candidates found, ${submissionsCreated} submissions created.`,
    );

    if (candidatesFound === 0) {
      console.log(
        `[${AGENT_NAME}] Note: Running in stub mode — no real scraping is performed. ` +
        `In production, discovery sources would return real candidates.`,
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentAction(
      AGENT_NAME,
      "discovery_failed",
      { sourcesScanned, candidatesFound, submissionsCreated },
      false,
      message,
    );
    console.error(`[${AGENT_NAME}] Discovery failed:`, message);
    throw err;
  }
}
