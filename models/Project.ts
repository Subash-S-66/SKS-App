import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITransaction {
  amount: number;
  type: 'advance' | 'partial' | 'final' | 'bonus';
  paidDate: Date;
  transactionId: string;
  paymentMethod: string;
  note: string;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IDemo {
  demoDate: Date;
  conductedBy: mongoose.Types.ObjectId;
  clientAttended: boolean;
  demoLink: string;
  recordingLink: string;
  feedback: string;
  outcome: 'approved' | 'changes_requested' | 'rejected' | 'rescheduled';
  changeRequests: string;
  createdAt: Date;
}

export interface IProjectLink {
  label: string;
  url: string;
}

export interface IProject extends Document {
  sNo: number;
  clientName: string;
  companyName: string;
  typeOfJob: string;
  features: string;
  assignedBDE?: mongoose.Types.ObjectId;
  assignedDevelopers: mongoose.Types.ObjectId[];
  sharePercentages: {
    bde: number;
    developers: number[];
  };
  customSplit: boolean;
  status: 'ongoing' | 'completed' | 'on hold';
  startDate: Date;
  completedDate?: Date;
  monthForProject: string;

  // Enhanced Fields
  projectBudget: number;
  internalNotes?: string;
  expectedDeliveryDate?: Date;
  isDemoRequired: boolean;

  // Payments
  payment: {
    totalAmount: number;
    currency: string;
    transactions: ITransaction[];
    amountReceived: number;
    amountPending: number;
    isFullyPaid: boolean;
    paymentStatus: 'unpaid' | 'partially_paid' | 'fully_paid' | 'overdue';
  };

  // Settled Tracking
  settlements: {
    user: mongoose.Types.ObjectId;
    settledAmount: number;
    settledDate: Date;
    settledTransactionId: string;
  }[];

  // Demos
  demos: IDemo[];

  // Links
  links: {
    finalUrl?: string;
    stagingUrl?: string;
    hostedUrl?: string;
    githubUrl?: string;
    figmaUrl?: string;
    driveUrl?: string;
    adminUrl?: string;
    otherLinks: IProjectLink[];
  };
}

const ProjectSchema = new Schema<IProject>(
  {
    sNo: { type: Number, unique: true },
    clientName: { type: String, required: true },
    companyName: { type: String, required: true },
    typeOfJob: { type: String, required: true },
    features: { type: String },
    assignedBDE: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedDevelopers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    sharePercentages: {
      bde: { type: Number, default: 20 },
      developers: [{ type: Number }],
    },
    customSplit: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['ongoing', 'completed', 'on hold'],
      default: 'ongoing',
    },
    startDate: { type: Date, required: true },
    completedDate: { type: Date },
    monthForProject: { type: String, required: true },

    // Enhanced Fields
    projectBudget: { type: Number, required: true },
    internalNotes: { type: String },
    expectedDeliveryDate: { type: Date },
    isDemoRequired: { type: Boolean, default: false },

    // Payments
    payment: {
      totalAmount: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      transactions: [{
        amount: Number,
        type: { type: String, enum: ['advance', 'partial', 'final', 'bonus'] },
        paidDate: Date,
        transactionId: String,
        paymentMethod: String,
        note: String,
        recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now }
      }],
      amountReceived: { type: Number, default: 0 },
      amountPending: { type: Number, default: 0 },
      isFullyPaid: { type: Boolean, default: false },
      paymentStatus: {
        type: String,
        enum: ['unpaid', 'partially_paid', 'fully_paid', 'overdue'],
        default: 'unpaid'
      }
    },

    settlements: [{
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      settledAmount: Number,
      settledDate: Date,
      settledTransactionId: String
    }],

    demos: [{
      demoDate: Date,
      conductedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      clientAttended: Boolean,
      demoLink: String,
      recordingLink: String,
      feedback: String,
      outcome: { type: String, enum: ['approved', 'changes_requested', 'rejected', 'rescheduled'] },
      changeRequests: String,
      createdAt: { type: Date, default: Date.now }
    }],

    links: {
      finalUrl: String,
      stagingUrl: String,
      hostedUrl: String,
      githubUrl: String,
      figmaUrl: String,
      driveUrl: String,
      adminUrl: String,
      otherLinks: [{ label: String, url: String }]
    }
  },
  { timestamps: true }
);

// Pre-save hook to compute payment statuses
ProjectSchema.pre('save', async function (next: any) {
  if (this.isModified('payment.transactions') || this.isModified('projectBudget') || this.isNew) {
    this.payment.totalAmount = this.projectBudget;

    let received = 0;
    if (this.payment.transactions && this.payment.transactions.length > 0) {
      received = this.payment.transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    }

    this.payment.amountReceived = received;
    this.payment.amountPending = Math.max(0, this.payment.totalAmount - received);
    this.payment.isFullyPaid = this.payment.amountPending <= 0;

    if (this.payment.isFullyPaid) {
      this.payment.paymentStatus = 'fully_paid';
    } else if (received > 0) {
      this.payment.paymentStatus = 'partially_paid';
    } else {
      this.payment.paymentStatus = 'unpaid';

      if (this.expectedDeliveryDate && new Date() > this.expectedDeliveryDate) {
         this.payment.paymentStatus = 'overdue';
      }
    }
  }

  // Auto-increment sNo logic
  if (this.isNew) {
    const lastProject = await (this.constructor as Model<IProject>).findOne({}, {}, { sort: { sNo: -1 } });
    if (lastProject && lastProject.sNo) {
      this.sNo = lastProject.sNo + 1;
    } else {
      this.sNo = 1;
    }
  }
  next();
});

export const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
