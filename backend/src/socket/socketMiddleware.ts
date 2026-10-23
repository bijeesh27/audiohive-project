import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { TokenPayload } from "../middleware/authMiddleware.js";
import logger from "../shared/utils/logger.js";
import { UserModel } from "../shared/User.utils/userSchema.js";
import { WorkspaceModel } from "../modules/workspace/infrastructure/workspaceSchema.js";
import { getUserWorkspaceIds } from "../shared/User.utils/workspaceMembership.js";
import { UserRoles } from "../common/constant/userRoles.js";

export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
) {
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token) {
    logger.warn("[Socket] Connection rejected — no token provided");
    return next(new Error("Authentication error: no token"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    const user = await UserModel.findById(decoded.id);
    if (!user || !user.status || user.role !== decoded.role) {
      throw new Error("Account is unavailable");
    }

    const workspaceIds = getUserWorkspaceIds(user);
    if (user.role === UserRoles.MEMBER || user.role === UserRoles.WORKSPACE_ADMIN) {
      if (!decoded.workspaceId || !workspaceIds.includes(decoded.workspaceId)) {
        throw new Error("Workspace access is unavailable");
      }

      const workspaceQuery = user.role === UserRoles.WORKSPACE_ADMIN
        ? { _id: decoded.workspaceId, status: "active", workspaceAdminEmail: user.email }
        : { _id: decoded.workspaceId, status: "active" };
      const workspace = await WorkspaceModel.findOne(workspaceQuery).select("_id");
      if (!workspace) throw new Error("Workspace access is unavailable");
    }

    socket.data.user = { ...decoded, username: user.username, userEmail: user.email };
    next();
  } catch {
    logger.warn("[Socket] Connection rejected — invalid token");
    next(new Error("Authentication error: invalid token"));
  }
}
