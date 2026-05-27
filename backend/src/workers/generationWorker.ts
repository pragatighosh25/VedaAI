import { Worker } from "bullmq";
import { connectMongo } from "../utils/mongo";
import { redis } from "../utils/redis";
import { GENERATION_QUEUE } from "../queues/generationQueue";
import { Assignment } from "../models/Assignment";
import { User } from "../models/User";
import { generateQuestionPaper, generateAnswerKey } from "../services/aiService";
import { broadcast } from "../socket/socketManager";
import { setCache } from "../utils/redis";

async function updateProgress(
  assignmentId: string,
  progress: number,
  status: "processing" | "completed" | "failed"
) {
  await Assignment.findByIdAndUpdate(assignmentId, { progress, status });
  broadcast(assignmentId, {
    type: "job:progress",
    assignmentId,
    progress,
    status,
  });
}

async function processJob(assignmentId: string) {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new Error("Assignment not found");
  const user = await User.findById(
    assignment.user
  ).select("name schoolName subject className");

  await updateProgress(assignmentId, 10, "processing");

  await updateProgress(assignmentId, 30, "processing");

  const paper = await generateQuestionPaper({
    title: assignment.title,
    dueDate: assignment.dueDate.toISOString(),
    questionTypes: assignment.questionTypes,
    additionalInstructions: assignment.additionalInstructions,
    uploadedFileText: assignment.uploadedFileText,
    teacherProfile: {
      name: user?.name,
      schoolName: user?.schoolName,
      subject: user?.subject,
      className: user?.className,
    },
  });

  await updateProgress(assignmentId, 80, "processing");

  const answerKey = generateAnswerKey(paper);

  assignment.questionPaper = paper;
  assignment.answerKey = answerKey;
  assignment.status = "completed";
  assignment.progress = 100;
  await assignment.save();

  await setCache(`paper:${assignmentId}`, paper);

  broadcast(assignmentId, { type: "job:completed", assignmentId });
  broadcast(assignmentId, {
    type: "job:progress",
    assignmentId,
    progress: 100,
    status: "completed",
  });
}

const worker = new Worker(
  GENERATION_QUEUE,
  async (job) => {
    const { assignmentId } = job.data;
    try {
      await processJob(assignmentId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      await Assignment.findByIdAndUpdate(assignmentId, {
        status: "failed",
        errorMessage: message,
        progress: 0,
      });
      broadcast(assignmentId, { type: "job:failed", assignmentId, error: message });
      throw err;
    }
  },
  { connection: redis, concurrency: 2 }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

connectMongo().then(() => {
  console.log("Generation worker started");
});

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});

process.on("uncaughtException", (err) => {
  console.error("Worker uncaught exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Worker unhandled rejection:", reason);
});
