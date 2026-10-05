import { Document, Schema, model } from "mongoose";

export interface IActivityLogDocumet extends Document {
  occurredAt: Date;
  action: string;
  actorId: string | null;
  actorRole?: string;
  organizationId?: string;
  workspaceId?: string;
  targetType?: string;
  targetId?: string;
  requestId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

const activityLogSchema = new Schema<IActivityLogDocumet>(
  {
    occurredAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    action: {
      type: String,
      required: true,
      trim: true,
    },

    actorId: {
      type: String,
      default: null,
    },

    actorRole: {
      type: String,
      trim: true,
    },

    organizationId: {
      type: String,
      index: true,
    },

    workspaceId: {
      type: String,
      index: true,
    },

    targetType: {
      type: String,
      trim: true,
    },

    targetId: {
      type: String,
      index: true,
    },

    requestId: {
      type: String,
      index: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const ActivityLogModel = model<IActivityLogDocumet>(
  "ActivityLog",
  activityLogSchema
);