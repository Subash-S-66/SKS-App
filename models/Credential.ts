import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOtherCredential {
  label: string;
  username: string;
  password: string; // encrypted
}

export interface ICredential extends Document {
  projectId: mongoose.Types.ObjectId;
  gmailCreated?: string;
  gmailPassword?: string; // encrypted
  hostingUsername?: string;
  hostingPassword?: string; // encrypted
  hostingProvider?: string;
  hostingStartDate?: Date;
  hostingFreeDays?: number;
  hostingExpiryDate?: Date; // computed field (should be updated on save)
  customDomain: boolean;
  customDomainName?: string;
  domainExpiryDate?: Date;
  otherCredentials: IOtherCredential[];
  createdAt: Date;
  updatedAt: Date;
}

const OtherCredentialSchema = new Schema<IOtherCredential>({
  label: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
});

const CredentialSchema: Schema<ICredential> = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, unique: true },
    gmailCreated: { type: String },
    gmailPassword: { type: String },
    hostingUsername: { type: String },
    hostingPassword: { type: String },
    hostingProvider: { type: String },
    hostingStartDate: { type: Date },
    hostingFreeDays: { type: Number },
    hostingExpiryDate: { type: Date },
    customDomain: { type: Boolean, default: false },
    customDomainName: { type: String },
    domainExpiryDate: { type: Date },
    otherCredentials: [OtherCredentialSchema],
  },
  { timestamps: true }
);

// Pre-save hook to calculate hostingExpiryDate
CredentialSchema.pre("save", function (next: any) {
  if (this.hostingStartDate && this.hostingFreeDays != null) {
    const startDate = new Date(this.hostingStartDate);
    this.hostingExpiryDate = new Date(startDate.setDate(startDate.getDate() + this.hostingFreeDays));
  }
  next();
});

export const Credential: Model<ICredential> =
  mongoose.models.Credential || mongoose.model<ICredential>("Credential", CredentialSchema);