import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware";
import { IuseCase } from "../../../shared/interface/IuseCase";
import {
  AllocateRoomUsersDTO,
  CreateRoomDTO,
  DeleteRoomDTO,
  GetAllRoomsDTO,
  GetAllRoomsResultDTO,
  GetRoomDTO,
  GetRoomParticipantsDTO,
  GetRoomParticipantsResultDTO,
  RemoveRoomUserDTO,
  UpdateRoomDTO,
  UpdateRoomRequestDTO,
} from "../application/dto/roomDTO";
import { IRoomDocument } from "../infrastructure/roomSchema";
import { ResolveWorkspaceDTO, ResolvedWorkspaceDTO } from "../../workspace/application/dto/workspaceDTOs";
import { ApiResposne } from "../../../common/Response/Response";
import { UserRoles } from "../../../common/constant/userRoles";
import { MESSAGES } from "../../../common/constant/messages";
import { HttpStatus } from "../../../common/constant/httpStatus";
import { AppError } from "../../../common/Errors/AppError";

export class RoomController {
  constructor(
    private readonly createRoomUseCase: IuseCase<CreateRoomDTO, void>,
    private readonly updateRoomUseCase: IuseCase<UpdateRoomRequestDTO, void>,
    private readonly deleteRoomUseCase: IuseCase<DeleteRoomDTO, void>,
    private readonly getRoomUseCase: IuseCase<GetRoomDTO, IRoomDocument | null>,
    private readonly getAllRoomsUseCase: IuseCase<GetAllRoomsDTO, GetAllRoomsResultDTO>,
    private readonly allocateRoomUsersUseCase: IuseCase<AllocateRoomUsersDTO, void>,
    private readonly resolveWorkspaceUseCase: IuseCase<ResolveWorkspaceDTO, ResolvedWorkspaceDTO>,
    private readonly getRoomParticipantsUseCase: IuseCase<GetRoomParticipantsDTO, GetRoomParticipantsResultDTO>,
    private readonly removeRoomUserUseCase: IuseCase<RemoveRoomUserDTO, void>
  ) {}

  private async getWorkspaceAndOrgForUser(req: AuthRequest) {
    return this.resolveWorkspaceUseCase.execute({
      userId: req.user?.id,
      userEmail: req.user?.userEmail,
      role: req.user?.role,
      activeWorkspaceId: req.user?.workspaceId,
    });
  }

  private async getRoomInActiveWorkspace(req: AuthRequest, roomId: string) {
    const workspace = await this.getWorkspaceAndOrgForUser(req);
    const room = await this.getRoomUseCase.execute({ roomId });
    if (!room || room.workspaceId.toString() !== workspace.workspaceId) {
      throw new AppError(MESSAGES.ERRORS.ROOM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return { ...workspace, room };
  }

  private assertMemberCanAccessRoom(req: AuthRequest, room: IRoomDocument) {
    if (req.user?.role !== UserRoles.MEMBER || room.type === "public") return;
    const userId = req.user.id;
    const isAllowed = room.allowedUsers?.some((id: unknown) => String(id) === userId);
    if (!isAllowed) {
      throw new AppError(MESSAGES.ERRORS.PRIVATE_ROOM_ACCESS_DENIED, HttpStatus.FORBIDDEN);
    }
  }

  createRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { workspaceId, organizationId } = await this.getWorkspaceAndOrgForUser(req);
      const data: CreateRoomDTO = {
        ...req.body,
        workspaceId,
        organizationId,
        createdBy: req.user?.id,
      };
      await this.createRoomUseCase.execute(data);
      return ApiResposne.success(res, MESSAGES.SUCCESS.ROOM_CREATED, undefined, HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  updateRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const roomId = req.params.id as string;
      const { workspaceId, organizationId } = await this.getWorkspaceAndOrgForUser(req);
      await this.getRoomInActiveWorkspace(req, roomId);
      const data: UpdateRoomDTO = {
        ...req.body,
        workspaceId,
        organizationId,
        actorId: req.user?.id
      };
      await this.updateRoomUseCase.execute({ roomId, data });
      return ApiResposne.success(res, MESSAGES.SUCCESS.ROOM_UPDATED);
    } catch (error) {
      next(error);
    }
  };

  deleteRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const roomId = req.params.id as string;
      const { workspaceId, organizationId } = await this.getRoomInActiveWorkspace(req, roomId);
      await this.deleteRoomUseCase.execute({
        roomId,
        workspaceId,
        organizationId,
        actorId: req.user?.id,
      });
      return ApiResposne.success(res, MESSAGES.SUCCESS.ROOM_DELETED);
    } catch (error) {
      next(error);
    }
  };

  getRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const roomId = req.params.id as string;
      const { room } = await this.getRoomInActiveWorkspace(req, roomId);
      this.assertMemberCanAccessRoom(req, room);

      return ApiResposne.success(res, MESSAGES.SUCCESS.ROOM_FETCHED, room);
    } catch (error) {
      next(error);
    }
  };

  getAllRooms = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { workspaceId } = await this.getWorkspaceAndOrgForUser(req);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;

      const userId = req.user?.id;
      const role = req.user?.role;
      const data = await this.getAllRoomsUseCase.execute({ workspaceId, page, limit, search, userId, role });
      return ApiResposne.success(res, MESSAGES.SUCCESS.ROOMS_FETCHED, data);
    } catch (error) {
      next(error);
    }
  };

  allocateRoomUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const roomId = req.params.id as string;
      const { userIds } = req.body;
      const { workspaceId, organizationId } = await this.getWorkspaceAndOrgForUser(req);
      await this.getRoomInActiveWorkspace(req, roomId);
      await this.allocateRoomUsersUseCase.execute({
        roomId,
        userIds,
        actorId: req.user?.id as string,
        workspaceId,
        organizationId,
      });
      return ApiResposne.success(res, MESSAGES.SUCCESS.ROOM_ACCESS_UPDATED);
    } catch (error) {
      next(error);
    }
  };

  getRoomParticipants = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const roomId = req.params.id as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;

      const { workspaceId, room } = await this.getRoomInActiveWorkspace(req, roomId);
      this.assertMemberCanAccessRoom(req, room);
      const { participants, total } = await this.getRoomParticipantsUseCase.execute({ roomId, workspaceId, page, limit, search });
      const totalPages = Math.max(1, Math.ceil(total / limit));

      return ApiResposne.success(res, MESSAGES.SUCCESS.PARTICIPANTS_FETCHED, { users: participants, totalPages });
    } catch (error) {
      next(error);
    }
  };

  removeRoomUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const roomId = req.params.id as string;
      const userId = req.params.userId as string;
      const { workspaceId, organizationId } = await this.getWorkspaceAndOrgForUser(req);
      await this.getRoomInActiveWorkspace(req, roomId);
      await this.removeRoomUserUseCase.execute({ 
        roomId, 
        userId,
        workspaceId,
        organizationId,
        actorId: req.user?.id
      });
      return ApiResposne.success(res, MESSAGES.SUCCESS.USER_REMOVED_FROM_ROOM);
    } catch (error) {
      next(error);
    }
  };
}
