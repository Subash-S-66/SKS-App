import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: string;
  type: 'requirement' | 'payment' | 'demo' | 'status' | 'credential' | 'link' | 'team' | 'email' | 'general';
  metadata?: any;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    type: {
      type: String,
      enum: ['requirement', 'payment', 'demo', 'status', 'credential', 'link', 'team', 'email', 'general'],
      default: 'general'
    },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ActivityLog: Model<IActivityLog> = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
