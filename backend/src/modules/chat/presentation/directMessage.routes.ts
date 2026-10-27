import express from "express";
import { authMiddleware } from "../../../middleware/authMiddleware.js";
import { DirectMessageRepository } from "../infrastructure/directMessageRepository.js";
import { ActivityLogRepository } from "../../activityLog/infrastructure/activitylogRepository.js";
import { GetConversationsUseCase } from "../application/usecases/getConversationsUseCase.js";
import { GetDirectMessagesUseCase } from "../application/usecases/getDirectMessagesUseCase.js";
import { SendDirectMessageUseCase } from "../application/usecases/sendDirectMessageUseCase.js";
import { MarkDirectMessagesAsReadUseCase } from "../application/usecases/markDirectMessagesAsReadUseCase.js";
import { SearchDirectChatUsersUseCase } from "../application/usecases/searchDirectChatUsersUseCase.js";
import { GetDirectChatUnreadCountUseCase } from "../application/usecases/getDirectChatUnreadCountUseCase.js";
import { GetOrCreateConversationWithUserUseCase } from "../application/usecases/getOrCreateConversationWithUserUseCase.js";
import { DirectMessageController } from "./directMessage.controller.js";

const router = express.Router();

const dmRepo = new DirectMessageRepository();
const activityLogRepo = new ActivityLogRepository();

const getConversationsUseCase = new GetConversationsUseCase(dmRepo);
const getDirectMessagesUseCase = new GetDirectMessagesUseCase(dmRepo);
const sendDirectMessageUseCase = new SendDirectMessageUseCase(dmRepo, activityLogRepo);
const markDirectMessagesAsReadUseCase = new MarkDirectMessagesAsReadUseCase(dmRepo);
const searchDirectChatUsersUseCase = new SearchDirectChatUsersUseCase(dmRepo);
const getDirectChatUnreadCountUseCase = new GetDirectChatUnreadCountUseCase(dmRepo);
const getOrCreateConversationWithUserUseCase = new GetOrCreateConversationWithUserUseCase(dmRepo);

const controller = new DirectMessageController(
  getConversationsUseCase,
  getDirectMessagesUseCase,
  sendDirectMessageUseCase,
  markDirectMessagesAsReadUseCase,
  searchDirectChatUsersUseCase,
  getDirectChatUnreadCountUseCase,
  getOrCreateConversationWithUserUseCase
);

router.use(authMiddleware);

router.get("/conversations", controller.getConversations.bind(controller));
router.get("/conversations/:conversationId/messages", controller.getMessages.bind(controller));
router.get("/users/:targetUserId", controller.getOrCreateWithUser.bind(controller));
router.post("/messages", controller.sendMessage.bind(controller));
router.patch("/conversations/:conversationId/read", controller.markAsRead.bind(controller));
router.get("/users", controller.searchUsers.bind(controller));
router.get("/unread-count", controller.getUnreadCount.bind(controller));

export default router;
