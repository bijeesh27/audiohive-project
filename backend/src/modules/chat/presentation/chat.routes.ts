import express from "express";
import { authMiddleware } from "../../../middleware/authMiddleware.js";
import { ChatMessageRepository } from "../infrastructure/chatMessageRepository.js";
import { ActivityLogRepository } from "../../activityLog/infrastructure/activitylogRepository.js";
import { SendMessageUseCase } from "../application/usecases/sendMessageUseCase.js";
import { GetRoomMessagesUseCase } from "../application/usecases/getRoomMessagesUseCase.js";
import { DeleteMessageUseCase } from "../application/usecases/deleteMessageUseCase.js";
import { ChatController } from "./chat.controller.js";
import directMessageRouter from "./directMessage.routes.js";

const router = express.Router({ mergeParams: true });

const chatRepo = new ChatMessageRepository();
const activityLogRepo = new ActivityLogRepository();

const sendMessageUseCase = new SendMessageUseCase(chatRepo, activityLogRepo);
const getRoomMessagesUseCase = new GetRoomMessagesUseCase(chatRepo);
const deleteMessageUseCase = new DeleteMessageUseCase(chatRepo);

const controller = new ChatController(
  sendMessageUseCase,
  getRoomMessagesUseCase,
  deleteMessageUseCase
);

router.use(authMiddleware);

// Direct messaging routes
router.use("/direct", directMessageRouter);

// Room chat routes
router.get("/:roomId/messages", controller.getMessages.bind(controller));
router.post("/:roomId/messages", controller.sendMessage.bind(controller));
router.delete("/:roomId/messages/:messageId", controller.deleteMessage.bind(controller));

export default router;
