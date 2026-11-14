import { Router } from "express";
import { MemberDashboardController } from "./member.controller";
import { authMiddleware, roleMiddleware } from "../../../middleware/authMiddleware";
import { UserRoles } from "../../../common/constant/userRoles";
import { API_ROUTES } from "../../../common/constant/ApiRoutes";

const memberRouter = Router();
const controller = new MemberDashboardController();

const allowedRoles = [
  UserRoles.MEMBER,
  UserRoles.WORKSPACE_ADMIN,
  UserRoles.ORGANIZATION_OWNER,
  UserRoles.SUPER_ADMIN,
];

memberRouter.get(
  API_ROUTES.MEMBER.DASHBOARD_SUMMARY,
  authMiddleware,
  roleMiddleware(allowedRoles),
  controller.getDashboardSummary
);

memberRouter.get(
  API_ROUTES.MEMBER.ROOMS,
  authMiddleware,
  roleMiddleware(allowedRoles),
  controller.getMemberRooms
);

export default memberRouter;

