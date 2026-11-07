import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware.js";
import { ApiResposne } from "../../../common/Response/Response.js";
import { HttpStatus } from "../../../common/constant/httpStatus.js";
import { MESSAGES } from "../../../common/constant/messages.js";
import { AppError } from "../../../common/Errors/AppError.js";
import { IuseCase } from "../../../shared/interface/IuseCase.js";
import {
  CreateMeetingDTO,
  GetMeetingsDTO,
  GetMeetingByIdDTO,
  UpdateMeetingDTO,
  CancelMeetingDTO,
  DeleteMeetingDTO,
} from "../application/dto/meetingDTO.js";
import { IMeetingDocument } from "../infrastructure/meetingSchema.js";

export class MeetingController {
  constructor(
    private readonly createMeetingUseCase: IuseCase<CreateMeetingDTO, IMeetingDocument>,
    private readonly getMeetingsUseCase: IuseCase<
      GetMeetingsDTO,
      { meetings: IMeetingDocument[]; total: number }
    >,
    private readonly getMeetingByIdUseCase: IuseCase<GetMeetingByIdDTO, IMeetingDocument>,
    private readonly updateMeetingUseCase: IuseCase<UpdateMeetingDTO, IMeetingDocument>,
    private readonly cancelMeetingUseCase: IuseCase<CancelMeetingDTO, IMeetingDocument>,
    private readonly deleteMeetingUseCase: IuseCase<DeleteMeetingDTO, void>
  ) {}

  private getAuthenticatedWorkspaceContext(req: AuthRequest) {
    const user = req.user;
    if (!user || !user.workspaceId) {
      throw new AppError(MESSAGES.ERRORS.WORKSPACE_CONTEXT_MISSING, HttpStatus.BAD_REQUEST);
    }
    return user;
  }

  createMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedWorkspaceContext(req);
      const { title, description, startTime, endTime, participants } = req.body;

      const meeting = await this.createMeetingUseCase.execute({
        title,
        description,
        startTime,
        endTime,
        hostId: user.id,
        workspaceId: user.workspaceId,
        participants,
      });

      return ApiResposne.success(
        res,
        MESSAGES.SUCCESS.MEETING_CREATED,
        meeting,
        HttpStatus.CREATED
      );
    } catch (error) {
      next(error);
    }
  };

  getMeetings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedWorkspaceContext(req);
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const status = req.query.status as string | undefined;

      const result = await this.getMeetingsUseCase.execute({
        workspaceId: user.workspaceId,
        userId: user.id,
        userRole: user.role,
        page,
        limit,
        status,
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.MEETINGS_FETCHED, result);
    } catch (error) {
      next(error);
    }
  };

  getMeetingById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedWorkspaceContext(req);
      const meetingId = req.params.id as string;

      const meeting = await this.getMeetingByIdUseCase.execute({
        meetingId,
        workspaceId: user.workspaceId,
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.MEETING_FETCHED, meeting);
    } catch (error) {
      next(error);
    }
  };

  updateMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedWorkspaceContext(req);
      const meetingId = req.params.id as string;
      const { title, description, startTime, endTime, status, participants } = req.body;

      const updated = await this.updateMeetingUseCase.execute({
        meetingId,
        workspaceId: user.workspaceId,
        userId: user.id,
        userRole: user.role,
        data: {
          title,
          description,
          startTime,
          endTime,
          status,
          participants,
        },
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.MEETING_UPDATED, updated);
    } catch (error) {
      next(error);
    }
  };

  cancelMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedWorkspaceContext(req);
      const meetingId = req.params.id as string;

      const cancelled = await this.cancelMeetingUseCase.execute({
        meetingId,
        workspaceId: user.workspaceId,
        userId: user.id,
        userRole: user.role,
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.MEETING_CANCELLED, cancelled);
    } catch (error) {
      next(error);
    }
  };

  deleteMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedWorkspaceContext(req);
      const meetingId = req.params.id as string;

      await this.deleteMeetingUseCase.execute({
        meetingId,
        workspaceId: user.workspaceId,
        userId: user.id,
        userRole: user.role,
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.MEETING_DELETED);
    } catch (error) {
      next(error);
    }
  };
}
