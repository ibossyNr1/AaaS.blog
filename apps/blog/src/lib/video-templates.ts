/**
 * Video Template System
 *
 * Defines structured scene descriptions for auto-generated entity spotlight
 * and daily roundup videos. Templates produce scene metadata (not actual video
 * frames) — an external renderer picks up the job from the video_queue and
 * turns scenes into rendered video.
 */

// ─── Interfaces ──────────────────────────────────────────────────────

export interface VideoScene {
  /** Scene index (0-based) */
  index: number;
  /** Human-readable scene label */
  label: string;
  /** Start frame (inclusive) */
  startFrame: number;
  /** End frame (exclusive) */
  endFrame: number;
  /** Duration in seconds */
  durationSeconds: number;
  /** Visual elements to render */
  elements: VideoElement[];
  /** Scene transition type */
  transition: "cut" | "fade" | "slide" | "zoom";
  /** Background style */
  background: {
    type: "solid" | "gradient" | "branded";
    colors: string[];
  };
}

export interface VideoElement {
  type: "text" | "badge" | "logo" | "score" | "list" | "cta";
  content: string;
  style: {
    fontSize?: number;
    fontFamily?: "Inter" | "JetBrains Mono";
    fontWeight?: number;
    color?: string;
    position?: { x: number; y: number };
    alignment?: "left" | "center" | "right";
  };
  /** Animation applied to this element */
  animation?: {
    type: "fade-in" | "slide-up" | "typewriter" | "scale-in" | "stagger";
    delayFrames: number;
    durationFrames: number;
  };
}

export interface VideoTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  durationFrames: number;
  render: (data: EntitySpotlightData | DailyRoundupData) => VideoScene[];
}

export interface EntitySpotlightData {
  name: string;
  type: string;
  provider: string;
  description: string;
  composite: number;
  grade: string;
  capabilities: string[];
  audioUrl?: string;
}

export interface DailyRoundupData {
  date: string;
  entities: EntitySpotlightData[];
  channel: string;
}

// ─── Brand constants ────────────────────────────────────────────────

const BRAND = {
  basaltDeep: "#080809",
  circuitGlow: "#00f3ff",
  accentRed: "#F43F6C",
  white: "#FAFAF8",
  dimText: "#9CA3AF",
};

// ─── Entity Spotlight Template (60 seconds @ 30fps = 1800 frames) ───

