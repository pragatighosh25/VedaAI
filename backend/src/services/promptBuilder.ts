import type { IQuestionType } from "../models/Assignment";

export interface GenerationInput {
  title: string;
  dueDate: string;
  questionTypes: IQuestionType[];
  additionalInstructions?: string;
  uploadedFileText?: string;
  teacherProfile?: {
    name?: string;
    schoolName?: string;
    subject?: string;
    className?: string;
  };
}

export type { IQuestionType };

export function buildGenerationPrompt(input: GenerationInput): string {
  const typesSummary = input.questionTypes
    .map(
      (qt) =>
        `- ${qt.type}: ${qt.count} questions, ${qt.marksPerQuestion} marks each`
    )
    .join("\n");

  const totalQuestions = input.questionTypes.reduce((s, q) => s + q.count, 0);
  const totalMarks = input.questionTypes.reduce(
    (s, q) => s + q.count * q.marksPerQuestion,
    0
  );

  let prompt = `You are an expert exam paper creator for Indian schools (CBSE/NCERT style).

Create a structured question paper as valid JSON ONLY. No markdown, no code fences, no explanation text.

Assignment: ${input.title}
Due date context: ${input.dueDate}

Question structure required:
${typesSummary}

Total questions: ${totalQuestions}
Total marks: ${totalMarks}

Group questions into logical sections (Section A, Section B, etc.) matching question types.
Each section needs a title, instruction (e.g. "Attempt all questions. Each question carries X marks"), and questions array.

Each question must have:
- text: full question text
- difficulty: exactly one of "easy", "medium", "hard"
- marks: positive number matching the specification

Return ONLY this JSON shape:
{
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions",
      "questions": [
        { "text": "...", "difficulty": "easy", "marks": 2 }
      ]
    }
  ]
}`;

  if (input.additionalInstructions?.trim()) {
    prompt += `\n\nTeacher instructions:\n${input.additionalInstructions.trim()}`;
  }

  if (input.teacherProfile) {
    const {
      name = "Teacher",
      schoolName = "Not provided",
      subject = "Not provided",
      className = "Not provided",
    } = input.teacherProfile;
    prompt += `\n\nTeacher profile context:
- Teacher: ${name}
- School: ${schoolName}
- Subject: ${subject}
- Class: ${className}`;
  }

  if (input.uploadedFileText?.trim()) {
    prompt += `\n\nReference material from uploaded document:\n${input.uploadedFileText.slice(0, 8000)}`;
  }

  return prompt;
}
