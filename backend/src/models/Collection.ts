import mongoose, { Schema, Document } from "mongoose";

export interface ICollection extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  resources: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const collectionSchema = new Schema<ICollection>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    resources: [
      {
        type: Schema.Types.ObjectId,
        ref: "SavedResource",
      },
    ],
  },
  { timestamps: true }
);

export const Collection = mongoose.model<ICollection>(
  "Collection",
  collectionSchema
);
