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

const MODEL = "llama-3.3-70b-versatile";

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

export async function generateQuestionPaper(
  input: GenerationInput
): Promise<QuestionPaper> {
  if (env.MOCK_AI || !groq) {
    await new Promise((r) => setTimeout(r, 1500));
    return buildMockPaper(input.questionTypes);
  }

  const prompt = buildGenerationPrompt(input);

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You output only valid JSON for exam question papers. Never use markdown. Never add commentary.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 8192,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from AI model");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = extractJson(content);
  }

  const result = safeParseQuestionPaper(parsed);
  if (result.success) {
    return result.data;
  }

  const retry = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "Fix the JSON to match schema: sections[].title, sections[].instruction, sections[].questions[].text, difficulty (easy|medium|hard), marks (number). Output JSON only.",
      },
      {
        role: "user",
        content: `Invalid JSON errors: ${result.error.message}\n\nOriginal:\n${content}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 8192,
    response_format: { type: "json_object" },
  });

  const retryContent = retry.choices[0]?.message?.content;
  if (!retryContent) throw new Error("Retry failed: empty response");

  const retryParsed = JSON.parse(retryContent);
  return parseQuestionPaper(retryParsed);
}

export function generateAnswerKey(paper: QuestionPaper): string[] {
  const answers: string[] = [];
  let index = 1;
  for (const section of paper.sections) {
    for (const q of section.questions) {
      answers.push(
        `${index}. [${q.difficulty}] Sample answer for: ${q.text.slice(0, 80)}${q.text.length > 80 ? "…" : ""} (${q.marks} marks)`
      );
      index++;
    }
  }
  return answers;
}
