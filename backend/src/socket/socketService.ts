import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { socketAuthMiddleware } from "./socketMiddleware.js";
import logger from "../shared/utils/logger.js";

let io: SocketIOServer;

export const socketService = {
  init(httpServer: HttpServer) {
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:5173",
        credentials: true,
      },
    });

    // Authenticate every connection with JWT
    io.use(socketAuthMiddleware);

    io.on("connection", (socket) => {
      const user = socket.data.user;
      const workspaceId: string | undefined = user?.workspaceId;

      if (workspaceId) {
        socket.join(`workspace:${workspaceId}`);
        logger.info(
          `[Socket] User ${user.id} (${user.role}) joined workspace:${workspaceId}`
        );
      } else {
        // Workspace admin: workspaceId comes from DB; we rely on the client sending it via handshake query
        const queryWorkspaceId = socket.handshake.query?.workspaceId as
          | string
          | undefined;
        if (queryWorkspaceId) {
          socket.join(`workspace:${queryWorkspaceId}`);
          logger.info(
            `[Socket] Admin ${user.id} joined workspace:${queryWorkspaceId}`
          );
        }
      }

      socket.on("join-workspace", (wId: string) => {
        socket.join(`workspace:${wId}`);
        logger.info(`[Socket] ${user.id} explicitly joined workspace:${wId}`);
      });

      socket.on("disconnect", () => {
        logger.info(`[Socket] User ${user?.id} disconnected`);
      });
    });

    logger.info("[Socket] Socket.io server initialized");
    return io;
  },

  getIO(): SocketIOServer {
    if (!io) throw new Error("Socket.io not initialized. Call socketService.init() first.");
    return io;
  },

  emitToWorkspace(workspaceId: string, event: string, payload: unknown) {
    if (!io) return;
    io.to(`workspace:${workspaceId}`).emit(event, payload);
    logger.info(`[Socket] Emitted '${event}' to workspace:${workspaceId}`);
  },
};
