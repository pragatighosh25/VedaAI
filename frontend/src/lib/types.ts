export type Difficulty = "easy" | "medium" | "hard";

export interface Question {
  text: string;
  difficulty: Difficulty;
  marks: number;
}

export interface PaperSection {
  title: string;
  instruction: string;
  questions: Question[];
}

export interface QuestionPaper {
  sections: PaperSection[];
}

export interface QuestionTypeRow {
  id: string;
  type: string;
  count: number;
  marksPerQuestion: number;
}

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface Assignment {
  _id: string;
  title: string;
  dueDate: string;
  questionTypes: {
    type: string;
    count: number;
    marksPerQuestion: number;
  }[];
  status: JobStatus;
  progress: number;
  totalQuestions: number;
  totalMarks: number;
  createdAt: string;
  errorMessage?: string;
}

export const QUESTION_TYPE_OPTIONS = [
  "Multiple Choice Questions",
  "Short Questions",
  "Long Answer Questions",
  "Diagram/Graph-Based Questions",
  "Numerical Problems",
  "Fill in the Blanks",
  "True/False",
] as const;
