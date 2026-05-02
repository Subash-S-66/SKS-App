import mongoose, { Document, Model, Schema } from 'mongoose';

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
  customSplit: boolean;
  status: 'ongoing' | 'completed' | 'on hold';
  startDate: Date;
  completedDate?: Date;
  monthForProject: string;
  projectBudget: number;
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
    projectBudget: { type: Number, required: true },
  },
  { timestamps: true }
);

// Auto-increment sNo
ProjectSchema.pre('save', async function (next: any) {
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
