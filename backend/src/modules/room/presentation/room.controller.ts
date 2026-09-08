import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware";
import { IuseCase } from "../../../shared/interface/IuseCase";
import { CreateRoomDTO, UpdateRoomDTO, AllocateRoomUsersDTO, RemoveRoomUserDTO } from "../application/dto/roomDTO";
import { IRoomDocument } from "../infrastructure/roomSchema";
import { IworkspaceRepository } from "../../workspace/domain/IworkspaceRepository";
import { IuserRepository } from "../../auth/domain/IuserRepository";
import { ApiResposne } from "../../../common/Response/Response";
import { UserRoles } from "../../../common/constant/userRoles";
import { MESSAGES } from "../../../common/constant/messages";

export class RoomController {
  constructor(
    private readonly createRoomUseCase: IuseCase<CreateRoomDTO, void>,
    private readonly updateRoomUseCase: IuseCase<{ roomId: string; data: UpdateRoomDTO }, void>,
    private readonly deleteRoomUseCase: IuseCase<string, void>,
    private readonly getRoomUseCase: IuseCase<string, IRoomDocument | null>,
    private readonly getAllRoomsUseCase: IuseCase<{ workspaceId: string; page: number; limit: number; search?: string, userId?: string, role?: string }, { rooms: IRoomDocument[]; total: number }>,
    private readonly allocateRoomUsersUseCase: IuseCase<AllocateRoomUsersDTO, void>,
    private readonly workspaceRepository: IworkspaceRepository,
    private readonly userRepository: IuserRepository,
    private readonly getRoomParticipantsUseCase: IuseCase<string, { _id: string; username: string; email: string }[]>,
    private readonly removeRoomUserUseCase: IuseCase<RemoveRoomUserDTO, void>
  ) {}

  private async getWorkspaceAndOrgForUser(req: AuthRequest) {
    if (req.user?.role === UserRoles.WORKSPACE_ADMIN) {
      const workspace = req.user.userEmail ? await this.workspaceRepository.findByAdminEmail(req.user.userEmail) : null;
      if (!workspace) throw new Error(MESSAGES.ERRORS.WORKSPACE_ADMIN_NOT_FOUND);
      return { workspaceId: workspace._id.toString(), organizationId: workspace.organizationId.toString() };
    } else {
      const user = req.user?.id ? await this.userRepository.findById(req.user.id) : null;
      if (!user || !user.workspaceId) throw new Error(MESSAGES.ERRORS.USER_NOT_IN_WORKSPACE);
      const workspaceId = user.workspaceId.toString();
      const workspace = await this.workspaceRepository.getWorkspaceById(workspaceId);
      const organizationId = workspace?.organizationId?.toString() ?? "";
      return { workspaceId, organizationId };
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
      return ApiResposne.success(res, MESSAGES.SUCCESS.ROOM_CREATED);
    } catch (error) {
      next(error);
    }
  };

  updateRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const roomId = req.params.id as string;
      const data: UpdateRoomDTO = req.body;
      await this.updateRoomUseCase.execute({ roomId, data });
      return ApiResposne.success(res, MESSAGES.SUCCESS.ROOM_UPDATED);
    } catch (error) {
      next(error);
    }
  };

  deleteRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const roomId = req.params.id as string;
      await this.deleteRoomUseCase.execute(roomId);
      return ApiResposne.success(res, MESSAGES.SUCCESS.ROOM_DELETED);
    } catch (error) {
      next(error);
    }
  };

  getRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const roomId = req.params.id as string;
      const room = await this.getRoomUseCase.execute(roomId);

      if (!room) {
        return res.status(404).json({ success: false, message: MESSAGES.ERRORS.ROOM_NOT_FOUND });
      }

      if (req.user?.role === UserRoles.MEMBER) {
        const isPublic = room.type === "public";
        const userId = req.user.id;
        const isAllowed = room.allowedUsers?.some(
          (id: any) => id.toString() === userId
        );

        if (!isPublic && !isAllowed) {
          return res.status(403).json({
            success: false,
            message: MESSAGES.ERRORS.PRIVATE_ROOM_ACCESS_DENIED,
          });
        }
      }

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
      await this.allocateRoomUsersUseCase.execute({ roomId, userIds });
      return ApiResposne.success(res, MESSAGES.SUCCESS.ROOM_ACCESS_UPDATED);
    } catch (error) {
      next(error);
    }
  };

  getRoomParticipants = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const roomId = req.params.id as string;
      const participants = await this.getRoomParticipantsUseCase.execute(roomId);
      return ApiResposne.success(res, "Participants fetched", participants);
    } catch (error) {
      next(error);
    }
  };

  removeRoomUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const roomId = req.params.id as string;
      const userId = req.params.userId as string;
      await this.removeRoomUserUseCase.execute({ roomId, userId });
      return ApiResposne.success(res, "User removed from room");
    } catch (error) {
      next(error);
    }
  };
}
