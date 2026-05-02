import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEmailLog extends Document {
  recipient: string;
  subject: string;
  projectId?: mongoose.Types.ObjectId;
  type: string;
  status: 'sent' | 'failed';
  error?: string;
  sentAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    recipient: { type: String, required: true },
    subject: { type: String, required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    type: { type: String, required: true },
    status: { type: String, enum: ['sent', 'failed'], required: true },
    error: { type: String },
    sentAt: { type: Date, default: Date.now }
  }
);

export const EmailLog: Model<IEmailLog> = mongoose.models.EmailLog || mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);