export const entitySpotlightTemplate: VideoTemplate = {
  id: "entity-spotlight",
  name: "Entity Spotlight",
  width: 1920,
  height: 1080,
  fps: 30,
  durationFrames: 1800,

  render(data: EntitySpotlightData | DailyRoundupData): VideoScene[] {
    const d = data as EntitySpotlightData;

    return [
      // Scene 1 (0-5s): AaaS logo reveal + "Knowledge Index" text
      {
        index: 0,
        label: "Logo Reveal",
        startFrame: 0,
        endFrame: 150,
        durationSeconds: 5,
        transition: "fade",
        background: {
          type: "gradient",
          colors: [BRAND.basaltDeep, "#0a0a0b"],
        },
        elements: [
          {
            type: "logo",
            content: "AaaS",
            style: {
              fontSize: 96,
              fontFamily: "Inter",
              fontWeight: 800,
              color: BRAND.circuitGlow,
              position: { x: 960, y: 460 },
              alignment: "center",
            },
            animation: { type: "scale-in", delayFrames: 15, durationFrames: 45 },
          },
          {
            type: "text",
            content: "Knowledge Index",
            style: {
              fontSize: 36,
              fontFamily: "JetBrains Mono",
              fontWeight: 400,
              color: BRAND.dimText,
              position: { x: 960, y: 560 },
              alignment: "center",
            },
            animation: { type: "fade-in", delayFrames: 60, durationFrames: 30 },
          },
        ],
      },

      // Scene 2 (5-20s): Entity name, type badge, provider
      {
        index: 1,
        label: "Entity Introduction",
        startFrame: 150,
        endFrame: 600,
        durationSeconds: 15,
        transition: "slide",
        background: {
          type: "branded",
          colors: [BRAND.basaltDeep, "#0d1117"],
        },
        elements: [
          {
            type: "text",
            content: d.name,
            style: {
              fontSize: 72,
              fontFamily: "Inter",
              fontWeight: 700,
              color: BRAND.white,
              position: { x: 960, y: 400 },
              alignment: "center",
            },
            animation: { type: "slide-up", delayFrames: 0, durationFrames: 30 },
          },
          {
            type: "badge",
            content: d.type.toUpperCase(),
            style: {
              fontSize: 24,
              fontFamily: "JetBrains Mono",
              fontWeight: 600,
              color: BRAND.circuitGlow,
              position: { x: 960, y: 500 },
              alignment: "center",
            },
            animation: { type: "fade-in", delayFrames: 30, durationFrames: 20 },
          },
          {
            type: "text",
            content: `by ${d.provider}`,
            style: {
              fontSize: 32,
              fontFamily: "Inter",
              fontWeight: 400,
              color: BRAND.dimText,
              position: { x: 960, y: 570 },
              alignment: "center",
            },
            animation: { type: "fade-in", delayFrames: 50, durationFrames: 20 },
          },
        ],
      },

      // Scene 3 (20-40s): Capabilities animating in, composite score + grade
      {
        index: 2,
        label: "Capabilities & Score",
        startFrame: 600,
        endFrame: 1200,
        durationSeconds: 20,
        transition: "fade",
        background: {
          type: "branded",
          colors: [BRAND.basaltDeep, "#0d1117"],
        },
        elements: [
          {
            type: "list",
            content: d.capabilities.slice(0, 6).join("\n"),
            style: {
              fontSize: 28,
              fontFamily: "Inter",
              fontWeight: 500,
              color: BRAND.white,
              position: { x: 200, y: 300 },
              alignment: "left",
            },
            animation: { type: "stagger", delayFrames: 0, durationFrames: 180 },
          },
          {
            type: "score",
            content: String(d.composite),
            style: {
              fontSize: 120,
              fontFamily: "JetBrains Mono",
              fontWeight: 800,
              color: BRAND.circuitGlow,
              position: { x: 1400, y: 400 },
              alignment: "center",
            },
            animation: { type: "scale-in", delayFrames: 90, durationFrames: 40 },
          },
          {
            type: "badge",
            content: `Grade: ${d.grade}`,
            style: {
              fontSize: 36,
              fontFamily: "JetBrains Mono",
              fontWeight: 600,
              color: BRAND.accentRed,
              position: { x: 1400, y: 530 },
              alignment: "center",
            },
            animation: { type: "fade-in", delayFrames: 140, durationFrames: 20 },
          },
        ],
      },

      // Scene 4 (40-55s): Description text
      {
        index: 3,
        label: "Description",
        startFrame: 1200,
        endFrame: 1650,
        durationSeconds: 15,
        transition: "fade",
        background: {
          type: "gradient",
          colors: [BRAND.basaltDeep, "#0a0a0b"],
        },
        elements: [
          {
            type: "text",
            content: d.description.length > 300 ? d.description.slice(0, 297) + "..." : d.description,
            style: {
              fontSize: 32,
              fontFamily: "Inter",
              fontWeight: 400,
              color: BRAND.white,
              position: { x: 960, y: 540 },
              alignment: "center",
            },
            animation: { type: "typewriter", delayFrames: 0, durationFrames: 180 },
          },
        ],
      },

      // Scene 5 (55-60s): CTA "Explore at aaas.blog"
      {
        index: 4,
        label: "Call to Action",
        startFrame: 1650,
        endFrame: 1800,
        durationSeconds: 5,
        transition: "fade",
        background: {
          type: "gradient",
          colors: [BRAND.basaltDeep, "#0d1117"],
        },
        elements: [
          {
            type: "cta",
            content: "Explore at aaas.blog",
            style: {
              fontSize: 48,
              fontFamily: "Inter",
              fontWeight: 700,
              color: BRAND.circuitGlow,
              position: { x: 960, y: 500 },
              alignment: "center",
            },
            animation: { type: "scale-in", delayFrames: 0, durationFrames: 30 },
          },
          {
            type: "logo",
            content: "AaaS",
            style: {
              fontSize: 28,
              fontFamily: "JetBrains Mono",
              fontWeight: 600,
              color: BRAND.dimText,
              position: { x: 960, y: 600 },
              alignment: "center",
            },
            animation: { type: "fade-in", delayFrames: 20, durationFrames: 20 },
          },
        ],
      },
    ];
  },
};

// ─── Daily Roundup Template (120 seconds @ 30fps = 3600 frames) ─────

