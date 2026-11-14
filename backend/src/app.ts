import express, { json, urlencoded } from "express";
import { createServer } from "http";
import dotenv from "dotenv";
dotenv.config();

import authRouter from "./modules/auth/presentation/auth.routes.ts";
import superAdminRouter from "./modules/superAdmin/presentation/superAdmin.routes.ts";
import workspaceAdminRouter from "./modules/workspaceAdmin/presentation/workspaceAdmin.route.ts";
import subscriptionRouter from "./modules/subscription/presentation/subscription.routes.ts";
import workspaceRouter from "./modules/workspace/presentation/workspace.route.ts";
import organizationRouter from "./modules/organization/presentation/organization.route.ts";
import roomRouter from "./modules/room/presentation/room.route.ts";
import announcementRouter from "./modules/announcement/presentation/announcement.route.ts";
import documentRouter from "./modules/document/presentation/documentRoutes.ts";
import activityLogRouter from "./modules/activityLog/presentation/activity.routes.ts";
import chatRouter from "./modules/chat/presentation/chat.routes.ts";
import meetingRouter from "./modules/meeting/presentation/meeting.route.ts";
import whiteboardRouter from "./modules/whiteboard/presentation/whiteboard.routes.ts";
import { BASE_API_ROUTES } from "./common/constant/ApiRoutes.ts";
import { globelErrorHandler } from "./middleware/errorMiddleware.ts";
import cors from "cors";
import cookieParser from "cookie-parser";
import { morganMiddleware } from "./middleware/morganMiddleware.ts";
import logger from "./shared/utils/logger.ts";
import { socketService } from "./socket/socketService.ts";

export function connectApp() {
  const app = express();
  const httpServer = createServer(app);
  app.use(morganMiddleware);

  const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://10.20.10.137:5173",
  ];

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      exposedHeaders: ["Content-Disposition", "Content-Type", "Content-Length"],
    })
  );
  app.use(urlencoded({ extended: true }));
  app.use(json());

  const PORT = Number(process.env.PORT) || 5000;

  app.use(cookieParser());

  app.use(BASE_API_ROUTES.AUTH, authRouter);
  app.use(BASE_API_ROUTES.SUPER_ADMIN, superAdminRouter);
  app.use(BASE_API_ROUTES.WORKSPACE_ADMIN, workspaceAdminRouter);
  app.use(BASE_API_ROUTES.SUBSCRIPTION, subscriptionRouter);
  app.use(BASE_API_ROUTES.WORKSPACE, workspaceRouter);
  app.use(BASE_API_ROUTES.ORGANIZATION, organizationRouter);
  app.use(BASE_API_ROUTES.ROOM, roomRouter);
  app.use(BASE_API_ROUTES.ANNOUNCEMENT, announcementRouter);
  app.use(BASE_API_ROUTES.ROOMS_DOCUMENTS, documentRouter);
  app.use(BASE_API_ROUTES.CHAT, chatRouter);
  app.use(BASE_API_ROUTES.MEETING, meetingRouter);
  app.use(BASE_API_ROUTES.ACTIVITY_LOG, activityLogRouter);
  app.use(BASE_API_ROUTES.WHITEBOARD, whiteboardRouter);

  app.use(globelErrorHandler);

  // Initialize Socket.io on the same HTTP server
  socketService.init(httpServer);

  httpServer.listen(PORT, "0.0.0.0", () => {
    logger.info(`the server running on -> ${PORT}`);
  });
}
