import Redis from "ioredis";
import { env } from "../config/env";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  reconnectOnError: () => true,
  retryStrategy: (times) => Math.min(times * 500, 5000),
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("ready", () => {
  console.log("Redis ready");
});

redis.on("reconnecting", () => {
  console.warn("Redis reconnecting...");
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

export const CACHE_TTL = 3600;

export async function getCached<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
}

export async function setCache(key: string, value: unknown, ttl = CACHE_TTL) {
  await redis.set(key, JSON.stringify(value), "EX", ttl);
}

export async function deleteCache(key: string) {
  await redis.del(key);
}