export const dailyRoundupTemplate: VideoTemplate = {
  id: "daily-roundup",
  name: "Daily Channel Roundup",
  width: 1920,
  height: 1080,
  fps: 30,
  durationFrames: 3600,

  render(data: EntitySpotlightData | DailyRoundupData): VideoScene[] {
    const d = data as DailyRoundupData;
    const scenes: VideoScene[] = [];
    const entities = d.entities.slice(0, 5);

    // Intro (0-10s)
    scenes.push({
      index: 0,
      label: "Roundup Intro",
      startFrame: 0,
      endFrame: 300,
      durationSeconds: 10,
      transition: "fade",
      background: {
        type: "gradient",
        colors: [BRAND.basaltDeep, "#0d1117"],
      },
      elements: [
        {
          type: "logo",
          content: "AaaS Knowledge Index",
          style: {
            fontSize: 48,
            fontFamily: "Inter",
            fontWeight: 800,
            color: BRAND.circuitGlow,
            position: { x: 960, y: 380 },
            alignment: "center",
          },
          animation: { type: "scale-in", delayFrames: 15, durationFrames: 45 },
        },
        {
          type: "text",
          content: `Daily Roundup — ${d.channel}`,
          style: {
            fontSize: 40,
            fontFamily: "Inter",
            fontWeight: 600,
            color: BRAND.white,
            position: { x: 960, y: 480 },
            alignment: "center",
          },
          animation: { type: "slide-up", delayFrames: 45, durationFrames: 30 },
        },
        {
          type: "text",
          content: d.date,
          style: {
            fontSize: 28,
            fontFamily: "JetBrains Mono",
            fontWeight: 400,
            color: BRAND.dimText,
            position: { x: 960, y: 560 },
            alignment: "center",
          },
          animation: { type: "fade-in", delayFrames: 75, durationFrames: 20 },
        },
      ],
    });

    // Entity segments — evenly spaced in the middle (10s-110s = 100s total)
    const segmentFrames = Math.floor(3000 / Math.max(entities.length, 1));
    const segmentSeconds = segmentFrames / 30;

    entities.forEach((entity, i) => {
      const startFrame = 300 + i * segmentFrames;
      const endFrame = startFrame + segmentFrames;

      scenes.push({
        index: i + 1,
        label: `Entity: ${entity.name}`,
        startFrame,
        endFrame,
        durationSeconds: Math.round(segmentSeconds),
        transition: "slide",
        background: {
          type: "branded",
          colors: [BRAND.basaltDeep, "#0a0a0b"],
        },
        elements: [
          {
            type: "text",
            content: entity.name,
            style: {
              fontSize: 56,
              fontFamily: "Inter",
              fontWeight: 700,
              color: BRAND.white,
              position: { x: 200, y: 300 },
              alignment: "left",
            },
            animation: { type: "slide-up", delayFrames: 0, durationFrames: 25 },
          },
          {
            type: "badge",
            content: entity.type.toUpperCase(),
            style: {
              fontSize: 20,
              fontFamily: "JetBrains Mono",
              fontWeight: 600,
              color: BRAND.circuitGlow,
              position: { x: 200, y: 380 },
              alignment: "left",
            },
            animation: { type: "fade-in", delayFrames: 20, durationFrames: 15 },
          },
          {
            type: "text",
            content: `by ${entity.provider}`,
            style: {
              fontSize: 28,
              fontFamily: "Inter",
              fontWeight: 400,
              color: BRAND.dimText,
              position: { x: 200, y: 430 },
              alignment: "left",
            },
            animation: { type: "fade-in", delayFrames: 30, durationFrames: 15 },
          },
          {
            type: "text",
            content: entity.description.length > 200
              ? entity.description.slice(0, 197) + "..."
              : entity.description,
            style: {
              fontSize: 24,
              fontFamily: "Inter",
              fontWeight: 400,
              color: BRAND.white,
              position: { x: 200, y: 520 },
              alignment: "left",
            },
            animation: { type: "fade-in", delayFrames: 45, durationFrames: 30 },
          },
          {
            type: "score",
            content: String(entity.composite),
            style: {
              fontSize: 80,
              fontFamily: "JetBrains Mono",
              fontWeight: 800,
              color: BRAND.circuitGlow,
              position: { x: 1500, y: 380 },
              alignment: "center",
            },
            animation: { type: "scale-in", delayFrames: 30, durationFrames: 30 },
          },
          {
            type: "badge",
            content: entity.grade,
            style: {
              fontSize: 28,
              fontFamily: "JetBrains Mono",
              fontWeight: 600,
              color: BRAND.accentRed,
              position: { x: 1500, y: 470 },
              alignment: "center",
            },
            animation: { type: "fade-in", delayFrames: 50, durationFrames: 15 },
          },
        ],
      });
    });

    // Outro (110-120s)
    scenes.push({
      index: entities.length + 1,
      label: "Roundup Outro",
      startFrame: 3300,
      endFrame: 3600,
      durationSeconds: 10,
      transition: "fade",
      background: {
        type: "gradient",
        colors: [BRAND.basaltDeep, "#0d1117"],
      },
      elements: [
        {
          type: "cta",
          content: "Explore at aaas.blog",
          style: {
            fontSize: 48,
            fontFamily: "Inter",
            fontWeight: 700,
            color: BRAND.circuitGlow,
            position: { x: 960, y: 480 },
            alignment: "center",
          },
          animation: { type: "scale-in", delayFrames: 0, durationFrames: 30 },
        },
        {
          type: "text",
          content: `${entities.length} entities covered in today's ${d.channel} roundup`,
          style: {
            fontSize: 24,
            fontFamily: "Inter",
            fontWeight: 400,
            color: BRAND.dimText,
            position: { x: 960, y: 570 },
            alignment: "center",
          },
          animation: { type: "fade-in", delayFrames: 30, durationFrames: 20 },
        },
      ],
    });

    return scenes;
  },
};
