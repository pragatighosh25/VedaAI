import { z } from "zod";

export const difficultySchema = z.enum(["easy", "medium", "hard"]);

export const questionSchema = z.object({
  text: z.string().min(1),
  difficulty: difficultySchema,
  marks: z.number().positive(),
});

export const sectionSchema = z.object({
  title: z.string().min(1),
  instruction: z.string().min(1),
  questions: z.array(questionSchema).min(1),
});

export const questionPaperSchema = z.object({
  sections: z.array(sectionSchema).min(1),
});

export type QuestionPaper = z.infer<typeof questionPaperSchema>;
export type Question = z.infer<typeof questionSchema>;
export type Section = z.infer<typeof sectionSchema>;

export function parseQuestionPaper(raw: unknown): QuestionPaper {
  return questionPaperSchema.parse(raw);
}

export function safeParseQuestionPaper(raw: unknown) {
  return questionPaperSchema.safeParse(raw);
}
