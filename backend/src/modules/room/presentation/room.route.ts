import express from "express";
import { RoomRepository } from "../infrastructure/roomRepository";
import { CreateRoomUseCase } from "../application/usecases/createRoomUseCase";
import { UpdateRoomUseCase } from "../application/usecases/updateRoomUseCase";
import { DeleteRoomUseCase } from "../application/usecases/deleteRoomUseCase";
import { GetRoomUseCase } from "../application/usecases/getRoomUseCase";
import { GetAllRoomsUseCase } from "../application/usecases/getAllRoomsUseCase";
import { AllocateRoomUsersUseCase } from "../application/usecases/allocateRoomUsersUseCase";
import { GetRoomParticipantsUseCase } from "../application/usecases/getRoomParticipantsUseCase";
import { RemoveRoomUserUseCase } from "../application/usecases/removeRoomUserUseCase";
import { RoomController } from "./room.controller";
import { API_ROUTES } from "../../../common/constant/ApiRoutes";
import { authMiddleware, roleMiddleware } from "../../../middleware/authMiddleware";
import { UserRoles } from "../../../common/constant/userRoles";

import { WorkspaceReopsitory } from "../../workspace/infrastructure/workspaceRepository";
import { UserRepository } from "../../auth/infrastructure/userRepository";

const router = express.Router();

const roomRepository = new RoomRepository();
const workspaceRepository = new WorkspaceReopsitory();
const userRepository = new UserRepository();

const createRoomUseCase = new CreateRoomUseCase(roomRepository);
const updateRoomUseCase = new UpdateRoomUseCase(roomRepository);
const deleteRoomUseCase = new DeleteRoomUseCase(roomRepository);
const getRoomUseCase = new GetRoomUseCase(roomRepository);
const getAllRoomsUseCase = new GetAllRoomsUseCase(roomRepository);
const allocateRoomUsersUseCase = new AllocateRoomUsersUseCase(roomRepository);
const getRoomParticipantsUseCase = new GetRoomParticipantsUseCase(roomRepository);
const removeRoomUserUseCase = new RemoveRoomUserUseCase(roomRepository);

const controller = new RoomController(
  createRoomUseCase,
  updateRoomUseCase,
  deleteRoomUseCase,
  getRoomUseCase,
  getAllRoomsUseCase,
  allocateRoomUsersUseCase,
  workspaceRepository,
  userRepository,
  getRoomParticipantsUseCase,
  removeRoomUserUseCase
);

router.post(
  API_ROUTES.ROOM.CREATE_ROOM,
  authMiddleware,
  roleMiddleware([UserRoles.WORKSPACE_ADMIN]),
  controller.createRoom.bind(controller)
);

router.put(
  API_ROUTES.ROOM.UPDATE_ROOM,
  authMiddleware,
  roleMiddleware([UserRoles.WORKSPACE_ADMIN]),
  controller.updateRoom.bind(controller)
);

router.delete(
  API_ROUTES.ROOM.DELETE_ROOM,
  authMiddleware,
  roleMiddleware([UserRoles.WORKSPACE_ADMIN]),
  controller.deleteRoom.bind(controller)
);

router.get(
  API_ROUTES.ROOM.GET_ALL_ROOMS,
  authMiddleware,
  roleMiddleware([UserRoles.WORKSPACE_ADMIN, UserRoles.MEMBER]),
  controller.getAllRooms.bind(controller)
);

router.get(
  API_ROUTES.ROOM.GET_ROOM,
  authMiddleware,
  roleMiddleware([UserRoles.WORKSPACE_ADMIN, UserRoles.MEMBER]),
  controller.getRoom.bind(controller)
);

router.post(
  API_ROUTES.ROOM.ALLOCATE_USERS,
  authMiddleware,
  roleMiddleware([UserRoles.WORKSPACE_ADMIN]),
  controller.allocateRoomUsers.bind(controller)
);

router.get(
  API_ROUTES.ROOM.GET_PARTICIPANTS,
  authMiddleware,
  roleMiddleware([UserRoles.WORKSPACE_ADMIN]),
  controller.getRoomParticipants.bind(controller)
);

router.delete(
  API_ROUTES.ROOM.REMOVE_USER,
  authMiddleware,
  roleMiddleware([UserRoles.WORKSPACE_ADMIN]),
  controller.removeRoomUser.bind(controller)
);

export default router;
