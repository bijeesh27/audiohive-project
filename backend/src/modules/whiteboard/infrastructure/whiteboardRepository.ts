import { Types } from "mongoose";
import { IWhiteboardRepository } from "../domain/IwhiteboardRepository.js";
import { IStickyNote } from "../domain/whiteboard.entity.js";
import { IWhiteboardNoteDocument, WhiteboardNoteModel } from "./whiteboardNoteSchema.js";

function toEntity(doc: IWhiteboardNoteDocument): IStickyNote {
  return {
    id: doc._id?.toString() || "",
    roomId: doc.roomId?.toString() || "",
    workspaceId: doc.workspaceId?.toString() || "",
    content: doc.content || "",
    positionX: doc.positionX ?? 100,
    positionY: doc.positionY ?? 100,
    color: doc.color || "#fef08a",
    createdBy: {
      userId: doc.createdBy?.userId?.toString() || "",
      username: doc.createdBy?.username || "",
      email: doc.createdBy?.email,
    },
    updatedBy:
      doc.updatedBy && doc.updatedBy.userId
        ? {
            userId: doc.updatedBy.userId.toString(),
            username: doc.updatedBy.username || "",
          }
        : undefined,
    version: doc.version ?? 1,
    isDeleted: doc.isDeleted ?? false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class WhiteboardRepository implements IWhiteboardRepository {
  async findByRoomId(roomId: string): Promise<IStickyNote[]> {
    const docs = await WhiteboardNoteModel.find({
      roomId: new Types.ObjectId(roomId),
      isDeleted: false,
    }).sort({ createdAt: 1 });

    return docs.map(toEntity);
  }

  async findById(id: string): Promise<IStickyNote | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await WhiteboardNoteModel.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    });
    return doc ? toEntity(doc) : null;
  }

  async create(data: Omit<IStickyNote, "id" | "createdAt" | "updatedAt">): Promise<IStickyNote> {
    const doc = await WhiteboardNoteModel.create({
      roomId: new Types.ObjectId(data.roomId),
      workspaceId: new Types.ObjectId(data.workspaceId),
      content: data.content,
      positionX: data.positionX,
      positionY: data.positionY,
      color: data.color,
      createdBy: {
        userId: new Types.ObjectId(data.createdBy.userId),
        username: data.createdBy.username,
        email: data.createdBy.email,
      },
      version: 1,
      isDeleted: false,
    });

    return toEntity(doc);
  }

  async update(
    id: string,
    data: Partial<Omit<IStickyNote, "id" | "roomId" | "workspaceId" | "createdBy" | "createdAt">>,
    expectedVersion?: number
  ): Promise<IStickyNote | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const filter: Record<string, unknown> = {
      _id: new Types.ObjectId(id),
      isDeleted: false,
    };

    if (expectedVersion !== undefined) {
      filter.version = expectedVersion;
    }

    const updateQuery: Record<string, unknown> = {
      $inc: { version: 1 },
    };

    const setData: Record<string, unknown> = {};
    if (data.content !== undefined) setData.content = data.content;
    if (data.positionX !== undefined) setData.positionX = data.positionX;
    if (data.positionY !== undefined) setData.positionY = data.positionY;
    if (data.color !== undefined) setData.color = data.color;
    if (data.isDeleted !== undefined) setData.isDeleted = data.isDeleted;

    if (data.updatedBy) {
      setData.updatedBy = {
        userId: new Types.ObjectId(data.updatedBy.userId),
        username: data.updatedBy.username,
      };
    }

    if (Object.keys(setData).length > 0) {
      updateQuery.$set = setData;
    }

    const doc = await WhiteboardNoteModel.findOneAndUpdate(filter, updateQuery, {
      new: true,
    });

    return doc ? toEntity(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const res = await WhiteboardNoteModel.updateOne(
      { _id: new Types.ObjectId(id), isDeleted: false },
      { $set: { isDeleted: true } }
    );
    return res.modifiedCount > 0;
  }

  async deleteAllInRoom(roomId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(roomId)) return false;
    const res = await WhiteboardNoteModel.updateMany(
      { roomId: new Types.ObjectId(roomId), isDeleted: false },
      { $set: { isDeleted: true } }
    );
    return res.modifiedCount > 0;
  }
}

