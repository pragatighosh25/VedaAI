import { Worker } from "bullmq";
import type { Worker as BullWorker } from "bullmq";
import { connectMongo } from "../utils/mongo";
import {
  workerRedis,
  waitForRedis,
  setCache,
} from "../utils/redis";
import {
  GENERATION_QUEUE,
  generationQueue,
} from "../queues/generationQueue";
import { Assignment } from "../models/Assignment";
import { User } from "../models/User";
import {
  generateQuestionPaper,
} from "../services/aiService";
import { broadcast } from "../socket/socketManager";

let workerInstance: BullWorker | null =
  null;

async function updateProgress(
  assignmentId: string,
  progress: number,
  status: "processing" | "completed" | "failed"
) {
  await Assignment.findByIdAndUpdate(
    assignmentId,
    { progress, status }
  );
  broadcast(assignmentId, {
    type: "job:progress",
    assignmentId,
    progress,
    status,
  });
}

async function processJob(
  assignmentId: string
) {
  const assignment =
    await Assignment.findById(
      assignmentId
    );
  if (!assignment) {
    throw new Error(
      "Assignment not found"
    );
  }

  const user = await User.findById(
    assignment.user
  ).select(
    "name schoolName subject className"
  );

  await updateProgress(
    assignmentId,
    10,
    "processing"
  );
  await updateProgress(
    assignmentId,
    30,
    "processing"
  );

  const paper =
    await generateQuestionPaper({
      title: assignment.title,
      dueDate:
        assignment.dueDate.toISOString(),
      questionTypes:
        assignment.questionTypes,
      additionalInstructions:
        assignment.additionalInstructions,
      uploadedFileText:
        assignment.uploadedFileText,
      teacherProfile: {
        name: user?.name,
        schoolName: user?.schoolName,
        subject: user?.subject,
        className: user?.className,
      },
    });

  await updateProgress(
    assignmentId,
    80,
    "processing"
  );

  assignment.questionPaper = paper;
  assignment.answerKey = [];
  assignment.status = "completed";
  assignment.progress = 100;
  await assignment.save();

  await setCache(
    `paper:${assignmentId}`,
    paper
  );

  broadcast(assignmentId, {
    type: "job:completed",
    assignmentId,
  });
  broadcast(assignmentId, {
    type: "job:progress",
    assignmentId,
    progress: 100,
    status: "completed",
  });
}

async function recoverPendingJobs() {
  const stuck =
    await Assignment.find({
      status: "pending",
    }).select("_id progress");

  for (const assignment of stuck) {
    await generationQueue.add(
      "generate",
      {
        assignmentId: assignment.id,
      }
    );
    console.log(
      `Recovered pending assignment ${assignment.id}`
    );
  }
}

export async function startGenerationWorker() {
  if (workerInstance) {
    console.log(
      "Generation worker already running"
    );
    return workerInstance;
  }

  await connectMongo();
  await waitForRedis(
    workerRedis,
    "worker"
  );

  workerInstance = new Worker(
    GENERATION_QUEUE,
    async (job) => {
      const { assignmentId } = job.data;
      try {
        await processJob(assignmentId);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Generation failed";
        await Assignment.findByIdAndUpdate(
          assignmentId,
          {
            status: "failed",
            errorMessage: message,
            progress: 0,
          }
        );
        broadcast(assignmentId, {
          type: "job:failed",
          assignmentId,
          error: message,
        });
        throw err;
      }
    },
    {
      connection: workerRedis,
      concurrency: 2,
    }
  );

  workerInstance.on(
    "completed",
    (job) => {
      console.log(
        `Job ${job.id} completed`
      );
    }
  );

  workerInstance.on(
    "failed",
    (job, err) => {
      console.error(
        `Job ${job?.id} failed:`,
        err.message
      );
    }
  );

  workerInstance.on("error", (err) => {
    console.error(
      "Worker error:",
      err.message
    );
  });

  await recoverPendingJobs();
  console.log(
    "Generation worker started"
  );
  return workerInstance;
}

/** Standalone worker process entry (local dev / separate deploy) */
if (
  require.main === module
) {
  startGenerationWorker().catch(
    (err) => {
      console.error(
        "Failed to start worker:",
        err
      );
      process.exit(1);
    }
  );

  process.on(
    "SIGTERM",
    async () => {
      await workerInstance?.close();
      process.exit(0);
    }
  );

  process.on(
    "uncaughtException",
    (err) => {
      console.error(
        "Worker uncaught exception:",
        err
      );
    }
  );

  process.on(
    "unhandledRejection",
    (reason) => {
      console.error(
        "Worker unhandled rejection:",
        reason
      );
    }
  );
}
