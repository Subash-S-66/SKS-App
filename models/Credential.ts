import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IOtherCredential {
  label: string;
  username: string;
  password?: string; // encrypted
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
  hostingExpiryDate?: Date; // computed: startDate + freeDays
  customDomain: boolean;
  customDomainName?: string;
  domainExpiryDate?: Date;
  otherCredentials: IOtherCredential[];
}

const CredentialSchema = new Schema<ICredential>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
    gmailCreated: { type: String },
    gmailPassword: { type: String },
    hostingUsername: { type: String },
    hostingPassword: { type: String },
    hostingProvider: { type: String },
    hostingStartDate: { type: Date },
    hostingFreeDays: { type: Number },
    customDomain: { type: Boolean, default: false },
    customDomainName: { type: String },
    domainExpiryDate: { type: Date },
    otherCredentials: [
      {
        label: { type: String },
        username: { type: String },
        password: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// Pre-save hook to compute expiry date
CredentialSchema.pre('save', function (next: any) {
  if (this.hostingStartDate && this.hostingFreeDays) {
    const startDate = new Date(this.hostingStartDate);
    this.hostingExpiryDate = new Date(startDate.setDate(startDate.getDate() + this.hostingFreeDays));
  }
  next();
});

export const Credential: Model<ICredential> = mongoose.models.Credential || mongoose.model<ICredential>('Credential', CredentialSchema);
