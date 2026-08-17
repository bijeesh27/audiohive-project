import mongoose, { Schema } from "mongoose";

export interface ICreateOrganizationInvitation {
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  token:string;
}

const InvitationSchema = new Schema<ICreateOrganizationInvitation>(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    token:{
        type:String
    }
  },
  {
    timestamps: true,
  }
);

export const InvitationModel =mongoose.model<ICreateOrganizationInvitation>('Invitations',InvitationSchema)