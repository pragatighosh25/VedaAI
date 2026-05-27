import mongoose, { Schema, Document } from "mongoose";
import type { QuestionPaper } from "../validators/questionPaperSchema";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface IQuestionType {
  type: string;
  count: number;
  marksPerQuestion: number;
}

export interface IAssignment extends Document {
  title: string;
  dueDate: Date;
  questionTypes: IQuestionType[];
  additionalInstructions?: string;
  uploadedFileName?: string;
  uploadedFileText?: string;
  status: JobStatus;
  progress: number;
  errorMessage?: string;
  questionPaper?: QuestionPaper;
  answerKey?: string[];
  totalQuestions: number;
  totalMarks: number;
  createdAt: Date;
  updatedAt: Date;
  user: mongoose.Types.ObjectId;
  timeAllowed?: string;
}

const questionTypeSchema = new Schema<IQuestionType>(
  {
    type: { type: String, required: true },
    count: { type: Number, required: true, min: 1 },
    marksPerQuestion: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const assignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, default: "Untitled Assignment" },
    dueDate: { type: Date, required: true },
    questionTypes: { type: [questionTypeSchema], required: true },
    additionalInstructions: { type: String },
    uploadedFileName: { type: String },
    uploadedFileText: { type: String },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    progress: { type: Number, default: 0 },
    errorMessage: { type: String },
    questionPaper: { type: Schema.Types.Mixed },
    answerKey: { type: [String] },
    totalQuestions: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    timeAllowed: {
      type: String,
      default: "60 minutes",
    },
  },
  { timestamps: true },
);

export const Assignment = mongoose.model<IAssignment>(
  "Assignment",
  assignmentSchema,
);
