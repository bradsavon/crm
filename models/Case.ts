import mongoose, { Schema, Document, Model } from 'mongoose';

export type CaseStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';

export interface ICase extends Document {
  title: string;
  value: number;
  stage: CaseStage;
  probability: number;
  expectedCloseDate?: Date;
  company?: string;
  contact?: string;
  description?: string;
  createdBy?: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CaseSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Case title is required'],
      trim: true,
    },
    value: {
      type: Number,
      required: [true, 'Case value is required'],
      min: 0,
    },
    stage: {
      type: String,
      enum: ['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'],
      default: 'lead',
    },
    probability: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    expectedCloseDate: {
      type: Date,
    },
    company: {
      type: String,
      trim: true,
    },
    contact: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Case: Model<ICase> = mongoose.models.Case || mongoose.model<ICase>('Case', CaseSchema);

export default Case;

