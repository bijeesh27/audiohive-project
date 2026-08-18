import mongoose, { Document, Schema } from "mongoose";

export interface IInvitationDocument extends Document {
  workspaceId:string;
  workspaceAdminName?:string;
  invitedName?:string;
  role?: string;
  email: string;
  token: string;
  isUsed: boolean;
  expiresAt: Date;
}

const invitationSchema = new Schema<IInvitationDocument>(
  {
    workspaceId: {
      type: String,
      ref: "Workspace",
      required: true,
    },
    workspaceAdminName:{type:String},
    invitedName:{type:String},
    role:{type:String},
    email: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    isUsed: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export const InvitationModel = mongoose.model<IInvitationDocument>(
  "Invitation",
  invitationSchema,
);
