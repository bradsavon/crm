import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMeeting extends Document {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  meetingType: 'in-person' | 'video' | 'phone' | 'hybrid';
  videoLink?: string;
  organizer: mongoose.Types.ObjectId;
  attendees: mongoose.Types.ObjectId[];
  relatedEntityType?: 'contact' | 'company' | 'case';
  relatedEntityId?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  reminderMinutes?: number[];
  timezone?: string;
  externalCalendarId?: string; // For syncing with Google/Outlook
  externalCalendarProvider?: 'google' | 'outlook';
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
      validate: {
        validator: function (this: IMeeting, value: Date) {
          return value > this.startTime;
        },
        message: 'End time must be after start time',
      },
    },
    location: {
      type: String,
      trim: true,
    },
    meetingType: {
      type: String,
      enum: ['in-person', 'video', 'phone', 'hybrid'],
      default: 'in-person',
    },
    videoLink: {
      type: String,
      trim: true,
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attendees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    relatedEntityType: {
      type: String,
      enum: ['contact', 'company', 'case'],
    },
    relatedEntityId: {
      type: String,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
    },
    reminderMinutes: [
      {
        type: Number,
      },
    ],
    timezone: {
      type: String,
      default: 'UTC',
    },
    externalCalendarId: {
      type: String,
    },
    externalCalendarProvider: {
      type: String,
      enum: ['google', 'outlook'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
MeetingSchema.index({ organizer: 1, startTime: 1 });
MeetingSchema.index({ attendees: 1, startTime: 1 });
MeetingSchema.index({ startTime: 1, endTime: 1 });
MeetingSchema.index({ relatedEntityType: 1, relatedEntityId: 1 });
MeetingSchema.index({ externalCalendarId: 1, externalCalendarProvider: 1 });

const MeetingModel: Model<IMeeting> =
  mongoose.models.Meeting || mongoose.model<IMeeting>('Meeting', MeetingSchema);

export default MeetingModel;
