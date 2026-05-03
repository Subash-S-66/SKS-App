import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProject extends Document {
  sNo: number;
  clientName: string;
  companyName: string;
  typeOfJob: string;
  features: string;
  assignedBDE: mongoose.Types.ObjectId;
  assignedDevelopers: mongoose.Types.ObjectId[];
  sharePercentages: {
    bde: number;
    developers: number[];
  };
  status: "ongoing" | "completed" | "on hold";
  startDate: Date;
  completedDate?: Date;
  monthForProject: string;
  projectBudget: number;

  // New Fields
  demoScheduledDate?: Date;
  githubUrl?: string;
  finalUrl?: string;
  projectDescription?: string; // Admin internal notes
  expectedDeliveryDate?: Date;
  isDemoRequired: boolean;

  payment: {
    totalAmount: number;
    currency: string;
    transactions: {
      _id: mongoose.Types.ObjectId;
      amount: number;
      type: 'advance' | 'partial' | 'final' | 'bonus';
      paidDate: Date;
      transactionId?: string;
      paymentMethod?: string;
      note?: string;
      recordedBy: mongoose.Types.ObjectId;
      createdAt: Date;
    }[];
    amountReceived: number;
    amountPending: number;
    isFullyPaid: boolean;
    paymentStatus: 'unpaid' | 'partially_paid' | 'fully_paid' | 'overdue';
  };

  settlements: {
    userId: mongoose.Types.ObjectId;
    settledAmount: number;
    settledDate?: Date;
    settledTransactionId?: string;
    isSettled: boolean;
  }[];

  demos: {
    _id: mongoose.Types.ObjectId;
    demoDate: Date;
    conductedBy: mongoose.Types.ObjectId;
    clientAttended: boolean;
    demoLink?: string;
    recordingLink?: string;
    feedback?: string;
    outcome: 'approved' | 'changes_requested' | 'rejected' | 'rescheduled';
    changeRequests?: string;
    createdAt: Date;
  }[];

  links: {
    finalUrl?: string;
    stagingUrl?: string;
    hostedUrl?: string;
    githubUrl?: string;
    figmaUrl?: string;
    driveUrl?: string;
    adminUrl?: string;
    otherLinks: {
      label: string;
      url: string;
    }[];
  };

  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema({
  amount: { type: Number, required: true },
  type: { type: String, enum: ['advance', 'partial', 'final', 'bonus'], required: true },
  paidDate: { type: Date, required: true },
  transactionId: { type: String },
  paymentMethod: { type: String },
  note: { type: String },
  recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
});

const SettlementSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  settledAmount: { type: Number, default: 0 },
  settledDate: { type: Date },
  settledTransactionId: { type: String },
  isSettled: { type: Boolean, default: false }
});

const DemoSchema = new Schema({
  demoDate: { type: Date, required: true },
  conductedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  clientAttended: { type: Boolean, default: false },
  demoLink: { type: String },
  recordingLink: { type: String },
  feedback: { type: String },
  outcome: { type: String, enum: ['approved', 'changes_requested', 'rejected', 'rescheduled'], required: true },
  changeRequests: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const ProjectSchema: Schema<IProject> = new Schema(
  {
    sNo: { type: Number, unique: true },
    clientName: { type: String, required: true },
    companyName: { type: String, required: true },
    typeOfJob: { type: String, required: true },
    features: { type: String },
    assignedBDE: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedDevelopers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    sharePercentages: {
      bde: { type: Number, default: 20 },
      developers: [{ type: Number }], // [80] or [40, 40]
    },
    status: {
      type: String,
      enum: ["ongoing", "completed", "on hold"],
      default: "ongoing",
    },
    startDate: { type: Date, required: true },
    completedDate: { type: Date },
    monthForProject: { type: String, required: true },
    projectBudget: { type: Number, required: true },

    demoScheduledDate: { type: Date },
    githubUrl: { type: String },
    finalUrl: { type: String },
    projectDescription: { type: String },
    expectedDeliveryDate: { type: Date },
    isDemoRequired: { type: Boolean, default: false },

    payment: {
      totalAmount: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      transactions: [TransactionSchema],
      amountReceived: { type: Number, default: 0 },
      amountPending: { type: Number, default: 0 },
      isFullyPaid: { type: Boolean, default: false },
      paymentStatus: { type: String, enum: ['unpaid', 'partially_paid', 'fully_paid', 'overdue'], default: 'unpaid' }
    },

    settlements: [SettlementSchema],
    demos: [DemoSchema],

    links: {
      finalUrl: { type: String },
      stagingUrl: { type: String },
      hostedUrl: { type: String },
      githubUrl: { type: String },
      figmaUrl: { type: String },
      driveUrl: { type: String },
      adminUrl: { type: String },
      otherLinks: [{
        label: { type: String },
        url: { type: String }
      }]
    }
  },
  { timestamps: true }
);

// Auto-increment logic for sNo
ProjectSchema.pre("save", async function (next: any) {
  if (this.isNew) {
    const lastProject = await (this.constructor as any).findOne({}, {}, { sort: { sNo: -1 } });
    this.sNo = lastProject && lastProject.sNo ? lastProject.sNo + 1 : 1;
  }
  next();
});

export const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);