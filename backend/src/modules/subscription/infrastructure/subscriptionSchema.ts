import mongoose, { Schema } from "mongoose";
import { Document } from "mongoose";

export interface ISubscriptionDocument extends Document {
  subscriptionName: string;
  key?: string;
  price: number;
  currency?: string;
  interval?: "month" | "year";
  description: string;
  maxWorkspaces: number;
  maxRooms?: number;
  features: string[];
  isActive: boolean;
  status?: "active" | "inactive" | "archived";
  isDefault?: boolean;
  isRecommended?: boolean;
  displayOrder?: number;
  stripePriceId?: string;
  stripeProductId?: string;
}

const subscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    subscriptionName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    key: {
      type: String,
      trim: true,
      lowercase: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    interval: {
      type: String,
      enum: ["month", "year"],
      default: "month",
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
    maxRooms: {
      type: Number,
      required: false,
      default: 10,
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
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isRecommended: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    stripePriceId: {
      type: String,
      required: false,
    },
    stripeProductId: {
      type: String,
      required: false,
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




