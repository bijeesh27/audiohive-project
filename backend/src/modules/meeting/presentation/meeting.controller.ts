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
      {
        meetings: IMeetingDocument[];
        total: number;
        totalPages?: number;
        page?: number;
        counts?: { upcoming: number; past: number; cancelled: number };
      }
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
      const tab = (req.query.tab as string) || "upcoming";
      const q = (req.query.q as string) || (req.query.search as string) || "";

      const result = await this.getMeetingsUseCase.execute({
        workspaceId: user.workspaceId,
        userId: user.id,
        userRole: user.role,
        page,
        limit,
        status,
        tab,
        q,
      });

      const formattedMeetings = result.meetings.map((m) => {
        const hostObj = m.hostId as unknown as { _id?: unknown; username?: string; email?: string } | null;
        const hostIdStr = hostObj?._id ? String(hostObj._id) : typeof m.hostId === "string" ? m.hostId : "";
        const hostName = hostObj?.username || "Host";

        const participantsList = Array.isArray(m.participants) ? m.participants : [];
        const attendees = participantsList.slice(0, 3).map((p: any) => ({
          id: p?._id ? String(p._id) : typeof p === "string" ? p : "",
          name: p?.username || "Attendee",
          email: p?.email || "",
          avatar: p?.username ? p.username[0].toUpperCase() : "A",
        }));

        const isHost = Boolean(user.id && (hostIdStr === user.id || m.hostId?.toString() === user.id));

        return {
          id: m._id.toString(),
          _id: m._id.toString(),
          code: m.meetingCode,
          meetingCode: m.meetingCode,
          title: m.title,
          description: m.description || "",
          startTime: m.startTime ? new Date(m.startTime).toISOString() : "",
          endTime: m.endTime ? new Date(m.endTime).toISOString() : "",
          status: m.status,
          host: {
            id: hostIdStr,
            name: hostName,
            email: hostObj?.email || "",
            avatar: hostName[0].toUpperCase(),
          },
          hostId: m.hostId,
          attendees,
          participants: m.participants,
          attendeeCount: participantsList.length,
          isHost,
          workspaceId: m.workspaceId,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        };
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.MEETINGS_FETCHED, {
        meetings: formattedMeetings,
        total: result.total,
        page: result.page || page,
        totalPages: result.totalPages || Math.max(1, Math.ceil(result.total / limit)),
        counts: result.counts || { upcoming: 0, past: 0, cancelled: 0 },
      });
    } catch (error) {
      next(error);
    }
  };

  validateMeetingCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = this.getAuthenticatedWorkspaceContext(req);
      const code = ((req.params.code as string) || "").trim();

      if (!code || !/^meet-[a-zA-Z0-9]+$/i.test(code)) {
        throw new AppError("Invalid meeting code format. Code must follow 'meet-xxxxxxx'.", HttpStatus.BAD_REQUEST);
      }

      // Lookup meeting by code in active workspace
      const meeting = await this.getMeetingByIdUseCase.execute({
        meetingId: code,
        workspaceId: user.workspaceId,
      });

      if (!meeting) {
        throw new AppError("Meeting not found with this code.", HttpStatus.NOT_FOUND);
      }

      if (meeting.status === "cancelled") {
        throw new AppError("This meeting has been cancelled.", HttpStatus.BAD_REQUEST);
      }

      const now = new Date();
      if (meeting.status === "completed" || new Date(meeting.endTime) < now) {
        throw new AppError("This meeting has already ended.", HttpStatus.BAD_REQUEST);
      }

      const hostObj = meeting.hostId as unknown as { _id?: unknown; username?: string; email?: string } | null;
      const hostIdStr = hostObj?._id ? String(hostObj._id) : typeof meeting.hostId === "string" ? meeting.hostId : "";

      const formatted = {
        id: meeting._id.toString(),
        _id: meeting._id.toString(),
        code: meeting.meetingCode,
        meetingCode: meeting.meetingCode,
        title: meeting.title,
        description: meeting.description || "",
        startTime: meeting.startTime ? new Date(meeting.startTime).toISOString() : "",
        endTime: meeting.endTime ? new Date(meeting.endTime).toISOString() : "",
        status: meeting.status,
        host: {
          id: hostIdStr,
          name: hostObj?.username || "Host",
          email: hostObj?.email || "",
          avatar: hostObj?.username ? hostObj.username[0].toUpperCase() : "H",
        },
        hostId: meeting.hostId,
        attendees: (Array.isArray(meeting.participants) ? meeting.participants : []).slice(0, 3).map((p: any) => ({
          id: p?._id ? String(p._id) : typeof p === "string" ? p : "",
          name: p?.username || "Attendee",
          email: p?.email || "",
          avatar: p?.username ? p.username[0].toUpperCase() : "A",
        })),
        participants: meeting.participants,
        attendeeCount: Array.isArray(meeting.participants) ? meeting.participants.length : 0,
        isHost: Boolean(user.id && hostIdStr === user.id),
      };

      return ApiResposne.success(res, "Meeting code is valid and active", formatted);
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
