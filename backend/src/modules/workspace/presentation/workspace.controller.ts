import { NextFunction, Request, Response } from "express";
import { ApiResposne } from "../../../common/Response/Response";
import { MESSAGES } from "../../../common/constant/messages";
import { HttpStatus } from "../../../common/constant/httpStatus";
import { IuseCase } from "../../../shared/interface/IuseCase";
import {
  CreateWorkspaceDTO,
  DeleteWorkspaceDTO,
  GetWorkspaceDTO,
  GetWorkspaceUsersDTO,
  GetWorkspacesByOrgDTO,
  RemoveWorkspaceUserDTO,
  SendWorkspaceInvitationDTO,
  UpdateWorkspaceDTO,
  WorkspacePaginationDTO,
} from "../application/dto/workspaceDTOs";
import { IWorkspaceDocument } from "../infrastructure/workspaceSchema";
import { AuthRequest } from "../../../middleware/authMiddleware";
import { IuserDTO } from "../../../shared/User.utils/userDTO";
import { AppError } from "../../../common/Errors/AppError";
import { GetMemberWorkspacesInput } from "../application/usecase/getMemberWorkspacesUseCase";
import { IworkspaceRepository } from "../domain/IworkspaceRepository";
import { WorkspaceReopsitory } from "../infrastructure/workspaceRepository";
import { UserRoles } from "../../../common/constant/userRoles";

function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/[<>]/g, "");
}

function isSecureHttpsUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export class WorkspaceController {
  private readonly workspaceRepo: IworkspaceRepository;

  constructor(
    private readonly createWorkspaceUseCase: IuseCase<CreateWorkspaceDTO, void>,
    private readonly updateWorkspaceUseCase: IuseCase<UpdateWorkspaceDTO, void>,
    private readonly deleteWorkspaceUseCase: IuseCase<DeleteWorkspaceDTO, void>,
    private readonly getWorkspaceUseCase: IuseCase<GetWorkspaceDTO, IWorkspaceDocument | null>,
    private readonly getAllWorkspacesUseCase: IuseCase<
      WorkspacePaginationDTO,
      { workspaces: IWorkspaceDocument[]; total: number }
    >,
    private readonly getWorkspacesByOrgUseCase: IuseCase<
      GetWorkspacesByOrgDTO,
      { workspaces: IWorkspaceDocument[]; total: number }
    >,
    private readonly sendWorkspaceInvitationUseCase: IuseCase<SendWorkspaceInvitationDTO, void>,
    private readonly getWorkspaceUsersUseCase: IuseCase<
      GetWorkspaceUsersDTO,
      import("../../workspaceAdmin/application/dtos/workspaceAdminDTO").GetAllUsersResponseDTO | null
    >,
    private readonly removeWorkspaceUserUseCase: IuseCase<RemoveWorkspaceUserDTO, IuserDTO>,
    private readonly getMemberWorkspacesUseCase: IuseCase<GetMemberWorkspacesInput, IWorkspaceDocument[]>,
    workspaceRepo?: IworkspaceRepository
  ) {
    this.workspaceRepo = workspaceRepo || new WorkspaceReopsitory();
  }

  async createWorkspace(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userEmail = req.user?.userEmail;
      if (!userEmail) {
        throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
      }

      await this.createWorkspaceUseCase.execute({
        userEmail,
        workspaceName: req.body.workspaceName,
        slug: req.body.slug,
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.WORSPACE_CREATED, undefined, HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async updateWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const response = await this.updateWorkspaceUseCase.execute({ id, ...req.body });
      return ApiResposne.success(res, MESSAGES.SUCCESS.WORKSPACE_UPDATED, response, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async deleteWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const response = await this.deleteWorkspaceUseCase.execute({ workspaceId: id });
      return ApiResposne.success(res, MESSAGES.SUCCESS.WORKSPACE_DELETED, response);
    } catch (error) {
      next(error);
    }
  }

  async getAllWorkspaces(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      const data = await this.getAllWorkspacesUseCase.execute({ page, limit, search });
      return ApiResposne.success(res, MESSAGES.SUCCESS.WORKSPACE_GET_ALL, data);
    } catch (error) {
      next(error);
    }
  }

  async getMyWorkspaces(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userEmail = req.user?.userEmail;
      if (!userEmail) {
        throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;

      const data = await this.getWorkspacesByOrgUseCase.execute({ userEmail, page, limit, search });
      return ApiResposne.success(res,MESSAGES.SUCCESS.WORKSPACE_GET_ALL, data);
    } catch (error) {
      next(error);
    }
  }

  async inviteWorkspaceAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userEmail = req.user?.userEmail;
      if (!userEmail) {
        throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
      }

      const workspaceId = req.params.id as string;
      const { email, workspaceAdminName } = req.body;

      await this.sendWorkspaceInvitationUseCase.execute({
        workspaceId,
        email,
        workspaceAdminName,
        organizationOwnerEmail: userEmail,
      });

      return ApiResposne.success(res,MESSAGES.SUCCESS.INVITATION_SEND);
    } catch (error) {
      next(error);
    }
  }
  async getWorkspace(req:Request,res:Response,next:NextFunction){
    try {
      const workspaceId=req.params.id as string
      const workspace= await this.getWorkspaceUseCase.execute({ workspaceId })
      return ApiResposne.success(res, MESSAGES.SUCCESS.WORKSPACE_FETCHED, workspace)
    } catch (error) {
      next(error)
    }
  }

  async getWorkspaceUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.id as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      const ownerEmail = req.user?.userEmail;
      if (!ownerEmail) throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);

      const data = await this.getWorkspaceUsersUseCase.execute({ workspaceId, ownerEmail, page, limit, search });
      return ApiResposne.success(res, MESSAGES.SUCCESS.USERS_FETCHED, data);
    } catch (error) {
      next(error);
    }
  }

  async removeWorkspaceUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.id as string;
      const userId = req.params.userId as string;

      const ownerEmail = req.user?.userEmail;
      const actorId = req.user?.id;
      if (!ownerEmail || !actorId) {
        throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
      }

      const data = await this.removeWorkspaceUserUseCase.execute({ workspaceId, userId, ownerEmail, actorId });
      return ApiResposne.success(res, MESSAGES.SUCCESS.USER_REMOVED_FROM_WORKSPACE, data);
    } catch (error) {
      next(error);
    }
  }

  async getMemberWorkspaces(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
      const workspaces = await this.getMemberWorkspacesUseCase.execute({ userId: req.user.id });
      return ApiResposne.success(res, MESSAGES.SUCCESS.WORKSPACE_GET_ALL, { workspaces });
    } catch (error) {
      next(error);
    }
  }

  async getCompanyProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.id || req.user?.workspaceId;
      if (!workspaceId) {
        throw new AppError("Workspace ID is required", HttpStatus.BAD_REQUEST);
      }
      const profile = await this.workspaceRepo.getCompanyProfile(workspaceId);
      if (!profile) {
        throw new AppError("Workspace not found", HttpStatus.NOT_FOUND);
      }
      return ApiResposne.success(res, "Company profile retrieved successfully", profile);
    } catch (error) {
      next(error);
    }
  }

  async updateCompanyProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.id || req.user?.workspaceId;
      if (!workspaceId) {
        throw new AppError("Workspace ID is required", HttpStatus.BAD_REQUEST);
      }

      // Role check: Only workspace admin or org owner can edit company profile
      if (req.user?.role === UserRoles.MEMBER) {
        throw new AppError("Only workspace admins can edit the company profile", HttpStatus.FORBIDDEN);
      }

      const { name, tagline, about, mission, website, logoUrl, links } = req.body;

      // URL Whitelisting: validate https only
      if (website && !isSecureHttpsUrl(website)) {
        throw new AppError("Website URL must start with https://", HttpStatus.BAD_REQUEST);
      }
      if (logoUrl && !isSecureHttpsUrl(logoUrl)) {
        throw new AppError("Logo URL must start with https://", HttpStatus.BAD_REQUEST);
      }

      const sanitizedLinks: { label: string; url: string }[] = [];
      if (Array.isArray(links)) {
        for (const item of links) {
          const label = sanitizeText(item.label);
          const url = typeof item.url === "string" ? item.url.trim() : "";
          if (!label || !url) continue;
          if (!isSecureHttpsUrl(url)) {
            throw new AppError(`Link "${label}" must use a secure https:// URL`, HttpStatus.BAD_REQUEST);
          }
          sanitizedLinks.push({ label, url });
        }
      }

      const sanitizedProfile = {
        ...(name !== undefined && { name: sanitizeText(name) }),
        ...(tagline !== undefined && { tagline: sanitizeText(tagline) }),
        ...(about !== undefined && { about: sanitizeText(about) }),
        ...(mission !== undefined && { mission: sanitizeText(mission) }),
        ...(website !== undefined && { website: website.trim() }),
        ...(logoUrl !== undefined && { logoUrl: logoUrl.trim() }),
        ...(links !== undefined && { links: sanitizedLinks }),
      };

      const updated = await this.workspaceRepo.updateCompanyProfile(workspaceId, sanitizedProfile);
      return ApiResposne.success(res, "Company profile updated successfully", updated);
    } catch (error) {
      next(error);
    }
  }

  async addAnnouncement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.id || req.user?.workspaceId;
      if (!workspaceId) {
        throw new AppError("Workspace ID is required", HttpStatus.BAD_REQUEST);
      }

      // Role check: Only workspace admin or org owner can post announcements
      if (req.user?.role === UserRoles.MEMBER) {
        throw new AppError("Only workspace admins can post workspace announcements", HttpStatus.FORBIDDEN);
      }

      const title = sanitizeText(req.body.title);
      const body = sanitizeText(req.body.body);

      if (!title || title.length < 2) {
        throw new AppError("Announcement title must be at least 2 characters", HttpStatus.BAD_REQUEST);
      }
      if (!body || body.length < 5) {
        throw new AppError("Announcement body must be at least 5 characters", HttpStatus.BAD_REQUEST);
      }

      const createdBy =
        (req.user as any)?.username || (req.user as any)?.name || req.user?.userEmail || "Workspace Admin";

      const announcement = await this.workspaceRepo.addAnnouncement(workspaceId, {
        title,
        body,
        createdBy,
      });

      return ApiResposne.success(res, "Announcement published successfully", announcement, HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }
}
