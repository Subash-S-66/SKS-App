import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDeveloperLog {
  developer: mongoose.Types.ObjectId;
  note: string;
  timestamp: Date;
}

export interface IRequirement extends Document {
  projectId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: "pending" | "ongoing" | "completed";
  addedBy: mongoose.Types.ObjectId;
  developerLogs: IDeveloperLog[];
  createdAt: Date;
  updatedAt: Date;
}

const DeveloperLogSchema = new Schema<IDeveloperLog>({
  developer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  note: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const RequirementSchema: Schema<IRequirement> = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "ongoing", "completed"],
      default: "pending",
    },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    developerLogs: [DeveloperLogSchema],
  },
  { timestamps: true }
);

export const Requirement: Model<IRequirement> =
  mongoose.models.Requirement || mongoose.model<IRequirement>("Requirement", RequirementSchema);