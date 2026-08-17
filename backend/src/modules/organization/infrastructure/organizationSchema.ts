
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IorganizationDocument extends Document {
  companyName: string;
  slug: string;
  ownerName:string
  ownerEmail:string
  planId: string;
  status: "active" | "suspended" | "pending" | "archived";
  maxWorkspaces: number;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IorganizationDocument>(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 63,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    ownerName:{
      type:String,
      required:true
    },
    ownerEmail:{
      type:String,
      required:true
    },

    planId: {
      type: String,
      default:'free'
    },

    status: {
      type: String,
      enum: ["active", "suspended", "pending", "archived"],
      default: "pending",
    },
    maxWorkspaces: {
      type: Number,
      default: 1, 
    },
  },
  { timestamps: true }
);

// organizationSchema.index({ slug: 1 }, { unique: true });
// organizationSchema.index({ ownerId: 1 });
// organizationSchema.index({ status: 1 });

export const OrganizationModel = mongoose.model<IorganizationDocument>(
  "Organization",
  organizationSchema
);