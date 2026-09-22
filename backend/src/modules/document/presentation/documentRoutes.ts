import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadDocument, getRoomDocuments, deleteDocument } from "./documentController.js";
import { authMiddleware } from "../../../middleware/authMiddleware.js";

const router = Router();

// Configure local storage
const uploadDir = path.join(process.cwd(), "uploads", "documents");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB limit
});

router.post("/:roomId/documents", authMiddleware, upload.single("document"), uploadDocument);
router.get("/:roomId/documents", authMiddleware, getRoomDocuments);
router.delete("/:roomId/documents/:documentId", authMiddleware, deleteDocument);

export default router;