/**
 * TTSProvider — pluggable text-to-speech interface.
 *
 * The Knowledge Index uses this abstraction so the TTS backend can be
 * swapped without touching the media pipeline. The default implementation
 * is a stub that returns a placeholder URL; replace with SuperTonic,
 * ElevenLabs, Google Cloud TTS, or any other provider.
 */

export interface TTSOptions {
  /** Voice identifier (provider-specific) */
  voice?: string;
  /** Speaking rate multiplier (1.0 = normal) */
  speed?: number;
  /** Output format */
  format?: "mp3" | "wav" | "ogg";
}

export interface TTSResult {
  /** URL to the generated audio file */
  audioUrl: string;
  /** Duration in seconds */
  duration: number;
  /** Provider that generated the audio */
  provider: string;
}

export interface TTSProvider {
  name: string;
  /** Generate speech from text */
  synthesize(text: string, options?: TTSOptions): Promise<TTSResult>;
  /** List available voices */
  listVoices(): Promise<{ id: string; name: string; language: string }[]>;
}

// ─── Stub Implementation ─────────────────────────────────────────────

/**
 * StubTTSProvider — returns placeholder audio for development/testing.
 * Replace with a real provider for production.
 */
export class StubTTSProvider implements TTSProvider {
  name = "stub";

  async synthesize(text: string): Promise<TTSResult> {
    // Estimate duration: ~150 words per minute
    const wordCount = text.split(/\s+/).length;
    const duration = Math.round((wordCount / 150) * 60);

    return {
      audioUrl: `https://storage.googleapis.com/aaas-platform.appspot.com/audio/placeholder.mp3`,
      duration,
      provider: "stub",
    };
  }

  async listVoices() {
    return [
      { id: "narrator-1", name: "Index Narrator", language: "en-US" },
      { id: "host-a", name: "Podcast Host A", language: "en-US" },
      { id: "host-b", name: "Podcast Host B", language: "en-US" },
    ];
  }
}

// ─── Provider Factory ────────────────────────────────────────────────

let _provider: TTSProvider = new StubTTSProvider();

export function getTTSProvider(): TTSProvider {
  return _provider;
}

export function setTTSProvider(provider: TTSProvider): void {
  _provider = provider;
}
