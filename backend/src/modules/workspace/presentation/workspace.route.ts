import express from "express";
import { WorkspaceController } from "./workspace.controller";
import { CreateWorkspaceUseCase } from "../application/usecase/createWorkspaceUseCase";
import { updateWorkspaceUsecase } from "../application/usecase/updateWorkspaceUseCase";
import { DeleteWorkspaceUseCase } from "../application/usecase/deleteWorkspaceUseCase";
import { GetAllWorkspacesUseCase } from "../application/usecase/getAllWorkspacesUseCase";
import { GetWorkspacesByOrgUseCase } from "../application/usecase/getWorkspacesByOrgUseCase";
import { SendWorkspaceInvitationUseCase } from "../application/usecase/sendWorkspaceInvitationUseCase";
import { WorkspaceReopsitory } from "../infrastructure/workspaceRepository";
import { OrganizationRepository } from "../../organization/infrastructure/organizationRepository";
import { SubscriptionRepository } from "../../subscription/infrastructure/subcriptionRepository";
import { API_ROUTES } from "../../../common/constant/ApiRoutes";
import { authMiddleware, roleMiddleware } from "../../../middleware/authMiddleware";
import { UserRoles } from "../../../common/constant/userRoles";

import { validateRequest } from "../../../middleware/validateRequest";
import { createWorkspaceSchema, updateWorkspaceSchema, inviteWorkspaceAdminSchema } from "../../../common/validation/formValidation";
import { GetWorkspaceUseCase } from "../application/usecase/getWorkspaceUseCase";
import { GetWorkspaceUsersUseCase } from "../application/usecase/getWorkspaceUsersUseCase";
import { UserRepository } from "../../workspaceAdmin/infrastructure/userRepository";

import { RemoveWorkspaceUserUseCase } from "../application/usecase/removeWorkspaceUserUseCase";
import { ActivityLogRepository } from "../../activityLog/infrastructure/activitylogRepository";
import { GetMemberWorkspacesUseCase } from "../application/usecase/getMemberWorkspacesUseCase";
import { UserRepository as AuthUserRepository } from "../../auth/infrastructure/userRepository";
import { GetWorkspaceOverviewUseCase } from "../application/usecase/getWorkspaceOverviewUseCase";
import { GetWorkspaceRoomsUseCase } from "../application/usecase/getWorkspaceRoomsUseCase";
import { GetWorkspaceActivitiesUseCase } from "../application/usecase/getWorkspaceActivitiesUseCase";
import { UpdateWorkspaceUserRoleUseCase } from "../application/usecase/updateWorkspaceUserRoleUseCase";
import { UpdateWorkspaceUserStatusUseCase } from "../application/usecase/updateWorkspaceUserStatusUseCase";

const router = express.Router();
const activityLogRepository = new ActivityLogRepository();

const workspaceRepository = new WorkspaceReopsitory();
const organizationRepository = new OrganizationRepository();
const subscriptionRepository = new SubscriptionRepository();
const userRepository = new UserRepository();
const authUserRepository = new AuthUserRepository();

const createWorkspaceUseCase = new CreateWorkspaceUseCase(workspaceRepository, organizationRepository, subscriptionRepository, activityLogRepository);
const updateWorkspaceUseCase = new updateWorkspaceUsecase(workspaceRepository,activityLogRepository);
const deleteWorkspaceUseCase = new DeleteWorkspaceUseCase(workspaceRepository,activityLogRepository);
const getAllWorkspacesUseCase = new GetAllWorkspacesUseCase(workspaceRepository);
const getWorkspacesByOrgUseCase = new GetWorkspacesByOrgUseCase(workspaceRepository, organizationRepository);
const sendWorkspaceInvitationUseCase = new SendWorkspaceInvitationUseCase(workspaceRepository, organizationRepository,activityLogRepository);
const getWorkspaceUseCase = new GetWorkspaceUseCase(workspaceRepository);
const getWorkspaceUsersUseCase = new GetWorkspaceUsersUseCase(
  userRepository,
  workspaceRepository,
  organizationRepository,
);
const removeWorkspaceUserUseCase = new RemoveWorkspaceUserUseCase(
  userRepository,
  workspaceRepository,
  organizationRepository,
  activityLogRepository,
);
const getMemberWorkspacesUseCase = new GetMemberWorkspacesUseCase(
  authUserRepository,
  workspaceRepository,
);
const getWorkspaceOverviewUseCase = new GetWorkspaceOverviewUseCase(
  workspaceRepository,
  organizationRepository
);
const getWorkspaceRoomsUseCase = new GetWorkspaceRoomsUseCase(
  workspaceRepository,
  organizationRepository
);
const getWorkspaceActivitiesUseCase = new GetWorkspaceActivitiesUseCase(
  workspaceRepository,
  organizationRepository
);
const updateWorkspaceUserRoleUseCase = new UpdateWorkspaceUserRoleUseCase(
  userRepository,
  workspaceRepository,
  organizationRepository,
  activityLogRepository
);
const updateWorkspaceUserStatusUseCase = new UpdateWorkspaceUserStatusUseCase(
  userRepository,
  workspaceRepository,
  organizationRepository,
  activityLogRepository
);

