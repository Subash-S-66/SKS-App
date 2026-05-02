import mongoose, { Schema, Document } from "mongoose";

export interface ICredential extends Document {
  projectId: mongoose.Types.ObjectId;
  type: "gmail" | "hosting" | "domain" | "other";
  label?: string;
  username?: string;
  password?: string;
  provider?: string;
  startDate?: Date;
  freeDays?: number;
  expiryDate?: Date;
  customDomain?: boolean;
  domainName?: string;
  domainExpiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CredentialSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    type: { type: String, enum: ["gmail", "hosting", "domain", "other"], required: true },
    label: { type: String },
    username: { type: String },
    password: { type: String },
    provider: { type: String },
    startDate: { type: Date },
    freeDays: { type: Number },
    expiryDate: { type: Date },
    customDomain: { type: Boolean, default: false },
    domainName: { type: String },
    domainExpiryDate: { type: Date },
  },
  { timestamps: true }
);

CredentialSchema.pre("save", function (next: any) {
  if (this.type === "hosting" && this.startDate && this.freeDays) {
    const expiry = new Date(this.startDate);
    expiry.setDate(expiry.getDate() + this.freeDays);
    this.expiryDate = expiry;
  }
  next();
});

export default mongoose.models.Credential || mongoose.model<ICredential>("Credential", CredentialSchema);
