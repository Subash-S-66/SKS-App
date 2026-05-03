import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmailLog extends Document {
  recipient: string;
  subject: string;
  projectId?: mongoose.Types.ObjectId;
  type: string;
  status: "sent" | "failed";
  sentAt: Date;
}

const EmailLogSchema: Schema<IEmailLog> = new Schema(
  {
    recipient: { type: String, required: true },
    subject: { type: String, required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    type: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed"], required: true },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const EmailLog: Model<IEmailLog> = mongoose.models.EmailLog || mongoose.model<IEmailLog>("EmailLog", EmailLogSchema);