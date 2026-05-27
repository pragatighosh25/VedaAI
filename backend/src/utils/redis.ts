import Redis, { RedisOptions }from "ioredis";
import { env } from "../config/env";

function buildRedisOptions(
  forBullMq: boolean
): RedisOptions {
  const isTls = env.REDIS_URL.startsWith("rediss://");

  return {
    maxRetriesPerRequest: forBullMq ? null : 3,
    enableReadyCheck: true,
    reconnectOnError: () => true,
    retryStrategy: (times : number) => Math.min(times * 500, 5000),
    connectTimeout: 15000,
    ...(isTls ? { tls: {} } : {}),
  };
}

export function createRedisClient(
  label: string,
  forBullMq = false
) {
  const client = new Redis(
    env.REDIS_URL,
    buildRedisOptions(forBullMq)
  );

  client.on("connect", () => {
    console.log(`Redis (${label}) connected`);
  });

  client.on("ready", () => {
    console.log(`Redis (${label}) ready`);
  });

  client.on("reconnecting", () => {
    console.warn(`Redis (${label}) reconnecting...`);
  });

  client.on("error", (err) => {
    console.error(
      `Redis (${label}) error:`,
      err.message
    );
  });

  return client;
}

/** General-purpose cache client */
export const redis = createRedisClient("cache");

/** Dedicated BullMQ connections (do not share with cache) */
export const queueRedis = createRedisClient(
  "queue",
  true
);
export const workerRedis = createRedisClient(
  "worker",
  true
);

export async function waitForRedis(
  client: Redis,
  label: string,
  timeoutMs = 20000
) {
  if (client.status === "ready") return;

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `Redis (${label}) connection timed out after ${timeoutMs}ms`
        )
      );
    }, timeoutMs);

    client.once("ready", () => {
      clearTimeout(timer);
      resolve();
    });

    client.once("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export const CACHE_TTL = 3600;

export async function getCached<T>(
  key: string
): Promise<T | null> {
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
}

export async function setCache(
  key: string,
  value: unknown,
  ttl = CACHE_TTL
) {
  await redis.set(
    key,
    JSON.stringify(value),
    "EX",
    ttl
  );
}

export async function deleteCache(key: string) {
  await redis.del(key);
}
