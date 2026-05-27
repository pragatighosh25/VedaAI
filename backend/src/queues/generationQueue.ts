import { Queue } from "bullmq";
import { queueRedis } from "../utils/redis";

export const GENERATION_QUEUE =
  "question-paper-generation";

export interface GenerationJobData {
  assignmentId: string;
}

export const generationQueue =
  new Queue<GenerationJobData>(
    GENERATION_QUEUE,
    {
      connection: queueRedis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }
  );

export async function enqueueGeneration(
  assignmentId: string
) {
  const job = await generationQueue.add(
    "generate",
    { assignmentId }
  );
  console.log(
    `Enqueued generation job ${job.id} for assignment ${assignmentId}`
  );
  return job;
}
