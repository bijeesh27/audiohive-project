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

const router = express.Router();

const workspaceRepository = new WorkspaceReopsitory();
const organizationRepository = new OrganizationRepository();
const subscriptionRepository = new SubscriptionRepository();

const createWorkspaceUseCase = new CreateWorkspaceUseCase(workspaceRepository, organizationRepository, subscriptionRepository);
const updateWorkspaceUseCase = new updateWorkspaceUsecase(workspaceRepository);
const deleteWorkspaceUseCase = new DeleteWorkspaceUseCase(workspaceRepository);
const getAllWorkspacesUseCase = new GetAllWorkspacesUseCase(workspaceRepository);
const getWorkspacesByOrgUseCase = new GetWorkspacesByOrgUseCase(workspaceRepository, organizationRepository);
const sendWorkspaceInvitationUseCase = new SendWorkspaceInvitationUseCase(workspaceRepository, organizationRepository);

const controller = new WorkspaceController(
    createWorkspaceUseCase,
    updateWorkspaceUseCase,
    deleteWorkspaceUseCase,
    getAllWorkspacesUseCase,
    getWorkspacesByOrgUseCase,
    sendWorkspaceInvitationUseCase,
);

router.post(API_ROUTES.WORKSSPACE.CREATE_WORKSPACE, authMiddleware, controller.createWorkspace.bind(controller));
router.put(API_ROUTES.WORKSSPACE.UPDATE_WORKSPACE, controller.updateWorkspace.bind(controller));
router.delete(API_ROUTES.WORKSSPACE.DELETE_WORKSPACE, controller.deleteWorkspace.bind(controller));
router.get(API_ROUTES.WORKSSPACE.GET_ALL_WORKSPACES, controller.getAllWorkspaces.bind(controller));
router.get(API_ROUTES.WORKSSPACE.GET_MY_WORKSPACES, authMiddleware, controller.getMyWorkspaces.bind(controller));
router.post('/:id/invite', authMiddleware, controller.inviteWorkspaceAdmin.bind(controller));

export default router;
