import mongoose, { Schema, Document } from "mongoose";

export interface ISavedResource extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  publisher: string;
  type: "video" | "book" | "article" | "paper";
  createdAt: Date;
  updatedAt: Date;
}

const savedResourceSchema = new Schema<ISavedResource>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    url: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      default: "",
    },
    publisher: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["video", "book", "article", "paper"],
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate saves of the same url for a single user
savedResourceSchema.index({ user: 1, url: 1 }, { unique: true });

export const SavedResource = mongoose.model<ISavedResource>(
  "SavedResource",
  savedResourceSchema
);
