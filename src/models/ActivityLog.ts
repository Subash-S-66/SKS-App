import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: string;
  type: string;
  metadata?: any;
  createdAt: Date;
}

const ActivityLogSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    type: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.ActivityLog || mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
