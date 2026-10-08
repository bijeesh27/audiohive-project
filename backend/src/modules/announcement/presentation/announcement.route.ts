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

import { ResolveWorkspaceUseCase } from "../../workspace/application/usecase/resolveWorkspaceUseCase.js";

import { API_ROUTES } from "../../../common/constant/ApiRoutes.js";
import { ActivityLogRepository } from "../../activityLog/infrastructure/activitylogRepository";

const router = express.Router();
const activityLogRepository = new ActivityLogRepository();


const announcementRepository = new AnnouncementRepository();
const workspaceRepository = new WorkspaceReopsitory();
const userRepository = new UserRepository();

const createAnnouncementUseCase = new CreateAnnouncementUseCase(announcementRepository,activityLogRepository);
const updateAnnouncementUseCase = new UpdateAnnouncementUseCase(announcementRepository,activityLogRepository);
const deleteAnnouncementUseCase = new DeleteAnnouncementUseCase(announcementRepository,activityLogRepository);
const getAllAnnouncementsUseCase = new GetAllAnnouncementsUseCase(announcementRepository);
const getAnnouncementUseCase = new GetAnnouncementUseCase(announcementRepository);
const pinAnnouncementUseCase = new PinAnnouncementUseCase(announcementRepository,activityLogRepository);
const markAsReadUseCase = new MarkAsReadUseCase(announcementRepository,activityLogRepository);
const resolveWorkspaceUseCase = new ResolveWorkspaceUseCase(workspaceRepository, userRepository);

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
  resolveWorkspaceUseCase
);


router.post(API_ROUTES.ANNOUNCEMENT.CREATE_ANNOUNCEMENT, authMiddleware, roleMiddleware([UserRoles.WORKSPACE_ADMIN]), controller.createAnnouncement.bind(controller));
router.put(API_ROUTES.ANNOUNCEMENT.UPDATE_ANNOUNCEMENT, authMiddleware, roleMiddleware([UserRoles.WORKSPACE_ADMIN]), controller.updateAnnouncement.bind(controller));
router.delete(API_ROUTES.ANNOUNCEMENT.DELETE_ANNOUNCEMENT, authMiddleware, roleMiddleware([UserRoles.WORKSPACE_ADMIN]), controller.deleteAnnouncement.bind(controller));
router.patch(API_ROUTES.ANNOUNCEMENT.PIN_ANNOUNCEMENT, authMiddleware, roleMiddleware([UserRoles.WORKSPACE_ADMIN]), controller.pinAnnouncement.bind(controller));

router.get(API_ROUTES.ANNOUNCEMENT.UNREAD_COUNT, authMiddleware, roleMiddleware([UserRoles.WORKSPACE_ADMIN, UserRoles.MEMBER]), controller.getUnreadCount.bind(controller));
router.get(API_ROUTES.ANNOUNCEMENT.GET_BY_ROOM, authMiddleware, roleMiddleware([UserRoles.WORKSPACE_ADMIN, UserRoles.MEMBER]), controller.getByRoom.bind(controller));
router.get(API_ROUTES.ANNOUNCEMENT.GET_ALL, authMiddleware, roleMiddleware([UserRoles.WORKSPACE_ADMIN, UserRoles.MEMBER]), controller.getAllAnnouncements.bind(controller));
router.get(API_ROUTES.ANNOUNCEMENT.GET_ONE, authMiddleware, roleMiddleware([UserRoles.WORKSPACE_ADMIN, UserRoles.MEMBER]), controller.getAnnouncement.bind(controller));


router.patch(API_ROUTES.ANNOUNCEMENT.MARK_READ, authMiddleware, roleMiddleware([UserRoles.MEMBER]), controller.markAsRead.bind(controller));

export default router;
