import mongoose from "mongoose";
import { env } from "../config/env";

export async function connectMongo() {
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB error:", err.message);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });
  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected");
  });
  console.log("MongoDB connected");
}
