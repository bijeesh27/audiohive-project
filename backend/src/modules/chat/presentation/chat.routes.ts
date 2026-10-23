import express from "express";
import { authMiddleware } from "../../../middleware/authMiddleware";
import { ChatMessageRepository } from "../infrastructure/chatMessageRepository";
import { ActivityLogRepository } from "../../activityLog/infrastructure/activitylogRepository";
import { SendMessageUseCase } from "../application/usecases/sendMessageUseCase";
import { GetRoomMessagesUseCase } from "../application/usecases/getRoomMessagesUseCase";
import { DeleteMessageUseCase } from "../application/usecases/deleteMessageUseCase";
import { ChatController } from "./chat.controller";

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

router.get("/:roomId/messages", controller.getMessages.bind(controller));
router.post("/:roomId/messages", controller.sendMessage.bind(controller));
router.delete("/:roomId/messages/:messageId", controller.deleteMessage.bind(controller));

export default router;
