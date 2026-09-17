import express from "express";
import { AnnouncementRepository } from "../infrastructure/announcementRepository.js";
import { CreateAnnouncementUseCase } from "../application/usecases/createAnnouncementUseCase.js";
import { UpdateAnnouncementUseCase } from "../application/usecases/updateAnnouncementUseCase.js";
import { DeleteAnnouncementUseCase } from "../application/usecases/deleteAnnouncementUseCase.js";
import { GetAllAnnouncementsUseCase } from "../application/usecases/getAllAnnouncementsUseCase.js";
import { GetAnnouncementUseCase } from "../application/usecases/getAnnouncementUseCase.js";
import { PinAnnouncementUseCase } from "../application/usecases/pinAnnouncementUseCase.js";
import { MarkAsReadUseCase } from "../application/usecases/markAsReadUseCase.js";
import { AnnouncementController } from "./announcement.controller.js";
import { authMiddleware, roleMiddleware } from "../../../middleware/authMiddleware.js";
import { UserRoles } from "../../../common/constant/userRoles.js";
import { WorkspaceReopsitory } from "../../workspace/infrastructure/workspaceRepository.js";
import { UserRepository } from "../../auth/infrastructure/userRepository.js";

const router = express.Router();

const announcementRepository = new AnnouncementRepository();
const workspaceRepository = new WorkspaceReopsitory();
const userRepository = new UserRepository();

const createAnnouncementUseCase = new CreateAnnouncementUseCase(announcementRepository);
const updateAnnouncementUseCase = new UpdateAnnouncementUseCase(announcementRepository);
const deleteAnnouncementUseCase = new DeleteAnnouncementUseCase(announcementRepository);
const getAllAnnouncementsUseCase = new GetAllAnnouncementsUseCase(announcementRepository);
const getAnnouncementUseCase = new GetAnnouncementUseCase(announcementRepository);
const pinAnnouncementUseCase = new PinAnnouncementUseCase(announcementRepository);
const markAsReadUseCase = new MarkAsReadUseCase(announcementRepository);

const controller = new AnnouncementController(
  createAnnouncementUseCase,
  updateAnnouncementUseCase,
  deleteAnnouncementUseCase,
  getAllAnnouncementsUseCase,
  getAnnouncementUseCase,
  pinAnnouncementUseCase,
  markAsReadUseCase,
  announcementRepository.getUnreadCount.bind(announcementRepository),
  announcementRepository.getByRoom.bind(announcementRepository),
  workspaceRepository,
  userRepository
);


router.post("/", authMiddleware, roleMiddleware([UserRoles.WORKSPACE_ADMIN]), controller.createAnnouncement.bind(controller));
router.put("/:id", authMiddleware, roleMiddleware([UserRoles.WORKSPACE_ADMIN]), controller.updateAnnouncement.bind(controller));
router.delete("/:id", authMiddleware, roleMiddleware([UserRoles.WORKSPACE_ADMIN]), controller.deleteAnnouncement.bind(controller));
router.patch("/:id/pin", authMiddleware, roleMiddleware([UserRoles.WORKSPACE_ADMIN]), controller.pinAnnouncement.bind(controller));

router.get("/unread-count", authMiddleware, roleMiddleware([UserRoles.WORKSPACE_ADMIN, UserRoles.MEMBER]), controller.getUnreadCount.bind(controller));
router.get("/room/:roomId", authMiddleware, roleMiddleware([UserRoles.WORKSPACE_ADMIN, UserRoles.MEMBER]), controller.getByRoom.bind(controller));
router.get("/", authMiddleware, roleMiddleware([UserRoles.WORKSPACE_ADMIN, UserRoles.MEMBER]), controller.getAllAnnouncements.bind(controller));
router.get("/:id", authMiddleware, roleMiddleware([UserRoles.WORKSPACE_ADMIN, UserRoles.MEMBER]), controller.getAnnouncement.bind(controller));


router.patch("/:id/read", authMiddleware, roleMiddleware([UserRoles.MEMBER]), controller.markAsRead.bind(controller));

export default router;
