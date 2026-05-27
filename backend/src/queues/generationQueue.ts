import { Queue } from "bullmq";
import { redis } from "../utils/redis";

export const GENERATION_QUEUE = "question-paper-generation";

export interface GenerationJobData {
  assignmentId: string;
}

export const generationQueue = new Queue<GenerationJobData>(GENERATION_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export async function enqueueGeneration(assignmentId: string) {
  return generationQueue.add(
    "generate",
    { assignmentId }
  );
}
