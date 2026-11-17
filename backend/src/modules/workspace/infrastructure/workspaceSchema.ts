
import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICompanyLink {
  label: string;
  url: string;
}

export interface IWorkspaceAnnouncement {
  _id?: Types.ObjectId;
  title: string;
  body: string;
  createdAt: Date;
  createdBy: string;
}

export interface ICompanyProfile {
  name?: string;
  tagline?: string;
  about?: string;
  mission?: string;
  website?: string;
  logoUrl?: string;
  links: ICompanyLink[];
  announcements: IWorkspaceAnnouncement[];
}

export interface IWorkspaceDocument extends Document {
  organizationId: Types.ObjectId;
  workspaceName: string;
  slug: string;
  status: "active" | "suspended" | "archived";
  workspaceAdminEmail?: string;
  companyProfile?: ICompanyProfile;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<IWorkspaceDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    workspaceName: {
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

    status: {
      type: String,
      enum: ["active", "suspended", "archived"],
      default: "active",
    },

    workspaceAdminEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    companyProfile: {
      name: {
        type: String,
        trim: true,
        default: "",
      },
      tagline: {
        type: String,
        trim: true,
        default: "",
      },
      about: {
        type: String,
        trim: true,
        default: "",
      },
      mission: {
        type: String,
        trim: true,
        default: "",
      },
      website: {
        type: String,
        trim: true,
        default: "",
      },
      logoUrl: {
        type: String,
        trim: true,
        default: "",
      },
      links: [
        {
          label: { type: String, required: true, trim: true },
          url: { type: String, required: true, trim: true },
        },
      ],
      announcements: [
        {
          title: { type: String, required: true, trim: true },
          body: { type: String, required: true, trim: true },
          createdAt: { type: Date, default: Date.now },
          createdBy: { type: String, required: true, trim: true },
        },
      ],
    },
  },
  { timestamps: true }
);



export const WorkspaceModel = mongoose.model<IWorkspaceDocument>(
  "Workspace",
  workspaceSchema
);