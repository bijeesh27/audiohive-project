import express from "express";
import { authMiddleware } from "../../../middleware/authMiddleware.js";
import { RoomRepository } from "../../room/infrastructure/roomRepository.js";
import { ValidateRoomAccessUseCase } from "../../room/application/usecases/validateRoomAccessUseCase.js";
import { WhiteboardRepository } from "../infrastructure/whiteboardRepository.js";
import { WhiteboardSocketBroadcaster } from "../infrastructure/whiteboardBroadcaster.js";
import { GetWhiteboardNotesUseCase } from "../application/usecases/getWhiteboardNotesUseCase.js";
import { CreateStickyNoteUseCase } from "../application/usecases/createStickyNoteUseCase.js";
import { UpdateStickyNoteUseCase } from "../application/usecases/updateStickyNoteUseCase.js";
import { MoveStickyNoteUseCase } from "../application/usecases/moveStickyNoteUseCase.js";
import { UpdateStickyNoteColorUseCase } from "../application/usecases/updateStickyNoteColorUseCase.js";
import { DeleteStickyNoteUseCase } from "../application/usecases/deleteStickyNoteUseCase.js";
import { WhiteboardController } from "./whiteboard.controller.js";
import { API_ROUTES } from "../../../common/constant/ApiRoutes.js";

const router = express.Router();


const roomRepo = new RoomRepository();
const whiteboardRepo = new WhiteboardRepository();
const whiteboardBroadcaster = new WhiteboardSocketBroadcaster();


const validateRoomAccessUseCase = new ValidateRoomAccessUseCase(roomRepo);
const getNotesUseCase = new GetWhiteboardNotesUseCase(whiteboardRepo, validateRoomAccessUseCase);
const createNoteUseCase = new CreateStickyNoteUseCase(whiteboardRepo, validateRoomAccessUseCase, roomRepo);
const updateNoteUseCase = new UpdateStickyNoteUseCase(whiteboardRepo, validateRoomAccessUseCase);
const moveNoteUseCase = new MoveStickyNoteUseCase(whiteboardRepo, validateRoomAccessUseCase);
const updateColorUseCase = new UpdateStickyNoteColorUseCase(whiteboardRepo, validateRoomAccessUseCase);
const deleteNoteUseCase = new DeleteStickyNoteUseCase(whiteboardRepo, validateRoomAccessUseCase);

const controller = new WhiteboardController(
  getNotesUseCase,
  createNoteUseCase,
  updateNoteUseCase,
  moveNoteUseCase,
  updateColorUseCase,
  deleteNoteUseCase,
  whiteboardBroadcaster
);

router.use(authMiddleware);

router.get(API_ROUTES.WHITEBOARD.GET_NOTES, controller.getNotes);
router.post(API_ROUTES.WHITEBOARD.CREATE_NOTE, controller.createNote);
router.patch(API_ROUTES.WHITEBOARD.MOVE_NOTE, controller.moveNote);
router.patch(API_ROUTES.WHITEBOARD.UPDATE_COLOR, controller.updateColor);
router.patch(API_ROUTES.WHITEBOARD.UPDATE_NOTE, controller.updateNote);
router.delete(API_ROUTES.WHITEBOARD.DELETE_NOTE, controller.deleteNote);

export default router;
