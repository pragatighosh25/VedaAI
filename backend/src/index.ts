import http from "http";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { env } from "./config/env";
import { connectMongo } from "./utils/mongo";
import {
  queueRedis,
  waitForRedis,
} from "./utils/redis";
import { startGenerationWorker } from "./workers/generationWorker";
import { assignmentRouter } from "./routes/assignments";
import { errorHandler } from "./middleware/errorHandler";
import { subscribe } from "./socket/socketManager";
import { authRouter } from "./routes/authRoutes";
import { userRouter } from "./routes/userRoutes";
import { Assignment } from "./models/Assignment";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));

app.get("/health", async (_req, res) => {
  try {
    await queueRedis.ping();
    res.json({
      status: "ok",
      mongo: "connected",
      redis: "connected",
      worker: env.START_WORKER,
    });
  } catch (err) {
    res.status(503).json({
      status: "degraded",
      error:
        err instanceof Error
          ? err.message
          : "Health check failed",
    });
  }
});

app.use("/api/assignments", assignmentRouter);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use(errorHandler);

const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", async (ws, req) => {
  const url = new URL(req.url ?? "", `http://${req.headers.host}`);
  const assignmentId = url.searchParams.get("assignmentId");
  const token = url.searchParams.get("token");

  if (!assignmentId || !token) {
    ws.close();
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    const ownsAssignment = await Assignment.exists({
      _id: assignmentId,
      user: decoded.userId,
    });
    if (!ownsAssignment) {
      ws.close();
      return;
    }

    subscribe(assignmentId, ws);
    ws.send(
      JSON.stringify({
        type: "connected",
        assignmentId,
      })
    );
  } catch {
    ws.close();
  }

  ws.on("error", () => {
    ws.close();
  });
});

async function start() {
  await connectMongo();
  await waitForRedis(queueRedis, "queue");

  if (env.START_WORKER) {
    startGenerationWorker().catch((err) => {
      console.error(
        "Failed to start generation worker:",
        err
      );
    });
  }

  server.listen(env.PORT, () => {
    console.log(
      `API running on http://localhost:${env.PORT}`
    );
    console.log(
      `WebSocket on ws://localhost:${env.PORT}/ws`
    );
    console.log(
      `Worker in-process: ${env.START_WORKER ? "enabled" : "disabled"}`
    );
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});
