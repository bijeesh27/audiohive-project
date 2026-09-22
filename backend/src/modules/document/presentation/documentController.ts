import { Request, Response } from "express";
import { DocumentModel } from "../infrastructure/documentSchema.js";
import { socketService } from "../../../socket/socketService.js";
import { Types } from "mongoose";

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?.id; // Assuming authMiddleware attaches user
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const newDocument = await DocumentModel.create({
      roomId: new Types.ObjectId(roomId as string),
      uploaderId: new Types.ObjectId(userId as string),
      originalName: file.originalname,
      fileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/documents/${file.filename}`,
    });

    // Populate uploader details to broadcast
    await newDocument.populate("uploaderId", "username email");

    // Broadcast the new document to everyone in the room
    socketService.getIO().to(roomId).emit("room:new-document", newDocument);

    res.status(201).json({ success: true, data: newDocument });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getRoomDocuments = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const documents = await DocumentModel.find({ roomId })
      .populate("uploaderId", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: documents });
  } catch (error) {
    console.error("Fetch documents error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { roomId, documentId } = req.params;
    const userId = req.user?.id;

    const document = await DocumentModel.findOne({ _id: documentId, roomId });

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    if (document.uploaderId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this document" });
    }

    await DocumentModel.deleteOne({ _id: documentId });

    socketService.getIO().to(roomId).emit("room:delete-document", documentId);

    res.status(200).json({ success: true, message: "Document deleted" });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};