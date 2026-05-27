import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  JWT_SECRET: z.string().default("your_super_secret_key"),
  MONGODB_URI: z.string().default("mongodb://localhost:27017/vedaai"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  GROQ_API_KEY: z.string().optional(),
  MOCK_AI: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);
