import { NextFunction, Response } from "express";
import { ApiResposne } from "../../../common/Response/Response.ts";
import { IuseCase } from "../../../shared/interface/IuseCase.ts";
import { IuserDocument } from "../../../shared/User.utils/userSchema.ts";
import { MESSAGES } from "../../../common/constant/messages.ts";
import { AuthRequest } from "../../../middleware/authMiddleware.ts";
import { WorkspaceModel } from "../../workspace/infrastructure/workspaceSchema.ts";
import { SendUserInvitationDTO } from "../application/usecase/sendUserInvitationUseCase.ts";
import { WorkspaceNotFound } from "../../../common/Errors/WorkspaceError.ts";
import { AccessDeniedError } from "../../../common/Errors/AuthError.ts";

export class WorkspaceAdminController {
  constructor(
    private readonly getAllUserUseCase: IuseCase<{ workspaceId: string; page: number; limit: number,search?: string }, { users: IuserDocument[]; total: number } | null>,
    private readonly sendUserInvitationUseCase: IuseCase<SendUserInvitationDTO, void>
  ) {}
  getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search=req.query.search as string|undefined;
      
      const userEmail = req.user?.userEmail;
      const workspace = await WorkspaceModel.findOne({ workspaceAdminEmail: userEmail });
      if (!workspace) {
         return res.status(404).json({ message: "Workspace not found for this admin" });
      }

      const data = await this.getAllUserUseCase.execute({ workspaceId: workspace._id.toString(), page, limit,search });
      return ApiResposne.success(res,MESSAGES.SUCCESS.GET_ALL_MEMBERS,data)
    } catch (error) {
      next(error);
    }
  };

  inviteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceAdminEmail = req.user?.userEmail;
      if (!workspaceAdminEmail) {
        throw new AccessDeniedError()
      }

      const workspace = await WorkspaceModel.findOne({ workspaceAdminEmail });
      if (!workspace) {
        throw new WorkspaceNotFound()
      }

      const { email, invitedName, role } = req.body;
      
      await this.sendUserInvitationUseCase.execute({
        workspaceId: workspace._id.toString(),
        email,
        invitedName,
        role,
        workspaceAdminEmail
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.INVITATION_SEND);
    } catch (error) {
      next(error);
    }
  };
}
