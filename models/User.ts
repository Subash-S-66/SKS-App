import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  password?: string; // Optional because we might exclude it in queries
  role: "admin" | "developer" | "bde";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "developer", "bde"], required: true },
  },
  { timestamps: true }
);

// Prevent re-compilation of model in Next.js
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);