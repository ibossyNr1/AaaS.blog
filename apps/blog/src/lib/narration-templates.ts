/**
 * Narration Templates
 *
 * Convert entity data into natural narration scripts ready for TTS synthesis.
 * Each template function returns a plain text string optimized for spoken delivery:
 *   - Short sentences, clear pacing
 *   - Numbers spelled out where appropriate
 *   - Pauses indicated by line breaks
 */

const ENTITY_TYPE_LABELS: Record<string, string> = {
  tool: "Tool",
  model: "Model",
  agent: "Agent",
  skill: "Skill",
  script: "Script",
  benchmark: "Benchmark",
};

const CHANNEL_NAMES: Record<string, string> = {
  llms: "LLMs",
  "ai-tools": "AI Tools and APIs",
  "ai-agents": "AI Agents",
  "computer-vision": "Computer Vision",
  "prompt-engineering": "Prompt Engineering",
  "ai-infrastructure": "AI Infrastructure",
  "ai-safety": "AI Ethics and Safety",
  "ai-business": "AI Business and Strategy",
  "ai-code": "AI for Code",
  "speech-audio": "Speech and Audio AI",
};

/**
 * Entity narration script — 2-3 minute overview of a single entity.
 * Covers: name, type, provider, description, capabilities, scores, category.
 */
export function entityNarrationScript(entity: Record<string, unknown>): string {
  const type = (entity.type as string) || "";
  const typeLabel = ENTITY_TYPE_LABELS[type] || "entity";
  const name = (entity.name as string) || "Unknown";
  const description = (entity.description as string) || "";
  const provider = (entity.provider as string) || "Unknown";
  const version = (entity.version as string) || "";
  const pricingModel = (entity.pricingModel as string) || "";
  const category = (entity.category as string) || "";
  const slug = (entity.slug as string) || "";
  const capabilities = (entity.capabilities as string[]) || [];
  const integrations = (entity.integrations as string[]) || [];
  const useCases = (entity.useCases as string[]) || [];
  const scores = (entity.scores as Record<string, number>) || {};
  const license = (entity.license as string) || "";

  const channelName = CHANNEL_NAMES[category] || category;
  const lines: string[] = [];

  // Intro
  lines.push(
    `This is the AaaS Knowledge Index. Today we're looking at ${name}, a ${typeLabel.toLowerCase()} in the ${channelName} channel.`,
    "",
  );

  // Description
  if (description) {
    lines.push(description, "");
  }

  // Provider and metadata
  const metaParts: string[] = [`${name} is provided by ${provider}`];
  if (version) metaParts.push(`currently at version ${version}`);
  if (pricingModel) metaParts.push(`with a ${pricingModel} pricing model`);
  if (license) metaParts.push(`licensed under ${license}`);
  lines.push(metaParts.join(", ") + ".", "");

  // Capabilities
  if (capabilities.length > 0) {
    const capList = capabilities.slice(0, 5);
    if (capList.length === 1) {
      lines.push(`Its key capability is ${capList[0]}.`);
    } else {
      const last = capList.pop();
      lines.push(`Key capabilities include ${capList.join(", ")}, and ${last}.`);
    }
    lines.push("");
  }

  // Integrations
  if (integrations.length > 0) {
    const intList = integrations.slice(0, 4);
    if (intList.length === 1) {
      lines.push(`It integrates with ${intList[0]}.`);
    } else {
      const last = intList.pop();
      lines.push(`It integrates with ${intList.join(", ")}, and ${last}.`);
    }
    lines.push("");
  }

  // Use cases
  if (useCases.length > 0) {
    const ucList = useCases.slice(0, 4);
    if (ucList.length === 1) {
      lines.push(`A common use case is ${ucList[0]}.`);
    } else {
      const last = ucList.pop();
      lines.push(`Common use cases include ${ucList.join(", ")}, and ${last}.`);
    }
    lines.push("");
  }

  // Scores
  const composite = scores.composite || 0;
  const adoption = scores.adoption || 0;
  const quality = scores.quality || 0;
  const freshness = scores.freshness || 0;

  lines.push(
    `In the Knowledge Index, ${name} has a composite score of ${composite}.`,
    `Breaking that down: adoption is at ${adoption}, quality at ${quality}, and freshness at ${freshness}.`,
    "",
  );

  // Outro
  lines.push(
    `That's ${name} on the AaaS Knowledge Index.`,
    `For the full spec sheet, visit aaas.blog slash ${type} slash ${slug}.`,
  );

  return lines.join("\n");
}

/**
 * Channel digest script — 5-10 minute summary covering multiple entities in a channel.
 * Covers: channel intro, each entity summary, trends.
 */
