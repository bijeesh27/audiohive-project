import logger from "../shared/utils/logger.js";
import { AppError } from "../common/Errors/AppError.js";
import { HttpStatus } from "../common/constant/httpStatus.js";
import type { LiveTranscriptTurnDTO } from "../modules/meeting/application/dto/liveTranscriptDTO.js";

export interface GeneratedActionItem {
  task: string;
  assignee?: string;
  completed: boolean;
  dueDate?: string;
}

export interface GenerateSummaryInput {
  meetingTitle: string;
  turns: LiveTranscriptTurnDTO[];
  customNotes?: string;
  participants?: string[];
}

export interface GeneratedSummaryOutput {
  title: string;
  overview: string;
  keyPoints: string[];
  actionItems: GeneratedActionItem[];
  decisions: string[];
  sentiment: string;
  keywords: string[];
  speakers: string[];
  durationMinutes: number;
  totalTurns: number;
  modelUsed: string;
  transcriptSnippet: string;
}

interface GroqChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

export class GroqSummaryService {
  private readonly apiUrl = "https://api.groq.com/openai/v1/chat/completions";
  private readonly defaultModels = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "llama-3.3-70b-versatile",
  ];

  private getModelsToTry(): string[] {
    const envModel = process.env.GROQ_SUMMARY_MODEL?.trim();
    if (envModel) {
      return [envModel, ...this.defaultModels.filter((m) => m !== envModel)];
    }
    return this.defaultModels;
  }

  private getApiKey(): string | null {
    const key = process.env.GROQ_API_KEY?.trim();
    if (!key || key === "your_groq_api_key_here") {
      return null;
    }
    return key;
  }

  /**
   * Generates a structured meeting summary from live transcript turns and/or custom notes using Groq LLM.
   */
  async generateSummary(input: GenerateSummaryInput): Promise<GeneratedSummaryOutput> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new AppError(
        "GROQ_API_KEY is not configured in backend/.env",
        HttpStatus.BAD_REQUEST
      );
    }

    const { meetingTitle, turns, customNotes, participants = [] } = input;
    const hasTurns = Array.isArray(turns) && turns.length > 0;
    const hasNotes = Boolean(customNotes && customNotes.trim().length > 0);

    if (!hasTurns && !hasNotes) {
      throw new AppError(
        "Cannot generate summary: no live transcript or custom notes found for this meeting.",
        HttpStatus.BAD_REQUEST
      );
    }

    const speakersSet = new Set<string>(participants.filter(Boolean));
    turns.forEach((t) => {
      if (t.speakerName) speakersSet.add(t.speakerName);
    });
    const speakers = Array.from(speakersSet);

    let durationMinutes = 0;
    if (turns.length >= 2) {
      const firstTs = turns[0].timestamp;
      const lastTs = turns[turns.length - 1].timestamp;
      durationMinutes = Math.max(1, Math.round((lastTs - firstTs) / 60000));
    } else if (turns.length === 1) {
      durationMinutes = 1;
    }

    const formattedTranscript = hasTurns
      ? turns
          .map((t) => `[${t.speakerName || "Speaker"}]: ${t.text}`)
          .join("\n")
      : "";

    // Keep prompt within safe token bounds (~24k chars)
    const maxTranscriptChars = 24000;
    const truncatedTranscript =
      formattedTranscript.length > maxTranscriptChars
        ? formattedTranscript.slice(0, maxTranscriptChars) + "\n...[transcript truncated]"
        : formattedTranscript;

    const transcriptSnippet = formattedTranscript.slice(0, 500);

    const systemPrompt = `You are an expert AI meeting assistant. Analyze the provided meeting transcript and/or notes and return ONLY a valid JSON object (no markdown fences, no extra text) with this exact structure:
{
  "title": "Concise descriptive meeting title",
  "overview": "2-4 sentence executive summary of what was discussed and accomplished",
  "keyPoints": ["bullet point 1", "bullet point 2"],
  "actionItems": [
    {
      "task": "Clear actionable task",
      "assignee": "Person responsible or Unassigned",
      "completed": false,
      "dueDate": "Optional timeframe or empty string"
    }
  ],
  "decisions": ["Key decision made 1"],
  "sentiment": "Positive | Constructive | Neutral | Tense | Productive",
  "keywords": ["topic1", "topic2", "topic3"]
}`;

    const userPromptParts = [
      `Meeting Title: ${meetingTitle}`,
      speakers.length > 0 ? `Participants: ${speakers.join(", ")}` : "",
      truncatedTranscript ? `\nTranscript:\n${truncatedTranscript}` : "",
      hasNotes ? `\nAdditional Context / Notes:\n${customNotes!.trim()}` : "",
    ].filter(Boolean);

    try {
      const models = this.getModelsToTry();
      let content: string | undefined;
      let usedModel = models[0];
      let lastStatus = 500;

      for (const model of models) {
        const response = await fetch(this.apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPromptParts.join("\n") },
            ],
            temperature: 0.2,
            response_format: { type: "json_object" },
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as GroqChatResponse;
          content = data.choices?.[0]?.message?.content;
          usedModel = model;
          break;
        }

        lastStatus = response.status;
        const errText = await response.text();
        logger.warn(`[GroqSummary] Model ${model} failed (HTTP ${response.status}): ${errText}`);

        // Retry next model only if model is not found / unavailable
        if (response.status !== 404 && response.status !== 400) {
          throw new AppError(
            `Groq AI summary generation failed (HTTP ${response.status})`,
            HttpStatus.BAD_GATEWAY
          );
        }
      }

      if (!content) {
        throw new AppError(
          `Groq AI summary generation failed (HTTP ${lastStatus})`,
          HttpStatus.BAD_GATEWAY
        );
      }

      const cleanedContent = content
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");

      const parsed = JSON.parse(cleanedContent) as Partial<GeneratedSummaryOutput>;

      return {
        title: parsed.title || meetingTitle,
        overview: parsed.overview || "Summary generated from meeting activity.",
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map(String) : [],
        actionItems: Array.isArray(parsed.actionItems)
          ? parsed.actionItems.map((item) => ({
              task: String(item.task || ""),
              assignee: item.assignee ? String(item.assignee) : undefined,
              completed: Boolean(item.completed),
              dueDate: item.dueDate ? String(item.dueDate) : undefined,
            }))
          : [],
        decisions: Array.isArray(parsed.decisions) ? parsed.decisions.map(String) : [],
        sentiment: parsed.sentiment ? String(parsed.sentiment) : "Neutral",
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : [],
        speakers,
        durationMinutes,
        totalTurns: turns.length,
        modelUsed: usedModel,
        transcriptSnippet,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error("[GroqSummary] Unexpected error generating summary:", error);
      throw new AppError(
        "Failed to generate AI meeting summary",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export const groqSummaryService = new GroqSummaryService();
