import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware.js";
import { IuseCase } from "../../../shared/interface/IuseCase.js";
import { CreateAnnouncementDTO, UpdateAnnouncementDTO, MarkReadDTO } from "../application/dto/announcementDTO.js";
import { IAnnouncementDocument } from "../infrastructure/announcementSchema.js";
import { ResolveWorkspaceDTO, ResolvedWorkspaceResult } from "../../workspace/application/usecases/resolveWorkspaceUseCase.js";
import { ApiResposne } from "../../../common/Response/Response.js";
import { MESSAGES } from "../../../common/constant/messages.js";
import { AppError } from "../../../common/Errors/AppError.js";

export class AnnouncementController {
  constructor(
    private readonly createAnnouncementUseCase: IuseCase<CreateAnnouncementDTO, IAnnouncementDocument>,
    private readonly updateAnnouncementUseCase: IuseCase<{ id: string; data: UpdateAnnouncementDTO }, void>,
    private readonly deleteAnnouncementUseCase: IuseCase<{ id: string; workspaceId: string }, void>,
    private readonly getAllAnnouncementsUseCase: IuseCase<{ workspaceId: string; page: number; limit: number; status?: string; search?: string }, { announcements: IAnnouncementDocument[]; total: number }>,
    private readonly getAnnouncementUseCase: IuseCase<string, IAnnouncementDocument | null>,
    private readonly pinAnnouncementUseCase: IuseCase<{ id: string; isPinned: boolean; workspaceId: string }, void>,
    private readonly markAsReadUseCase: IuseCase<MarkReadDTO, void>,
    private readonly getUnreadCountFn: (workspaceId: string, userId: string) => Promise<number>,
    private readonly getByRoomFn: (roomId: string) => Promise<IAnnouncementDocument[]>,
    private readonly resolveWorkspaceUseCase: IuseCase<ResolveWorkspaceDTO, ResolvedWorkspaceResult>
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
      await this.updateAnnouncementUseCase.execute({ id, data: req.body });
      return ApiResposne.success(res, MESSAGES.SUCCESS.ANNOUNCEMENT_UPDATED);
    } catch (error) {
      next(error);
    }
  };

  deleteAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { workspaceId } = await this.resolveWorkspace(req);
      const id = req.params.id as string;
      await this.deleteAnnouncementUseCase.execute({ id, workspaceId });
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
      const { workspaceId } = await this.resolveWorkspace(req);
      const { isPinned } = req.body;
      const id = req.params.id as string;
      await this.pinAnnouncementUseCase.execute({ id, isPinned, workspaceId });
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
