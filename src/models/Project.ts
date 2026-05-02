import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  sNo: number;
  clientName: string;
  companyName: string;
  typeOfJob: string;
  features: string;
  description?: string;
  isDemoRequired?: boolean;
  assignedBDE?: mongoose.Types.ObjectId;
  assignedDevelopers: mongoose.Types.ObjectId[];
  sharePercentages: {
    bde: number;
    developers: number[];
  };
  status: "ongoing" | "completed" | "on hold";
  startDate: Date;
  deadlineDate?: Date;
  expectedDeliveryDate?: Date;
  completedDate?: Date;
  monthForProject: string;
  projectBudget: number;

  payment: {
    totalAmount: number;
    currency: string;
    transactions: {
      amount: number;
      type: "advance" | "partial" | "final" | "bonus";
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
    paymentStatus: "unpaid" | "partially_paid" | "fully_paid" | "overdue";
  };

  demos: {
    _id?: mongoose.Types.ObjectId;
    demoDate: Date;
    conductedBy: mongoose.Types.ObjectId;
    clientAttended?: boolean;
    demoLink?: string;
    recordingLink?: string;
    feedback?: string;
    outcome?: "approved" | "changes_requested" | "rejected" | "rescheduled";
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
    otherLinks: { label: string; url: string }[];
  };

  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema(
  {
    sNo: { type: Number, unique: true },
    clientName: { type: String, required: true },
    companyName: { type: String, required: true },
    typeOfJob: { type: String, required: true },
    features: { type: String },
    description: { type: String },
    isDemoRequired: { type: Boolean, default: false },
    assignedBDE: { type: Schema.Types.ObjectId, ref: "User" },
    assignedDevelopers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    sharePercentages: {
      bde: { type: Number, default: 20 },
      developers: [{ type: Number }],
    },
    status: { type: String, enum: ["ongoing", "completed", "on hold"], default: "ongoing" },
    startDate: { type: Date, required: true, default: Date.now },
    deadlineDate: { type: Date },
    expectedDeliveryDate: { type: Date },
    completedDate: { type: Date },
    monthForProject: { type: String },
    projectBudget: { type: Number, required: true },

    payment: {
      totalAmount: { type: Number, default: 0 },
      currency: { type: String, default: "INR" },
      transactions: [{
        amount: { type: Number, required: true },
        type: { type: String, enum: ["advance", "partial", "final", "bonus"] },
        paidDate: { type: Date },
        transactionId: { type: String },
        paymentMethod: { type: String },
        note: { type: String },
        recordedBy: { type: Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now }
      }],
      amountReceived: { type: Number, default: 0 },
      amountPending: { type: Number, default: 0 },
      isFullyPaid: { type: Boolean, default: false },
      paymentStatus: { type: String, enum: ["unpaid", "partially_paid", "fully_paid", "overdue"], default: "unpaid" }
    },

    demos: [{
      demoDate: { type: Date },
      conductedBy: { type: Schema.Types.ObjectId, ref: "User" },
      clientAttended: { type: Boolean },
      demoLink: { type: String },
      recordingLink: { type: String },
      feedback: { type: String },
      outcome: { type: String, enum: ["approved", "changes_requested", "rejected", "rescheduled"] },
      changeRequests: { type: String },
      createdAt: { type: Date, default: Date.now }
    }],

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

ProjectSchema.pre("save", async function (next: any) {
  if (this.isNew && !this.sNo) {
    const lastProject = await mongoose.models.Project.findOne().sort({ sNo: -1 });
    this.sNo = lastProject && lastProject.sNo ? lastProject.sNo + 1 : 1;
  }

  if (this.payment) {
    let sum = 0;
    if (this.payment.transactions && this.payment.transactions.length > 0) {
       sum = this.payment.transactions.reduce((acc, curr) => acc + curr.amount, 0);
    }
    this.payment.amountReceived = sum;
    this.payment.amountPending = this.payment.totalAmount - sum;
    this.payment.isFullyPaid = this.payment.amountPending <= 0;

    if (this.payment.amountReceived === 0) {
      this.payment.paymentStatus = "unpaid";
    } else if (this.payment.isFullyPaid) {
      this.payment.paymentStatus = "fully_paid";
    } else {
      this.payment.paymentStatus = "partially_paid";
    }
  }

  next();
});

export default mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);
