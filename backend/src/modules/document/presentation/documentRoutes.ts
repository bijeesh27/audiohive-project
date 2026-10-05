import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { DocumentController } from "./document.controller.js";
import { authMiddleware } from "../../../middleware/authMiddleware.js";
import { DocumentRepository } from "../infrastructure/documentRepository.js";
import { UploadDocumentUseCase } from "../application/usecases/uploadDocumentUseCase.js";
import { GetRoomDocumentsUseCase } from "../application/usecases/getRoomDocumentsUseCase.js";
import { DeleteDocumentUseCase } from "../application/usecases/deleteDocumentUseCase.js";

import { API_ROUTES } from "../../../common/constant/ApiRoutes.js";

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

const documentRepository = new DocumentRepository();
const uploadDocumentUseCase = new UploadDocumentUseCase(documentRepository);
const getRoomDocumentsUseCase = new GetRoomDocumentsUseCase(documentRepository);
const deleteDocumentUseCase = new DeleteDocumentUseCase(documentRepository);

const controller = new DocumentController(
  uploadDocumentUseCase,
  getRoomDocumentsUseCase,
  deleteDocumentUseCase
);

router.post(API_ROUTES.DOCUMENT.UPLOAD_DOCUMENT, authMiddleware, upload.single("document"), controller.uploadDocument.bind(controller));
router.get(API_ROUTES.DOCUMENT.GET_ROOM_DOCUMENTS, authMiddleware, controller.getRoomDocuments.bind(controller));
router.delete(API_ROUTES.DOCUMENT.DELETE_DOCUMENT, authMiddleware, controller.deleteDocument.bind(controller));

export default router;