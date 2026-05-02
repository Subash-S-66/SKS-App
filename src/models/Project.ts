import mongoose, { Schema, Document } from "mongoose";

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
  status: "ongoing" | "completed" | "on hold";
  startDate: Date;
  deadlineDate?: Date;
  completedDate?: Date;
  monthForProject: string;
  projectBudget: number;
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
    assignedBDE: { type: Schema.Types.ObjectId, ref: "User" },
    assignedDevelopers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    sharePercentages: {
      bde: { type: Number, default: 20 },
      developers: [{ type: Number }],
    },
    status: { type: String, enum: ["ongoing", "completed", "on hold"], default: "ongoing" },
    startDate: { type: Date, required: true, default: Date.now },
    deadlineDate: { type: Date },
    completedDate: { type: Date },
    monthForProject: { type: String },
    projectBudget: { type: Number, required: true },
  },
  { timestamps: true }
);

ProjectSchema.pre("save", async function (next: any) {
  if (this.isNew) {
    const lastProject = await mongoose.models.Project.findOne().sort({ sNo: -1 });
    this.sNo = lastProject && lastProject.sNo ? lastProject.sNo + 1 : 1;
  }
  next();
});

export default mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);
