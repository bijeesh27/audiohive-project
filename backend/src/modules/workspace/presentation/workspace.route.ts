import express from "express";
import { WorkspaceController } from "./workspace.controller";
import { CreateWorkspaceUseCase } from "../application/usecase/createWorkspaceUseCase";
import { updateWorkspaceUsecase } from "../application/usecase/updateWorkspaceUseCase";
import { DeleteWorkspaceUseCase } from "../application/usecase/deleteWorkspaceUseCase";
import { GetAllWorkspacesUseCase } from "../application/usecase/getAllWorkspacesUseCase";
import { WorkspaceReopsitory } from "../infrastructure/workspaceRepository";
import { validateRequest } from "../../../middleware/validateRequest";
import { registerWorkspaceSchema } from "../../../common/validation/authValidation";

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

router.post("/createworkspace",validateRequest(registerWorkspaceSchema) ,controller.createWorkspace.bind(controller));
router.put("/updateworkspace/:id", controller.updateWorkspace.bind(controller));
router.delete("/deleteworkspace/:id", controller.deleteWorkspace.bind(controller));
router.get("/getallworkspaces", controller.getAllWorkspaces.bind(controller));

export default router;
