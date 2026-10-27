import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware.js";
import { ApiResposne } from "../../../common/Response/Response.js";
import { HttpStatus } from "../../../common/constant/httpStatus.js";
import { AppError } from "../../../common/Errors/AppError.js";
import { CreateMeetingUseCase } from "../application/usecases/createMeetingUseCase.js";
import { GetMeetingsUseCase } from "../application/usecases/getMeetingsUseCase.js";
import { GetMeetingByIdUseCase } from "../application/usecases/getMeetingByIdUseCase.js";
import { UpdateMeetingUseCase } from "../application/usecases/updateMeetingUseCase.js";
import { CancelMeetingUseCase } from "../application/usecases/cancelMeetingUseCase.js";
import { DeleteMeetingUseCase } from "../application/usecases/deleteMeetingUseCase.js";

export class MeetingController {
  constructor(
    private readonly createMeetingUseCase: CreateMeetingUseCase,
    private readonly getMeetingsUseCase: GetMeetingsUseCase,
    private readonly getMeetingByIdUseCase: GetMeetingByIdUseCase,
    private readonly updateMeetingUseCase: UpdateMeetingUseCase,
    private readonly cancelMeetingUseCase: CancelMeetingUseCase,
    private readonly deleteMeetingUseCase: DeleteMeetingUseCase
  ) {}

  createMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user || !user.workspaceId) {
        throw new AppError("Workspace context is missing", HttpStatus.BAD_REQUEST);
      }

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
        "Meeting scheduled successfully",
        meeting,
        HttpStatus.CREATED
      );
    } catch (error) {
      next(error);
    }
  };

  getMeetings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user || !user.workspaceId) {
        throw new AppError("Workspace context is missing", HttpStatus.BAD_REQUEST);
      }

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

      return ApiResposne.success(res, "Meetings fetched successfully", result);
    } catch (error) {
      next(error);
    }
  };

  getMeetingById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const meetingId = req.params.id as string;

      const meeting = await this.getMeetingByIdUseCase.execute({
        meetingId,
        workspaceId: user?.workspaceId,
      });

      return ApiResposne.success(res, "Meeting details fetched", meeting);
    } catch (error) {
      next(error);
    }
  };

  updateMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user || !user.workspaceId) {
        throw new AppError("Workspace context is missing", HttpStatus.BAD_REQUEST);
      }

      const meetingId = req.params.id as string;
      const updated = await this.updateMeetingUseCase.execute({
        meetingId,
        workspaceId: user.workspaceId,
        userId: user.id,
        userRole: user.role,
        data: req.body,
      });

      return ApiResposne.success(res, "Meeting updated successfully", updated);
    } catch (error) {
      next(error);
    }
  };

  cancelMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user || !user.workspaceId) {
        throw new AppError("Workspace context is missing", HttpStatus.BAD_REQUEST);
      }

      const meetingId = req.params.id as string;
      const cancelled = await this.cancelMeetingUseCase.execute({
        meetingId,
        workspaceId: user.workspaceId,
        userId: user.id,
        userRole: user.role,
      });

      return ApiResposne.success(res, "Meeting cancelled successfully", cancelled);
    } catch (error) {
      next(error);
    }
  };

  deleteMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user || !user.workspaceId) {
        throw new AppError("Workspace context is missing", HttpStatus.BAD_REQUEST);
      }

      const meetingId = req.params.id as string;
      await this.deleteMeetingUseCase.execute({
        meetingId,
        workspaceId: user.workspaceId,
        userId: user.id,
        userRole: user.role,
      });

      return ApiResposne.success(res, "Meeting deleted successfully");
    } catch (error) {
      next(error);
    }
  };
}
