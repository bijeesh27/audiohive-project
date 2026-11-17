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

import { UserModel } from "../../../shared/User.utils/userSchema";
import { socketService } from "../../../socket/socketService";
import { IroomRepository } from "../domain/IroomRepository";
import { RoomRepository } from "../infrastructure/roomRepository";

export class RoomController {
  private readonly roomRepo: IroomRepository;

  constructor(
    private readonly createRoomUseCase: IuseCase<CreateRoomDTO, void>,
    private readonly updateRoomUseCase: IuseCase<UpdateRoomRequestDTO, void>,
    private readonly deleteRoomUseCase: IuseCase<DeleteRoomDTO, void>,
    private readonly getRoomUseCase: IuseCase<GetRoomDTO, IRoomDocument | null>,
    private readonly getAllRoomsUseCase: IuseCase<GetAllRoomsDTO, GetAllRoomsResultDTO>,
    private readonly allocateRoomUsersUseCase: IuseCase<AllocateRoomUsersDTO, void>,
    private readonly resolveWorkspaceUseCase: IuseCase<ResolveWorkspaceDTO, ResolvedWorkspaceDTO>,
    private readonly getRoomParticipantsUseCase: IuseCase<GetRoomParticipantsDTO, GetRoomParticipantsResultDTO>,
    private readonly removeRoomUserUseCase: IuseCase<RemoveRoomUserDTO, void>,
    roomRepo?: IroomRepository
  ) {
    this.roomRepo = roomRepo || new RoomRepository();
  }

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
    if (req.user?.role !== UserRoles.MEMBER || room.type === "public" || room.type === "lounge" || room.isDefault) return;
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
      const { workspaceId, organizationId, room } = await this.getRoomInActiveWorkspace(req, roomId);
      const isOwner = room.createdBy?.toString() === req.user?.id;
      const isAdmin = req.user?.role === UserRoles.WORKSPACE_ADMIN;

      const isDefaultRoom = Boolean(room.isDefault || room.name === "Lounge" || room.name === "Office Common Room");
      if (isDefaultRoom) {
        if (!isAdmin) {
          throw new AppError("Only workspace admins can edit system default rooms", HttpStatus.FORBIDDEN);
        }
        if (req.body.type === "private" || req.body.isPrivate === true) {
          throw new AppError("System default rooms cannot be made private", HttpStatus.FORBIDDEN);
        }
        if (req.body.status === "blocked") {
          throw new AppError("System default rooms (Lounge, Office Common Room) cannot be disabled", HttpStatus.FORBIDDEN);
        }
      } else {
        if (!isOwner && !isAdmin) {
          throw new AppError("Only the room owner or workspace admin can update room settings", HttpStatus.FORBIDDEN);
        }
      }

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
      const { workspaceId, organizationId, room } = await this.getRoomInActiveWorkspace(req, roomId);
      const isDefaultRoom = Boolean(room.isDefault || room.name === "Lounge" || room.name === "Office Common Room");
      if (isDefaultRoom) {
        throw new AppError("System default rooms (Lounge, Office Common Room) cannot be deleted", HttpStatus.FORBIDDEN);
      }
      const isOwner = room.createdBy?.toString() === req.user?.id;
      const isAdmin = req.user?.role === UserRoles.WORKSPACE_ADMIN;
      if (!isOwner && !isAdmin) {
        throw new AppError("Only the room owner or workspace admin can delete this room", HttpStatus.FORBIDDEN);
      }
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

      const userId = req.user?.id;
      const isOwner = room.createdBy?.toString() === userId;
      const isAdmin = req.user?.role === UserRoles.WORKSPACE_ADMIN;
      const myRole = isOwner ? "owner" : isAdmin ? "admin" : "member";

      const isDefault = Boolean(room.isDefault || room.name === "Lounge" || room.name === "Office Common Room");
      let memberCount = 0;
      if (room.type === "public" || room.type === "lounge" || isDefault) {
        memberCount = await UserModel.countDocuments({
          $or: [{ workspaceIds: room.workspaceId }, { workspaceId: room.workspaceId }],
        });
      } else {
        const allowedCount = (room.allowedUsers || []).length;
        const ownerIncluded = (room.allowedUsers || []).some(
          (u: any) => u.toString() === room.createdBy?.toString()
        );
        memberCount = ownerIncluded ? allowedCount : allowedCount + 1;
      }

      const liveParticipants = socketService.getRoomLiveParticipants(roomId);
      const onlineCount = liveParticipants.length;

      const roomObj = typeof (room as any).toObject === "function" ? (room as any).toObject() : { ...room };
      const enrichedRoom = {
        ...roomObj,
        isDefault,
        memberCount,
        onlineCount,
        myRole,
      };

