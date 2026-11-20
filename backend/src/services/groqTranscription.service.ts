import logger from "../shared/utils/logger.js";

// Common Whisper silence / background noise hallucinations to filter out
const HALLUCINATED_PHRASES = new Set([
  "thank you.",
  "thank you",
  "thanks for watching.",
  "thanks for watching",
  "thank you for watching.",
  "thank you for watching",
  "you",
  "bye.",
  "bye",
  "goodbye.",
  "goodbye",
  "subscribe",
  "subtitles by",
  "translated by",
  "[silence]",
  "[blank_audio]",
  "(silence)",
  "(music)",
  "[music]",
  "(bell rings)",
  "...",
  ".",
]);

export interface GroqTranscriptionResult {
  success: boolean;
  text?: string;
  language?: string;
  duration?: number;
  error?: string;
}

export class GroqTranscriptionService {
  private readonly apiUrl = "https://api.groq.com/openai/v1/audio/transcriptions";
  private readonly model = "whisper-large-v3-turbo";

  private getApiKey(): string | null {
    const key = process.env.GROQ_API_KEY?.trim();
    if (!key || key === "your_groq_api_key_here") {
      return null;
    }
    return key;
  }

  /**
   * Transcribe an audio buffer (WebM, WAV, OGG, MP3) using Groq Whisper Cloud API.
   */
  async transcribeAudio(
    audioBuffer: Buffer | Uint8Array,
    mimeType: string = "audio/webm",
    fileName: string = "audio.webm"
  ): Promise<GroqTranscriptionResult> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      logger.warn(
        "[GroqTranscription] GROQ_API_KEY is not configured in backend/.env. Live transcription skipped."
      );
      return {
        success: false,
        error: "GROQ_API_KEY is not configured in backend/.env",
      };
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return { success: false, error: "Empty audio buffer" };
    }

    try {
      const formData = new FormData();
      const blob = new Blob([audioBuffer], { type: mimeType });
      formData.append("file", blob, fileName);
      formData.append("model", this.model);
      formData.append("response_format", "json");
      formData.append("temperature", "0.0");

      const startTime = Date.now();
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      const elapsedMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          `[GroqTranscription] API call failed (${response.status}): ${errorText}`
        );
        return {
          success: false,
          error: `Groq API error (${response.status}): ${errorText}`,
        };
      }

      const data = (await response.json()) as { text?: string };
      const rawText = (data.text || "").trim();

      // Clean and validate transcription text
      const cleanText = this.filterHallucinations(rawText);

      if (!cleanText) {
        return { success: true, text: "" };
      }

      logger.info(
        `[GroqTranscription] Transcribed in ${elapsedMs}ms: "${cleanText}"`
      );

      return {
        success: true,
        text: cleanText,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(`[GroqTranscription] Request exception: ${message}`);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Filter out empty or hallucinated noise turns from Whisper.
   */
  private filterHallucinations(text: string): string {
    if (!text || text.length < 2) return "";

    const lower = text.toLowerCase().trim();

    if (HALLUCINATED_PHRASES.has(lower)) {
      return "";
    }

    // Check if only symbols / punctuation
    const alphanumericOnly = lower.replace(/[^a-z0-9]/g, "");
    if (alphanumericOnly.length < 2) {
      return "";
    }

    return text;
  }
}

export const groqTranscriptionService = new GroqTranscriptionService();
