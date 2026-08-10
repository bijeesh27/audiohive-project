import express, { json, urlencoded } from "express";
import dotenv from "dotenv";
dotenv.config();

import authRouter from "./modules/auth/presentation/auth.routes.ts";
import superAdminRouter from "./modules/superAdmin/presentation/superAdmin.routes.ts";
import workspaceAdminRouter from "./modules/workspaceAdmin/presentation/workspaceAdmin.route.ts";
import moderatorRouter from './modules/moderator/presentation/moderator.route.ts'
import subscriptionRouter from './modules/subscription/presentation/subscription.routes.ts'
import workspaceRouter from './modules/workspace/presentation/workspace.route.ts'
import { globelErrorHandler } from "./middleware/errorMiddleware.ts";
import cors from 'cors'
import cookieParser from "cookie-parser";
import { morganMiddleware } from "./middleware/morganMiddleware.ts";
import logger from "./shared/utils/logger.ts";
export function connectApp() {
  const app = express();
  app.use(morganMiddleware)

  app.use(cors({origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials:true}))
  app.use(urlencoded({ extended: true }));
  app.use(json());

  const PORT = process.env.PORT || 5000;

  app.use(cookieParser());

  app.use("/api/auth", authRouter);
  app.use("/api/super-admin", superAdminRouter);
  app.use("/api/workspaceadmin", workspaceAdminRouter);
  app.use("/api/moderator", moderatorRouter);
  app.use("/api/subscription",subscriptionRouter)
  app.use('/api/workspace',workspaceRouter)

  app.use(globelErrorHandler);

  app.listen(PORT, () => {
    logger.info(`the server running on -> ${PORT}`)
  });
}
