import mongoose, { Schema, Document } from "mongoose";

export interface IRequirement extends Document {
  projectId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: "pending" | "ongoing" | "completed";
  addedBy: mongoose.Types.ObjectId;
  developerLogs: {
    developer: mongoose.Types.ObjectId;
    note: string;
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const RequirementSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["pending", "ongoing", "completed"], default: "pending" },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    developerLogs: [
      {
        developer: { type: Schema.Types.ObjectId, ref: "User" },
        note: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Requirement || mongoose.model<IRequirement>("Requirement", RequirementSchema);