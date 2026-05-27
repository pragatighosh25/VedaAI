import { create } from "zustand";
import type { QuestionTypeRow } from "@/lib/types";
import { QUESTION_TYPE_OPTIONS } from "@/lib/types";

const defaultRows: QuestionTypeRow[] = [
  { id: "1", type: QUESTION_TYPE_OPTIONS[0], count: 4, marksPerQuestion: 1 },
  { id: "2", type: QUESTION_TYPE_OPTIONS[1], count: 3, marksPerQuestion: 2 },
  { id: "3", type: QUESTION_TYPE_OPTIONS[3], count: 5, marksPerQuestion: 5 },
  { id: "4", type: QUESTION_TYPE_OPTIONS[4], count: 5, marksPerQuestion: 5 },
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

interface CreateFormState {
  step: number;
  dueDate: string;
  file: File | null;
  questionTypes: QuestionTypeRow[];
  additionalInstructions: string;
  title: string;
  setStep: (step: number) => void;
  setDueDate: (date: string) => void;
  setFile: (file: File | null) => void;
  setAdditionalInstructions: (text: string) => void;
  setTitle: (title: string) => void;
  addQuestionType: () => void;
  removeQuestionType: (id: string) => void;
  updateQuestionType: (id: string, patch: Partial<QuestionTypeRow>) => void;
  resetForm: () => void;
  getTotals: () => { totalQuestions: number; totalMarks: number };
  validate: () => string | null;
}

export const useCreateFormStore = create<CreateFormState>((set, get) => ({
  step: 1,
  dueDate: "",
  file: null,
  questionTypes: defaultRows.map((r) => ({ ...r, id: uid() })),
  additionalInstructions: "",
  title: "Quiz on Electricity",
  setStep: (step) => set({ step }),
  setDueDate: (dueDate) => set({ dueDate }),
  setFile: (file) => set({ file }),
  setAdditionalInstructions: (additionalInstructions) =>
    set({ additionalInstructions }),
  setTitle: (title) => set({ title }),
  addQuestionType: () =>
    set((s) => ({
      questionTypes: [
        ...s.questionTypes,
        {
          id: uid(),
          type: QUESTION_TYPE_OPTIONS[0],
          count: 1,
          marksPerQuestion: 1,
        },
      ],
    })),
  removeQuestionType: (id) =>
    set((s) => ({
      questionTypes:
        s.questionTypes.length > 1
          ? s.questionTypes.filter((q) => q.id !== id)
          : s.questionTypes,
    })),
  updateQuestionType: (id, patch) =>
    set((s) => ({
      questionTypes: s.questionTypes.map((q) =>
        q.id === id ? { ...q, ...patch } : q
      ),
    })),
  resetForm: () =>
    set({
      step: 1,
      dueDate: "",
      file: null,
      additionalInstructions: "",
      title: "Quiz on Electricity",
      questionTypes: defaultRows.map((r) => ({ ...r, id: uid() })),
    }),
  getTotals: () => {
    const { questionTypes } = get();
    return {
      totalQuestions: questionTypes.reduce((s, q) => s + q.count, 0),
      totalMarks: questionTypes.reduce(
        (s, q) => s + q.count * q.marksPerQuestion,
        0
      ),
    };
  },
  validate: () => {
    const { dueDate, questionTypes } = get();
    if (!dueDate.trim()) return "Due date is required";
    for (const qt of questionTypes) {
      if (!qt.type.trim()) return "Question type cannot be empty";
      if (qt.count < 1) return "Number of questions must be at least 1";
      if (qt.marksPerQuestion <= 0) return "Marks must be greater than 0";
    }
    return null;
  },
}));

interface GenerationState {
  progress: number;
  status: string;
  setProgress: (progress: number, status: string) => void;
  reset: () => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  progress: 0,
  status: "pending",
  setProgress: (progress, status) => set({ progress, status }),
  reset: () => set({ progress: 0, status: "pending" }),
}));
