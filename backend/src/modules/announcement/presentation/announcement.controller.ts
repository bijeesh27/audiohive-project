import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware.js";
import { IuseCase } from "../../../shared/interface/IuseCase.js";
import {
  AnnouncementResponseDTO,
  CreateAnnouncementDTO,
  DeleteAnnouncementDTO,
  GetAnnouncementsQueryDTO,
  MarkReadDTO,
  PinAnnouncementInputDTO,
  UpdateAnnouncementDTO,
} from "../application/dto/announcementDTO.js";
import { ResolveWorkspaceDTO, ResolvedWorkspaceDTO } from "../../workspace/application/dto/workspaceDTOs.js";
import { ApiResposne } from "../../../common/Response/Response.js";
import { MESSAGES } from "../../../common/constant/messages.js";
import { AppError } from "../../../common/Errors/AppError.js";

export class AnnouncementController {
  constructor(
    private readonly createAnnouncementUseCase: IuseCase<CreateAnnouncementDTO, AnnouncementResponseDTO>,
    private readonly updateAnnouncementUseCase: IuseCase<{ id: string; data: UpdateAnnouncementDTO }, void>,
    private readonly deleteAnnouncementUseCase: IuseCase<DeleteAnnouncementDTO, void>,
    private readonly getAllAnnouncementsUseCase: IuseCase<GetAnnouncementsQueryDTO, { announcements: AnnouncementResponseDTO[]; total: number }>,
    private readonly getAnnouncementUseCase: IuseCase<string, AnnouncementResponseDTO | null>,
    private readonly pinAnnouncementUseCase: IuseCase<PinAnnouncementInputDTO, void>,
    private readonly markAsReadUseCase: IuseCase<MarkReadDTO, void>,
    private readonly getUnreadCountFn: (workspaceId: string, userId: string) => Promise<number>,
    private readonly getByRoomFn: (roomId: string) => Promise<AnnouncementResponseDTO[]>,
    private readonly resolveWorkspaceUseCase: IuseCase<ResolveWorkspaceDTO, ResolvedWorkspaceDTO>
  ) {}

  private async resolveWorkspace(req: AuthRequest) {
    return this.resolveWorkspaceUseCase.execute({
      userId: req.user?.id,
      userEmail: req.user?.userEmail,
      role: req.user?.role
    });
  }

  createAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { workspaceId, organizationId } = await this.resolveWorkspace(req);
      const dto: CreateAnnouncementDTO = {
        ...req.body,
        workspaceId,
        organizationId,
        createdBy: req.user?.id as string,
      };
      const created = await this.createAnnouncementUseCase.execute(dto);
      return ApiResposne.success(res, MESSAGES.SUCCESS.ANNOUNCEMENT_CREATED, created);
    } catch (error) {
      next(error);
    }
  };

  updateAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const { workspaceId, organizationId } = await this.resolveWorkspace(req);
      const data: UpdateAnnouncementDTO = {
        ...req.body,
        workspaceId,
        organizationId,
        actorId: req.user?.id
      };
      await this.updateAnnouncementUseCase.execute({ id, data });
      return ApiResposne.success(res, MESSAGES.SUCCESS.ANNOUNCEMENT_UPDATED);
    } catch (error) {
      next(error);
    }
  };

  deleteAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { workspaceId, organizationId } = await this.resolveWorkspace(req);
      const id = req.params.id as string;
      await this.deleteAnnouncementUseCase.execute({ id, workspaceId, organizationId, actorId: req.user?.id });
      return ApiResposne.success(res, MESSAGES.SUCCESS.ANNOUNCEMENT_DELETED);
    } catch (error) {
      next(error);
    }
  };

  getAllAnnouncements = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { workspaceId } = await this.resolveWorkspace(req);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const rawStatus = req.query.status;
      const rawSearch = req.query.search;
      const status = (Array.isArray(rawStatus) ? rawStatus[0] : rawStatus) as string | undefined;
      const search = (Array.isArray(rawSearch) ? rawSearch[0] : rawSearch) as string | undefined;
      const data = await this.getAllAnnouncementsUseCase.execute({ workspaceId, page, limit, status, search });
      return ApiResposne.success(res, MESSAGES.SUCCESS.ANNOUNCEMENTS_FETCHED, data);
    } catch (error) {
      next(error);
    }
  };

  getAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const announcement = await this.getAnnouncementUseCase.execute(id);
      if (!announcement) {
        throw new AppError(MESSAGES.ERRORS.ANNOUNCEMENT_NOT_FOUND, 404);
      }
      return ApiResposne.success(res, MESSAGES.SUCCESS.ANNOUNCEMENT_FETCHED, announcement);
    } catch (error) {
      next(error);
    }
  };

  pinAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { workspaceId, organizationId } = await this.resolveWorkspace(req);
      const { isPinned } = req.body;
      const id = req.params.id as string;
      await this.pinAnnouncementUseCase.execute({ id, isPinned, workspaceId, organizationId, actorId: req.user?.id });
      return ApiResposne.success(res, MESSAGES.SUCCESS.ANNOUNCEMENT_PINNED);
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id as string;
      const announcementId = req.params.id as string;
      await this.markAsReadUseCase.execute({ announcementId, userId });
      return ApiResposne.success(res, MESSAGES.SUCCESS.ANNOUNCEMENT_READ);
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { workspaceId } = await this.resolveWorkspace(req);
      const userId = req.user?.id as string;
      const count = await this.getUnreadCountFn(workspaceId, userId);
      return ApiResposne.success(res, MESSAGES.SUCCESS.ANNOUNCEMENTS_FETCHED, { unreadCount: count });
    } catch (error) {
      next(error);
    }
  };

  getByRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const roomId = req.params.roomId as string;
      const announcements = await this.getByRoomFn(roomId);
      return ApiResposne.success(res, MESSAGES.SUCCESS.ANNOUNCEMENTS_FETCHED, { announcements });
    } catch (error) {
      next(error);
    }
  };
}
