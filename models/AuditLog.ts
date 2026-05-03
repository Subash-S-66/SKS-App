import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  user: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  action: string; // e.g., "REVEALED_CREDENTIAL"
  details: string; // e.g., "Revealed Gmail Password"
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema: Schema<IAuditLog> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    action: { type: String, required: true },
    details: { type: String, required: true },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);