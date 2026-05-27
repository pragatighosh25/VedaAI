import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;

  avatar?: string;

  schoolName: string;
  subject: string;
  className: string;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    schoolName: {
      type: String,
      default: "",
    },

    subject: {
      type: String,
      default: "",
    },

    className: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>(
  "User",
  userSchema
);