import mongoose from "mongoose";
import { env } from "../config/env";

export async function connectMongo() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("MongoDB connected");
}
