import { ActivityLogRepository } from "../../activityLog/infrastructure/activitylogRepository";
const activityLogRepository = new ActivityLogRepository();
import { Router } from "express";
import multer from "multer";
import { DocumentController } from "./document.controller.js";
import { authMiddleware } from "../../../middleware/authMiddleware.js";
import { DocumentRepository } from "../infrastructure/documentRepository.js";
import { UploadDocumentUseCase } from "../application/usecases/uploadDocumentUseCase.js";
import { GetRoomDocumentsUseCase } from "../application/usecases/getRoomDocumentsUseCase.js";
import { DeleteDocumentUseCase } from "../application/usecases/deleteDocumentUseCase.js";
import { RoomRepository } from "../../room/infrastructure/roomRepository.js";
import { GetRoomUseCase } from "../../room/application/usecases/getRoomUseCase.js";
import { WorkspaceReopsitory } from "../../workspace/infrastructure/workspaceRepository.js";
import { UserRepository } from "../../auth/infrastructure/userRepository.js";
import { ResolveWorkspaceUseCase } from "../../workspace/application/usecase/resolveWorkspaceUseCase.js";

import { API_ROUTES } from "../../../common/constant/ApiRoutes.js";

const router = Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } 
});

const documentRepository = new DocumentRepository();
const roomRepository = new RoomRepository();
const workspaceRepository = new WorkspaceReopsitory();
const userRepository = new UserRepository();
const uploadDocumentUseCase = new UploadDocumentUseCase(documentRepository,activityLogRepository);
const getRoomDocumentsUseCase = new GetRoomDocumentsUseCase(documentRepository);
const deleteDocumentUseCase = new DeleteDocumentUseCase(documentRepository,activityLogRepository);
const getRoomUseCase = new GetRoomUseCase(roomRepository);
const resolveWorkspaceUseCase = new ResolveWorkspaceUseCase(workspaceRepository, userRepository);

const controller = new DocumentController(
  uploadDocumentUseCase,
  getRoomDocumentsUseCase,
  deleteDocumentUseCase,
  resolveWorkspaceUseCase,
  getRoomUseCase,
  documentRepository
);

router.post(API_ROUTES.DOCUMENT.UPLOAD_DOCUMENT, authMiddleware, upload.single("document"), controller.uploadDocument.bind(controller));
router.get(API_ROUTES.DOCUMENT.GET_ROOM_DOCUMENTS, authMiddleware, controller.getRoomDocuments.bind(controller));
router.get(API_ROUTES.DOCUMENT.GET_DOCUMENT_FILE, authMiddleware, controller.getDocumentFile.bind(controller));
router.delete(API_ROUTES.DOCUMENT.DELETE_DOCUMENT, authMiddleware, controller.deleteDocument.bind(controller));

export default router;
