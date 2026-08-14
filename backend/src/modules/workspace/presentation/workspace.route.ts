import express from "express";
import { WorkspaceController } from "./workspace.controller";
import { CreateWorkspaceUseCase } from "../application/usecase/createWorkspaceUseCase";
import { updateWorkspaceUsecase } from "../application/usecase/updateWorkspaceUseCase";
import { DeleteWorkspaceUseCase } from "../application/usecase/deleteWorkspaceUseCase";
import { GetAllWorkspacesUseCase } from "../application/usecase/getAllWorkspacesUseCase";
import { WorkspaceReopsitory } from "../infrastructure/workspaceRepository";
import { validateRequest } from "../../../middleware/validateRequest";
import { registerWorkspaceSchema } from "../../../common/validation/authValidation";
import { API_ROUTES } from "../../../common/constant/ApiRoutes";

const router = express.Router();

const workspaceReopsitory = new WorkspaceReopsitory();

const createWorkspaceUseCase = new CreateWorkspaceUseCase(workspaceReopsitory);
const updateWorkspaceUseCase = new updateWorkspaceUsecase(workspaceReopsitory);
const deleteWorkspaceUseCase = new DeleteWorkspaceUseCase(workspaceReopsitory);
const getAllWorkspacesUseCase = new GetAllWorkspacesUseCase(workspaceReopsitory);

const controller = new WorkspaceController(
    createWorkspaceUseCase,
    updateWorkspaceUseCase,
    deleteWorkspaceUseCase,
    getAllWorkspacesUseCase
);

router.post(API_ROUTES.WORKSSPACE.CREATE_WORKSPACE,validateRequest(registerWorkspaceSchema) ,controller.createWorkspace.bind(controller));
router.put(API_ROUTES.WORKSSPACE.UPDATE_WORKSPACE, controller.updateWorkspace.bind(controller));
router.delete(API_ROUTES.WORKSSPACE.DELETE_WORKSPACE, controller.deleteWorkspace.bind(controller));
router.get(API_ROUTES.WORKSSPACE.GET_ALL_WORKSPACES, controller.getAllWorkspaces.bind(controller));


export default router;
