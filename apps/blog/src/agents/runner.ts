/**
 * Agent Runner — CLI orchestrator for the AaaS self-healing agent system.
 *
 * Usage:
 *   npx tsx src/agents/runner.ts [agent-name|all]
 *
 * Agent names:
 *   audit          — Schema auditor (daily completeness scoring)
 *   heal           — Schema healer (auto-fill missing data)
 *   validate-links — Link validator (weekly URL checking)
 *   freshness      — Freshness agent (detect stale entities)
 *   rank           — Ranking agent (recalculate leaderboard scores)
 *   media          — Media agent (generate narration episodes)
 *   ingest         — Ingestion agent (discover new entities)
 *   all            — Run all agents sequentially in dependency order
 *
 * Examples:
 *   npx tsx src/agents/runner.ts audit
 *   npx tsx src/agents/runner.ts all
 *   npx tsx src/agents/runner.ts rank freshness
 */

import { logAgentAction } from "./logger";

const AGENT_NAME = "runner";

// Agent registry — maps CLI names to module imports and display names
const AGENT_REGISTRY: Record<string, { label: string; load: () => Promise<{ run: () => Promise<void> }> }> = {
  audit: {
    label: "Schema Auditor",
    load: () => import("./schema-auditor"),
  },
  heal: {
    label: "Schema Healer",
    load: () => import("./schema-healer"),
  },
  "validate-links": {
    label: "Link Validator",
    load: () => import("./link-validator"),
  },
  freshness: {
    label: "Freshness Agent",
    load: () => import("./freshness-agent"),
  },
  rank: {
    label: "Ranking Agent",
    load: () => import("./ranking-agent"),
  },
  media: {
    label: "Media Agent",
    load: () => import("./media-agent"),
  },
  ingest: {
    label: "Ingestion Agent",
    load: () => import("./ingestion-agent"),
  },
};

/**
 * Execution order for "all" mode.
 * Dependencies flow top to bottom:
 * 1. audit -> identifies gaps
 * 2. heal -> fills gaps
 * 3. freshness -> flags stale entities
 * 4. rank -> recalculates scores (uses updated data)
 * 5. validate-links -> checks URLs
 * 6. media -> generates audio for complete entities
 * 7. ingest -> discovers new entities (runs last to avoid processing incomplete data)
 */
const EXECUTION_ORDER = [
  "audit",
  "heal",
  "freshness",
  "rank",
  "validate-links",
  "media",
  "ingest",
];

// Track consecutive failures per agent for alerting
const consecutiveFailures = new Map<string, number>();

interface AgentResult {
  name: string;
  label: string;
  success: boolean;
  durationMs: number;
  error?: string;
}

async function runAgent(name: string): Promise<AgentResult> {
  const entry = AGENT_REGISTRY[name];
  if (!entry) {
    return {
      name,
      label: name,
      success: false,
      durationMs: 0,
      error: `Unknown agent: "${name}". Valid agents: ${Object.keys(AGENT_REGISTRY).join(", ")}`,
    };
  }

  const start = Date.now();

  try {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Running: ${entry.label} (${name})`);
    console.log("=".repeat(60));

    const agentModule = await entry.load();
    await agentModule.run();

    const durationMs = Date.now() - start;

    // Reset consecutive failure counter on success
    consecutiveFailures.set(name, 0);

    console.log(`\n  Completed in ${(durationMs / 1000).toFixed(1)}s`);

    return { name, label: entry.label, success: true, durationMs };
  } catch (err) {
    const durationMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);

    // Track consecutive failures
    const failures = (consecutiveFailures.get(name) || 0) + 1;
    consecutiveFailures.set(name, failures);

    if (failures >= 3) {
      console.error(
        `\n  ALERT: ${entry.label} has failed ${failures} consecutive times!`,
      );
      await logAgentAction(AGENT_NAME, "consecutive_failure_alert", {
        agent: name,
        consecutiveFailures: failures,
      }, false, `${entry.label} has ${failures} consecutive failures`);
    }

    console.error(`\n  Failed after ${(durationMs / 1000).toFixed(1)}s: ${message}`);

    return { name, label: entry.label, success: false, durationMs, error: message };
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("AaaS Self-Healing Agent System");
    console.log("==============================");
    console.log("");
    console.log("Usage: npx tsx src/agents/runner.ts [agent-name|all]");
    console.log("");
    console.log("Available agents:");
    for (const [name, entry] of Object.entries(AGENT_REGISTRY)) {
      console.log(`  ${name.padEnd(18)} ${entry.label}`);
    }
    console.log(`  ${"all".padEnd(18)} Run all agents in dependency order`);
    console.log("");
    console.log("Examples:");
    console.log("  npx tsx src/agents/runner.ts audit");
    console.log("  npx tsx src/agents/runner.ts rank freshness");
    console.log("  npx tsx src/agents/runner.ts all");
    process.exit(0);
  }

  // Determine which agents to run
  let agentsToRun: string[];

  if (args.includes("all")) {
    agentsToRun = EXECUTION_ORDER;
  } else {
    agentsToRun = args;

    // Validate all agent names before running any
    const invalid = agentsToRun.filter((name) => !AGENT_REGISTRY[name]);
    if (invalid.length > 0) {
      console.error(`Unknown agent(s): ${invalid.join(", ")}`);
      console.error(`Valid agents: ${Object.keys(AGENT_REGISTRY).join(", ")}, all`);
      process.exit(1);
    }
  }

  console.log("AaaS Self-Healing Agent System");
  console.log("==============================");
  console.log(`Running ${agentsToRun.length} agent(s): ${agentsToRun.join(", ")}`);
  console.log(`Started at: ${new Date().toISOString()}`);

  const overallStart = Date.now();
  const results: AgentResult[] = [];

  // Run agents sequentially in order
  for (const name of agentsToRun) {
    const result = await runAgent(name);
    results.push(result);
  }

  const overallDuration = Date.now() - overallStart;

  // Print summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("Run Summary");
  console.log("=".repeat(60));

  const successes = results.filter((r) => r.success);
  const failures = results.filter((r) => !r.success);

  for (const result of results) {
    const status = result.success ? "OK" : "FAIL";
    const duration = `${(result.durationMs / 1000).toFixed(1)}s`;
    console.log(
      `  [${status}] ${result.label.padEnd(20)} ${duration}${result.error ? ` — ${result.error}` : ""}`,
    );
  }

  console.log("");
  console.log(
    `${successes.length}/${results.length} agents succeeded in ${(overallDuration / 1000).toFixed(1)}s`,
  );

  // Log the overall run
  await logAgentAction(AGENT_NAME, "run_complete", {
    agents: agentsToRun,
    totalAgents: agentsToRun.length,
    successes: successes.length,
    failures: failures.length,
    totalDurationMs: overallDuration,
    results: results.map((r) => ({
      name: r.name,
      success: r.success,
      durationMs: r.durationMs,
      error: r.error,
    })),
  }, failures.length === 0);

  if (failures.length > 0) {
    console.log(`\nFailed agents: ${failures.map((f) => f.name).join(", ")}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Runner crashed:", err);
  process.exit(1);
});
