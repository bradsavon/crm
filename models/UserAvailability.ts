import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserAvailability extends Document {
  user: mongoose.Types.ObjectId;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // HH:mm format (e.g., "09:00")
  endTime: string; // HH:mm format (e.g., "17:00")
  isAvailable: boolean;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserAvailabilitySchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, // HH:mm format
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, // HH:mm format
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
  },
  {
    timestamps: true,
  }
);

// Unique index: one availability record per user per day
UserAvailabilitySchema.index({ user: 1, dayOfWeek: 1 }, { unique: true });

const UserAvailabilityModel: Model<IUserAvailability> =
  mongoose.models.UserAvailability ||
  mongoose.model<IUserAvailability>('UserAvailability', UserAvailabilitySchema);

export default UserAvailabilityModel;

