// Common Whisper silence hallucinations to filter out
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

export async function transcribeAudioBlob(blob: Blob): Promise<string | null> {
  const apiKey = (import.meta.env.VITE_GROQ_API_KEY as string | undefined)?.trim();
  if (!apiKey || apiKey === "your_groq_api_key_here") {
    console.warn("[GroqClient] VITE_GROQ_API_KEY is not configured in frontend/.env");
    return null;
  }

  if (blob.size < 300) {
    return null;
  }

  try {
    const formData = new FormData();
    const ext = blob.type.includes("wav") ? "audio.wav" : "audio.webm";
    formData.append("file", blob, ext);
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("response_format", "json");
    formData.append("temperature", "0.0");

    const startTime = Date.now();
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[GroqClient] Groq API returned ${res.status}:`, errText);
      return null;
    }

    const data = (await res.json()) as { text?: string };
    const rawText = (data.text || "").trim();

    const elapsed = Date.now() - startTime;
    console.log(`[GroqClient] Transcribed in ${elapsed}ms: "${rawText}"`);

    return filterHallucinations(rawText);
  } catch (err) {
    console.error("[GroqClient] Transcription network error:", err);
    return null;
  }
}

function filterHallucinations(text: string): string | null {
  if (!text || text.length < 2) return null;

  const lower = text.toLowerCase().trim();
  if (HALLUCINATED_PHRASES.has(lower)) return null;

  // Check if text has alphanumeric content
  const alphanumeric = lower.replace(/[^a-z0-9]/g, "");
  if (alphanumeric.length < 2) return null;

  return text;
}
