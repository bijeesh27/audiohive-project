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

  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(urlencoded({ extended: true }));
  app.use(json());

  const PORT = process.env.PORT || 5000;

  app.use(cookieParser());

  app.use("/api/auth", authRouter);
  app.use("/api/super-admin", superAdminRouter);
  app.use("/api/workspaceadmin", workspaceAdminRouter);
  app.use("/api/subscription", subscriptionRouter);
  app.use("/api/workspace", workspaceRouter);
  app.use("/api/organization", organizationRouter);
  app.use("/api/room", roomRouter);
  app.use("/api/announcement", announcementRouter);
  app.use("/api/rooms", documentRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/meeting", meetingRouter);
  app.use("/api/activitylog", activityLogRouter);

  app.use(globelErrorHandler);

  // Initialize Socket.io on the same HTTP server
  socketService.init(httpServer);

  httpServer.listen(PORT, "0.0.0.0", () => {
    logger.info(`the server running on -> ${PORT}`);
  });
}
