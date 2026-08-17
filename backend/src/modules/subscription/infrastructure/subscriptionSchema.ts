import mongoose, { Schema } from "mongoose";
import { Document } from "mongoose";

export interface ISubscriptionDocument extends Document {
  subscriptionName: string;
  price: number;
  description: string;
  maxWorkspaces: number;
  features: string[];
  isActive: boolean;
}

const subscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    subscriptionName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    maxWorkspaces: {
      type: Number,
      required: true,
      min: 1,
    },
    features: {
      type: [String],
      required: true,
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const SubscriptionModel = mongoose.model<ISubscriptionDocument>(
  "Subscription",
  subscriptionSchema,
);




