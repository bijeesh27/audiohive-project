import mongoose, { Document, Schema } from "mongoose";

export interface IInvitationDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  email: string;
  token: string;
  isUsed: boolean;
  expiresAt: Date;
}

const invitationSchema = new Schema<IInvitationDocument>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
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
