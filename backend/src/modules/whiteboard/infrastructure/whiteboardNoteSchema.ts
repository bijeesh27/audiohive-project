import { Schema, model, Document, Types } from "mongoose";

export interface IWhiteboardNoteDocument extends Document {
  roomId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  content: string;
  positionX: number;
  positionY: number;
  color: string;
  createdBy: {
    userId: Types.ObjectId;
    username: string;
    email?: string;
  };
  updatedBy?: {
    userId: Types.ObjectId;
    username: string;
  };
  version: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const whiteboardNoteSchema = new Schema<IWhiteboardNoteDocument>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    content: {
      type: String,
      default: "",
    },
    positionX: {
      type: Number,
      required: true,
      default: 100,
    },
    positionY: {
      type: Number,
      required: true,
      default: 100,
    },
    color: {
      type: String,
      default: "#fef08a", // soft yellow
    },
    createdBy: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      username: {
        type: String,
        required: true,
      },
      email: {
        type: String,
      },
    },
    updatedBy: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      username: {
        type: String,
      },
    },
    version: {
      type: Number,
      default: 1,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

whiteboardNoteSchema.index({ roomId: 1, isDeleted: 1 });

export const WhiteboardNoteModel = model<IWhiteboardNoteDocument>(
  "WhiteboardNote",
  whiteboardNoteSchema
);

