import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILoginAttempt extends Document {
  ip: string;
  email: string;
  timestamp: Date;
}

const LoginAttemptSchema: Schema<ILoginAttempt> = new Schema({
  ip: { type: String, required: true },
  email: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, expires: 900 }, // Expires after 15 minutes (900 seconds)
});

export const LoginAttempt: Model<ILoginAttempt> =
  mongoose.models.LoginAttempt || mongoose.model<ILoginAttempt>("LoginAttempt", LoginAttemptSchema);