const controller = new WorkspaceController(
  createWorkspaceUseCase,
  updateWorkspaceUseCase,
  deleteWorkspaceUseCase,
  getWorkspaceUseCase,
  getAllWorkspacesUseCase,
  getWorkspacesByOrgUseCase,
  sendWorkspaceInvitationUseCase,
  getWorkspaceUsersUseCase,
  removeWorkspaceUserUseCase,
  getMemberWorkspacesUseCase,
  workspaceRepository,
  getWorkspaceOverviewUseCase,
  getWorkspaceRoomsUseCase,
  getWorkspaceActivitiesUseCase,
  updateWorkspaceUserRoleUseCase,
  updateWorkspaceUserStatusUseCase
);

router.post(API_ROUTES.WORKSPACE.CREATE_WORKSPACE, authMiddleware, validateRequest(createWorkspaceSchema), controller.createWorkspace.bind(controller));
router.put(API_ROUTES.WORKSPACE.UPDATE_WORKSPACE, authMiddleware, validateRequest(updateWorkspaceSchema), controller.updateWorkspace.bind(controller));
router.delete(API_ROUTES.WORKSPACE.DELETE_WORKSPACE, authMiddleware, controller.deleteWorkspace.bind(controller));
router.get(API_ROUTES.WORKSPACE.GET_ALL_WORKSPACES, controller.getAllWorkspaces.bind(controller));
router.get(API_ROUTES.WORKSPACE.GET_MY_WORKSPACES, authMiddleware, controller.getMyWorkspaces.bind(controller));
router.get(
  API_ROUTES.WORKSPACE.GET_MEMBER_WORKSPACES,
  authMiddleware,
  roleMiddleware([UserRoles.MEMBER]),
  controller.getMemberWorkspaces.bind(controller),
);
router.post(API_ROUTES.WORKSPACE.INVITE, authMiddleware, validateRequest(inviteWorkspaceAdminSchema), controller.inviteWorkspaceAdmin.bind(controller));
router.get(API_ROUTES.WORKSPACE.GET_WORKSPACE, controller.getWorkspace.bind(controller));
router.get(
  API_ROUTES.WORKSPACE.GET_USERS,
  authMiddleware,
  roleMiddleware([UserRoles.ORGANIZATION_OWNER]),
  controller.getWorkspaceUsers.bind(controller),
);
router.delete(
  API_ROUTES.WORKSPACE.REMOVE_USER,
  authMiddleware,
  roleMiddleware([UserRoles.ORGANIZATION_OWNER]),
  controller.removeWorkspaceUser.bind(controller),
);
router.get(
  API_ROUTES.WORKSPACE.GET_OVERVIEW,
  authMiddleware,
  roleMiddleware([UserRoles.ORGANIZATION_OWNER]),
  controller.getWorkspaceOverview.bind(controller)
);
router.get(
  API_ROUTES.WORKSPACE.GET_ROOMS,
  authMiddleware,
  roleMiddleware([UserRoles.ORGANIZATION_OWNER]),
  controller.getWorkspaceRooms.bind(controller)
);
router.get(
  API_ROUTES.WORKSPACE.GET_ACTIVITIES,
  authMiddleware,
  roleMiddleware([UserRoles.ORGANIZATION_OWNER]),
  controller.getWorkspaceActivities.bind(controller)
);
router.patch(
  API_ROUTES.WORKSPACE.UPDATE_USER_ROLE,
  authMiddleware,
  roleMiddleware([UserRoles.ORGANIZATION_OWNER]),
  controller.updateWorkspaceUserRole.bind(controller)
);
router.patch(
  API_ROUTES.WORKSPACE.UPDATE_USER_STATUS,
  authMiddleware,
  roleMiddleware([UserRoles.ORGANIZATION_OWNER]),
  controller.updateWorkspaceUserStatus.bind(controller)
);

// ── Company Profile & Announcements ─────────────────────────
router.get("/:id/company-profile", authMiddleware, controller.getCompanyProfile.bind(controller));
router.patch(
  "/:id/company-profile",
  authMiddleware,
  roleMiddleware([UserRoles.WORKSPACE_ADMIN, UserRoles.ORGANIZATION_OWNER, UserRoles.SUPER_ADMIN]),
  controller.updateCompanyProfile.bind(controller)
);
router.post(
  "/:id/announcements",
  authMiddleware,
  roleMiddleware([UserRoles.WORKSPACE_ADMIN, UserRoles.ORGANIZATION_OWNER, UserRoles.SUPER_ADMIN]),
  controller.addAnnouncement.bind(controller)
);

export default router;
