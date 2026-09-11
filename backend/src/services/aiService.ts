import Groq from "groq-sdk";
import { env } from "../config/env";
import type { IQuestionType } from "../models/Assignment";
import {
  parseQuestionPaper,
  safeParseQuestionPaper,
  type QuestionPaper,
} from "../validators/questionPaperSchema";
import { buildGenerationPrompt, type GenerationInput } from "./promptBuilder";

const groq = env.GROQ_API_KEY ? new Groq({ apiKey: env.GROQ_API_KEY }) : null;

// Primary and candidate fallback models for Groq
const GROQ_MODELS = Array.from(
  new Set([
    env.AI_MODEL || "groq/compound",
    "groq/compound",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.6-27b",
    "llama-3.3-70b-versatile",
  ])
);

function buildMockPaper(questionTypes: IQuestionType[]): QuestionPaper {
  const sections = questionTypes.map((qt, i) => {
    const difficulties: Array<"easy" | "medium" | "hard"> = ["easy", "medium", "hard"];
    return {
      title: `Section ${String.fromCharCode(65 + i)}`,
      instruction: `Attempt all questions. Each question carries ${qt.marksPerQuestion} marks.`,
      questions: Array.from({ length: qt.count }, (_, j) => ({
        text: `${qt.type} — Question ${j + 1}: Explain the key concept with examples.`,
        difficulty: difficulties[j % 3],
        marks: qt.marksPerQuestion,
      })),
    };
  });
  return { sections };
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("No JSON object found in AI response");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

async function generateWithGemini(
  apiKey: string,
  prompt: string
): Promise<string> {
  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You output only valid JSON matching the schema for question papers. Do not wrap in markdown unless needed. Prompt:\n${prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        }),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Gemini (${model}) HTTP ${res.status}: ${errorBody}`);
      }

      const data = (await res.json()) as any;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err: any) {
      lastError = err;
      console.warn(`[aiService] Gemini ${model} failed: ${err.message}. Trying next...`);
    }
  }

  throw lastError || new Error("All Gemini models failed");
}

async function generateWithGroq(prompt: string): Promise<string> {
  if (!groq) throw new Error("Groq API client is not configured");

  let lastError: Error | null = null;

  for (const model of GROQ_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert exam creator. You MUST output ONLY valid JSON containing exam question papers matching the requested schema. Never add conversational text or commentary.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 8192,
      });

      const content = completion.choices[0]?.message?.content;
      if (content && content.trim().length > 0) {
        return content;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[aiService] Groq model '${model}' failed: ${err.message}. Trying next fallback model...`);
    }
  }

  throw lastError || new Error("All Groq models failed");
}

export async function generateQuestionPaper(
  input: GenerationInput
): Promise<QuestionPaper> {
  if (env.MOCK_AI || (!groq && !env.GEMINI_API_KEY)) {
    await new Promise((r) => setTimeout(r, 1500));
    return buildMockPaper(input.questionTypes);
  }

  const prompt = buildGenerationPrompt(input);
  let rawContent: string | null = null;
  let lastError: Error | null = null;

  // 1. Try Groq if configured
  if (groq) {
    try {
      rawContent = await generateWithGroq(prompt);
    } catch (err: any) {
      console.error("[aiService] Groq generation failed:", err.message);
      lastError = err;
    }
  }

  // 2. Try Gemini fallback if configured
  if (!rawContent && env.GEMINI_API_KEY) {
    try {
      rawContent = await generateWithGemini(env.GEMINI_API_KEY, prompt);
    } catch (err: any) {
      console.error("[aiService] Gemini generation failed:", err.message);
      lastError = err;
    }
  }

  if (!rawContent) {
    console.warn("[aiService] All AI providers failed. Falling back to mock paper generation.");
    return buildMockPaper(input.questionTypes);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    parsed = extractJson(rawContent);
  }

  const result = safeParseQuestionPaper(parsed);
  if (result.success) {
    return result.data;
  }

  // Schema fix / retry attempt
  try {
    const fixPrompt = `Fix the following JSON to strictly match schema: sections[].title (string), sections[].instruction (string), sections[].questions[].text (string), difficulty ("easy"|"medium"|"hard"), marks (number). Output JSON only.\n\nValidation errors: ${result.error.message}\n\nOriginal:\n${rawContent}`;
    let retryContent: string | null = null;

    if (groq) {
      retryContent = await generateWithGroq(fixPrompt);
    } else if (env.GEMINI_API_KEY) {
      retryContent = await generateWithGemini(env.GEMINI_API_KEY, fixPrompt);
    }

    if (retryContent) {
      let retryParsed: unknown;
      try {
        retryParsed = JSON.parse(retryContent);
      } catch {
        retryParsed = extractJson(retryContent);
      }
      return parseQuestionPaper(retryParsed);
    }
  } catch (fixErr: any) {
    console.warn("[aiService] Retry fix failed:", fixErr.message);
  }

  return buildMockPaper(input.questionTypes);
}

