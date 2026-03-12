import type { Entity, EntityType, Persona } from "./types";
import { CHANNELS } from "./channels";
import type { Channel } from "./types";

/** Per-persona configuration for feed personalization */
export interface PersonaConfig {
  priorityChannels: string[];
  highlightTypes: EntityType[];
  leaderboardDefault: EntityType;
}

export const PERSONA_CONFIG: Record<Persona, PersonaConfig> = {
  developer: {
    priorityChannels: ["ai-code", "ai-tools"],
    highlightTypes: ["skill", "script"],
    leaderboardDefault: "tool",
  },
  researcher: {
    priorityChannels: ["llms", "speech-audio"],
    highlightTypes: ["model", "benchmark"],
    leaderboardDefault: "model",
  },
  executive: {
    priorityChannels: ["ai-business", "ai-agents"],
    highlightTypes: ["agent"],
    leaderboardDefault: "agent",
  },
  "agent-builder": {
    priorityChannels: ["ai-agents", "ai-code", "ai-tools"],
    highlightTypes: ["agent", "skill"],
    leaderboardDefault: "agent",
  },
  enterprise: {
    priorityChannels: ["ai-business", "ai-infrastructure"],
    highlightTypes: ["tool"],
    leaderboardDefault: "tool",
  },
};

/**
 * Reorder entities based on persona priority.
 * Entities matching the persona's highlight types and priority channels
 * are boosted to the top, while maintaining composite score ordering within tiers.
 */
export function getPersonalizedEntities(persona: Persona, allEntities: Entity[]): Entity[] {
  const config = PERSONA_CONFIG[persona];

  const scored = allEntities.map((entity) => {
    let boost = 0;

    // Boost entities whose type matches the persona's highlighted types
    if (config.highlightTypes.includes(entity.type)) {
      boost += 20;
    }

    // Boost entities in priority channels
    if (config.priorityChannels.includes(entity.category)) {
      boost += 15;
    }

    return { entity, sortScore: entity.scores.composite + boost };
  });

  scored.sort((a, b) => b.sortScore - a.sortScore);
  return scored.map((s) => s.entity);
}

/**
 * Return all channels sorted by relevance to the given persona.
 * Priority channels appear first, others follow in original order.
 */
export function getPersonalizedChannels(persona: Persona): Channel[] {
  const config = PERSONA_CONFIG[persona];
  const priority = new Set(config.priorityChannels);

  const prioritized: Channel[] = [];
  const rest: Channel[] = [];

  for (const ch of CHANNELS) {
    if (priority.has(ch.slug)) {
      prioritized.push(ch);
    } else {
      rest.push(ch);
    }
  }

  // Maintain the priority order from the config
  prioritized.sort(
    (a, b) => config.priorityChannels.indexOf(a.slug) - config.priorityChannels.indexOf(b.slug),
  );

  return [...prioritized, ...rest];
}