      return ApiResposne.success(res, MESSAGES.SUCCESS.ROOM_FETCHED, enrichedRoom);
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
      const type = req.query.type as string | undefined;
      const status = req.query.status as string | undefined;

      const userId = req.user?.id;
      const role = req.user?.role;
      const data = await this.getAllRoomsUseCase.execute({ workspaceId, page, limit, search, userId, role, type, status });

      const totalWorkspaceUsers = await UserModel.countDocuments({
        $or: [{ workspaceIds: workspaceId }, { workspaceId }],
      });

      let liveRoomsCount = 0;
      const enrichedRooms = (data.rooms || []).map((roomDoc: any) => {
        const r = typeof roomDoc.toObject === "function" ? roomDoc.toObject() : { ...roomDoc };
        const roomIdStr = r._id.toString();
        const liveParticipants = socketService.getRoomLiveParticipants(roomIdStr);
        const onlineCount = liveParticipants ? liveParticipants.length : 0;
        if (onlineCount > 0) liveRoomsCount++;

        const isDefault = Boolean(r.isDefault || r.name === "Lounge" || r.name === "Office Common Room");
        let memberCount = 0;
        if (r.type === "public" || r.type === "lounge" || isDefault) {
          memberCount = totalWorkspaceUsers;
        } else {
          const allowedCount = Array.isArray(r.allowedUsers) ? r.allowedUsers.length : 0;
          const ownerIncluded = Array.isArray(r.allowedUsers) && r.allowedUsers.some(
            (u: any) => (u?.toString ? u.toString() : String(u)) === (r.createdBy?.toString ? r.createdBy.toString() : String(r.createdBy))
          );
          memberCount = ownerIncluded ? allowedCount : allowedCount + 1;
        }

        return {
          ...r,
          isDefault,
          onlineCount,
          memberCount,
          lastActivity: r.updatedAt || r.createdAt,
        };
      });

      return ApiResposne.success(res, MESSAGES.SUCCESS.ROOMS_FETCHED, {
        rooms: enrichedRooms,
        total: data.total,
        liveRoomsCount,
      });
    } catch (error) {
      next(error);
    }
  };

  allocateRoomUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const roomId = req.params.id as string;
      const { userIds } = req.body;
      const { workspaceId, organizationId, room } = await this.getRoomInActiveWorkspace(req, roomId);
      const isOwner = room.createdBy?.toString() === req.user?.id;
      const isAdmin = req.user?.role === UserRoles.WORKSPACE_ADMIN;
      if (!isOwner && !isAdmin) {
        throw new AppError("Only the room owner or admin can invite members", HttpStatus.FORBIDDEN);
      }
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
      const { workspaceId, organizationId, room } = await this.getRoomInActiveWorkspace(req, roomId);
      const isOwner = room.createdBy?.toString() === req.user?.id;
      const isAdmin = req.user?.role === UserRoles.WORKSPACE_ADMIN;
      if (!isOwner && !isAdmin) {
        throw new AppError("Only the room owner or workspace admin can remove members", HttpStatus.FORBIDDEN);
      }
      if (room.createdBy?.toString() === userId) {
        throw new AppError("Cannot remove the room owner", HttpStatus.BAD_REQUEST);
      }
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

  leaveRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const roomId = req.params.id as string;
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(MESSAGES.ERRORS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
      }
      const { workspaceId, room } = await this.getRoomInActiveWorkspace(req, roomId);
      if (room.createdBy?.toString() === userId) {
        throw new AppError("Room owner cannot leave the room", HttpStatus.BAD_REQUEST);
      }
      if (room.type === "private") {
        await this.roomRepo.removeRoomUser(roomId, workspaceId, userId);
      }
      return ApiResposne.success(res, "Successfully left the room");
    } catch (error) {
      next(error);
    }
  };

  updateMemberRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const roomId = req.params.id as string;
      const targetUserId = req.params.userId as string;
      const { role } = req.body;
      const currentUserId = req.user?.id;

      if (!targetUserId || !role) {
        throw new AppError("Target user and role are required", HttpStatus.BAD_REQUEST);
      }

      const { room } = await this.getRoomInActiveWorkspace(req, roomId);
      const isOwner = room.createdBy?.toString() === currentUserId;
      const isAdmin = req.user?.role === UserRoles.WORKSPACE_ADMIN;

      if (!isOwner && !isAdmin) {
        throw new AppError("Only room owner or admin can change member roles", HttpStatus.FORBIDDEN);
      }

      if (room.createdBy?.toString() === targetUserId) {
        throw new AppError("Cannot change role of room owner", HttpStatus.BAD_REQUEST);
      }

      return ApiResposne.success(res, "Member role updated successfully");
    } catch (error) {
      next(error);
    }
  };
}
