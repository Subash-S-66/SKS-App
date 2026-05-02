import mongoose, { Schema, Document } from "mongoose";

export interface ILoginAttempt extends Document {
  ipAddress: string;
  attempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  isLocked(): boolean;
}

const LoginAttemptSchema = new Schema(
  {
    ipAddress: {
      type: String,
      required: true,
      unique: true,
    },
    attempts: {
      type: Number,
      required: true,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Add method to check if IP is locked
LoginAttemptSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

export default mongoose.models.LoginAttempt || mongoose.model<ILoginAttempt>("LoginAttempt", LoginAttemptSchema);