import mongoose, { Schema, Document, Model } from 'mongoose';

export type ActivityType = 'created' | 'updated' | 'deleted' | 'assigned' | 'stage_changed' | 'note_added';

export interface IActivity extends Document {
  type: ActivityType;
  entityType: 'contact' | 'company' | 'case' | 'user';
  entityId: string;
  userId: string;
  userName: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const ActivitySchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: ['created', 'updated', 'deleted', 'assigned', 'stage_changed', 'note_added'],
      required: true,
    },
    entityType: {
      type: String,
      enum: ['contact', 'company', 'case', 'user'],
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for efficient queries
ActivitySchema.index({ entityType: 1, entityId: 1 });
ActivitySchema.index({ userId: 1 });
ActivitySchema.index({ createdAt: -1 });

const Activity: Model<IActivity> = mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);

export default Activity;

