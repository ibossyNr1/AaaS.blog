/** Audio episode formats */
export type AudioFormat = "narration" | "digest" | "podcast";

/** A single audio episode in the index */
export interface Episode {
  id: string;
  title: string;
  description: string;
  format: AudioFormat;
  /** Duration in seconds */
  duration: number;
  /** URL to the audio file (Firebase Storage or external CDN) */
  audioUrl: string;
  /** ISO date string */
  publishedAt: string;
  /** Entity slug if narration, channel slug if digest, null if podcast */
  sourceRef: string | null;
  /** Entity type if narration */
  sourceType: string | null;
  /** Channel slug for digests */
  channel: string | null;
  /** Tags for filtering */
  tags: string[];
  /** Number of plays */
  playCount: number;
}

/** Media generation job status */
export type MediaJobStatus = "queued" | "processing" | "completed" | "failed";

export interface MediaJob {
  id: string;
  type: "narration" | "digest" | "podcast" | "video-spotlight" | "video-roundup";
  status: MediaJobStatus;
  entitySlug?: string;
  entityType?: string;
  channel?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
  outputUrl?: string;
}

/** Audio format metadata for display */
export const AUDIO_FORMATS: Record<AudioFormat, { label: string; icon: string; description: string }> = {
  narration: {
    label: "Entity Narration",
    icon: "🎙",
    description: "2-3 minute audio overview of a single entity",
  },
  digest: {
    label: "Channel Digest",
    icon: "📡",
    description: "5-10 minute daily summary of new entities in a channel",
  },
  podcast: {
    label: "Weekly Podcast",
    icon: "🎧",
    description: "15-20 minute interactive discussion of top weekly trends",
  },
};
