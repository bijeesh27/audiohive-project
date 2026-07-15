import express, { json, urlencoded } from "express";
import dotenv from "dotenv";
dotenv.config();
import authRouter from "./modules/auth/presentation/auth.routes.ts";
import superAdminRouter from "./modules/superAdmin/presentation/superAdmin.routes.ts";
import { globelErrorHandler } from "./middleware/errorMiddleware.ts";

export function connectApp() {
  const app = express();
  app.use(urlencoded({ extended: true }));
  app.use(json());

  app.use(globelErrorHandler);

  const PORT = process.env.PORT || 5000;

  app.use("/api/auth", authRouter);
  app.use("/api/super-admin", superAdminRouter);

  app.listen(PORT, () => {
    console.log(`server running port = ${PORT}`);
  });
}
