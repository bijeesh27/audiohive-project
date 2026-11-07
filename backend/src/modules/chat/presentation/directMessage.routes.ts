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
import { API_ROUTES } from "../../../common/constant/ApiRoutes.js";

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

router.get(API_ROUTES.DIRECT_CHAT.CONVERSATIONS, controller.getConversations.bind(controller));
router.get(API_ROUTES.DIRECT_CHAT.CONVERSATION_MESSAGES, controller.getMessages.bind(controller));
router.get(API_ROUTES.DIRECT_CHAT.USER, controller.getOrCreateWithUser.bind(controller));
router.post(API_ROUTES.DIRECT_CHAT.MESSAGES, controller.sendMessage.bind(controller));
router.patch(API_ROUTES.DIRECT_CHAT.MARK_READ, controller.markAsRead.bind(controller));
router.get(API_ROUTES.DIRECT_CHAT.USERS, controller.searchUsers.bind(controller));
router.get(API_ROUTES.DIRECT_CHAT.UNREAD_COUNT, controller.getUnreadCount.bind(controller));

export default router;
