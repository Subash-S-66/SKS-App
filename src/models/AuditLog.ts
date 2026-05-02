import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  credentialId: mongoose.Types.ObjectId;
  action: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    credentialId: { type: Schema.Types.ObjectId, ref: "Credential", required: true },
    action: { type: String, required: true, default: "password_revealed" },
  },
  { timestamps: true, updatedAt: false }
);

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);