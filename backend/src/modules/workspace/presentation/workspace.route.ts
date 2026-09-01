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
import { authMiddleware } from "../../../middleware/authMiddleware";

import { validateRequest } from "../../../middleware/validateRequest";
import { createWorkspaceSchema, updateWorkspaceSchema, inviteWorkspaceAdminSchema } from "../../../common/validation/formValidation";
import { GetWorkspaceUseCase } from "../application/usecase/getWorkspaceUseCase";
import { GetWorkspaceUsersUseCase } from "../application/usecase/getWorkspaceUsersUseCase";
import { UserRepository } from "../../workspaceAdmin/infrastructure/userRepository";

const router = express.Router();

const workspaceRepository = new WorkspaceReopsitory();
const organizationRepository = new OrganizationRepository();
const subscriptionRepository = new SubscriptionRepository();
const userRepository = new UserRepository();

const createWorkspaceUseCase = new CreateWorkspaceUseCase(workspaceRepository, organizationRepository, subscriptionRepository);
const updateWorkspaceUseCase = new updateWorkspaceUsecase(workspaceRepository);
const deleteWorkspaceUseCase = new DeleteWorkspaceUseCase(workspaceRepository);
const getAllWorkspacesUseCase = new GetAllWorkspacesUseCase(workspaceRepository);
const getWorkspacesByOrgUseCase = new GetWorkspacesByOrgUseCase(workspaceRepository, organizationRepository);
const sendWorkspaceInvitationUseCase = new SendWorkspaceInvitationUseCase(workspaceRepository, organizationRepository);
const getWorkspaceUseCase=new GetWorkspaceUseCase(workspaceRepository)
const getWorkspaceUsersUseCase = new GetWorkspaceUsersUseCase(userRepository);

const controller = new WorkspaceController(
  createWorkspaceUseCase,
  updateWorkspaceUseCase,
  deleteWorkspaceUseCase,
  getWorkspaceUseCase,
  getAllWorkspacesUseCase,
  getWorkspacesByOrgUseCase,
  sendWorkspaceInvitationUseCase,
  getWorkspaceUsersUseCase
);

router.post(API_ROUTES.WORKSSPACE.CREATE_WORKSPACE, authMiddleware, validateRequest(createWorkspaceSchema), controller.createWorkspace.bind(controller));
router.put(API_ROUTES.WORKSSPACE.UPDATE_WORKSPACE, validateRequest(updateWorkspaceSchema), controller.updateWorkspace.bind(controller));
router.delete(API_ROUTES.WORKSSPACE.DELETE_WORKSPACE, controller.deleteWorkspace.bind(controller));
router.get(API_ROUTES.WORKSSPACE.GET_ALL_WORKSPACES, controller.getAllWorkspaces.bind(controller));
router.get(API_ROUTES.WORKSSPACE.GET_MY_WORKSPACES, authMiddleware, controller.getMyWorkspaces.bind(controller));
router.post(API_ROUTES.WORKSSPACE.INVITE, authMiddleware, validateRequest(inviteWorkspaceAdminSchema), controller.inviteWorkspaceAdmin.bind(controller));
router.get('/getworkspace/:id',controller.getWorkspace.bind(controller));
router.get('/:id/users', authMiddleware, controller.getWorkspaceUsers.bind(controller));

export default router;