export function channelDigestScript(
  channel: string,
  entities: Array<Record<string, unknown>>,
): string {
  const channelName = CHANNEL_NAMES[channel] || channel;
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const lines: string[] = [];

  // Intro
  lines.push(
    `AaaS Knowledge Index — ${channelName} Channel Digest for ${date}.`,
    "",
    `Welcome to the ${channelName} digest. Today we're covering ${entities.length} ${entities.length === 1 ? "entity" : "entities"} in this channel.`,
    "",
  );

  // Entity summaries
  entities.forEach((entity, i) => {
    const typeLabel = ENTITY_TYPE_LABELS[(entity.type as string) || ""] || "entity";
    const name = (entity.name as string) || "Unknown";
    const provider = (entity.provider as string) || "Unknown";
    const description = (entity.description as string) || "";
    const scores = (entity.scores as Record<string, number>) || {};
    const capabilities = (entity.capabilities as string[]) || [];

    lines.push(`Number ${i + 1}: ${name}.`);
    lines.push(`${name} is a ${typeLabel.toLowerCase()} by ${provider}.`);

    if (description) {
      // Truncate to first two sentences for digest brevity
      const sentences = description.split(/(?<=[.!?])\s+/).slice(0, 2);
      lines.push(sentences.join(" "));
    }

    if (capabilities.length > 0) {
      lines.push(`Notable capabilities: ${capabilities.slice(0, 3).join(", ")}.`);
    }

    lines.push(`Composite score: ${scores.composite || 0}.`);
    lines.push("");
  });

  // Trends section
  if (entities.length >= 3) {
    const sorted = [...entities].sort(
      (a, b) =>
        ((b.scores as Record<string, number>)?.composite || 0) -
        ((a.scores as Record<string, number>)?.composite || 0),
    );
    const topName = (sorted[0]?.name as string) || "Unknown";
    lines.push(
      `Looking at the trends in ${channelName}, ${topName} currently leads the channel with the highest composite score.`,
      "",
    );
  }

  // Outro
  lines.push(
    `That wraps up today's ${channelName} digest on the AaaS Knowledge Index.`,
    `For full spec sheets and more channels, visit aaas.blog.`,
  );

  return lines.join("\n");
}

/**
 * Weekly trend script — 15 minute overview of top movers, new additions, and notable changes.
 */
export function weeklyTrendScript(
  trending: Array<Record<string, unknown>>,
): string {
  const date = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const lines: string[] = [];

  // Intro
  lines.push(
    `Welcome to the AaaS Knowledge Index Weekly Trend Report for the week of ${date}.`,
    "",
    `This week, we're covering ${trending.length} notable entities across the AI ecosystem.`,
    `Let's start with the top movers.`,
    "",
  );

  // Top movers (first third)
  const topMovers = trending.slice(0, Math.ceil(trending.length / 3));
  if (topMovers.length > 0) {
    lines.push("Top Movers This Week.", "");

    for (const entity of topMovers) {
      const typeLabel = ENTITY_TYPE_LABELS[(entity.type as string) || ""] || "entity";
      const name = (entity.name as string) || "Unknown";
      const provider = (entity.provider as string) || "Unknown";
      const description = (entity.description as string) || "";
      const scores = (entity.scores as Record<string, number>) || {};
      const scoreChange = (entity.scoreChange as number) || 0;

      lines.push(`${name}, a ${typeLabel.toLowerCase()} by ${provider}.`);
      if (description) {
        const sentences = description.split(/(?<=[.!?])\s+/).slice(0, 2);
        lines.push(sentences.join(" "));
      }
      lines.push(`Current composite score: ${scores.composite || 0}.`);
      if (scoreChange > 0) {
        lines.push(`That's up ${scoreChange} points from last week.`);
      } else if (scoreChange < 0) {
        lines.push(`That's down ${Math.abs(scoreChange)} points from last week.`);
      }
      lines.push("");
    }
  }

  // New additions (second third)
  const newAdditions = trending.slice(
    Math.ceil(trending.length / 3),
    Math.ceil((trending.length * 2) / 3),
  );
  if (newAdditions.length > 0) {
    lines.push("New Additions.", "");

    for (const entity of newAdditions) {
      const typeLabel = ENTITY_TYPE_LABELS[(entity.type as string) || ""] || "entity";
      const name = (entity.name as string) || "Unknown";
      const provider = (entity.provider as string) || "Unknown";
      const category = (entity.category as string) || "";
      const channelName = CHANNEL_NAMES[category] || category;

      lines.push(
        `${name} is a new ${typeLabel.toLowerCase()} by ${provider}, filed under the ${channelName} channel.`,
      );
      if (entity.description) {
        const sentences = (entity.description as string).split(/(?<=[.!?])\s+/).slice(0, 1);
        lines.push(sentences.join(" "));
      }
      lines.push("");
    }
  }

  // Notable changes (remaining)
  const notable = trending.slice(Math.ceil((trending.length * 2) / 3));
  if (notable.length > 0) {
    lines.push("Other Notable Changes.", "");

    for (const entity of notable) {
      const name = (entity.name as string) || "Unknown";
      const scores = (entity.scores as Record<string, number>) || {};
      lines.push(
        `${name} now sits at a composite score of ${scores.composite || 0}.`,
      );
    }
    lines.push("");
  }

  // Outro
  lines.push(
    `That's the weekly trend report for the AaaS Knowledge Index.`,
    `For the full leaderboard and detailed spec sheets, visit aaas.blog.`,
    `Subscribe via the Vault at agents-as-a-service.com to get these updates delivered weekly.`,
    `Until next time.`,
  );

  return lines.join("\n");
}
