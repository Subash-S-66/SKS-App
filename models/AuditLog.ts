import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  user: mongoose.Types.ObjectId;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    details: { type: String, required: true },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

export const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
