import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { socketAuthMiddleware } from "./socketMiddleware.js";
import { SOCKET_EVENTS } from "./socketEvents.js";
import logger from "../shared/utils/logger.js";

// roomId -> Set of { userId, username }
const roomPresence = new Map<string, Map<string, { userId: string; username: string }>>();

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
      let workspaceId: string | undefined = user?.workspaceId
        ? String(user.workspaceId)
        : (socket.handshake.query?.workspaceId as string | undefined);

      if (workspaceId) {
        socket.join(`workspace:${workspaceId}`);
        logger.info(
          `[Socket] User ${user?.id} (${user?.role}) joined workspace:${workspaceId}`
        );
      } else {
        logger.warn(
          `[Socket] User ${user?.id} (${user?.role}) connected without workspaceId`
        );
      }

      socket.on("join-workspace", (wId: string) => {
        socket.join(`workspace:${wId}`);
        logger.info(`[Socket] ${user.id} explicitly joined workspace:${wId}`);
      });

      // ── Room presence ──────────────────────────────────────────
      socket.on(SOCKET_EVENTS.ROOM_JOIN, (roomId: string) => {
        socket.join(`room:${roomId}`);

        if (!roomPresence.has(roomId)) {
          roomPresence.set(roomId, new Map());
        }
        roomPresence.get(roomId)!.set(socket.id, {
          userId: user.id,
          username: user.username ?? user.userEmail ?? user.id,
        });

        const online = Array.from(roomPresence.get(roomId)!.values());

        // Broadcast updated list to ALL sockets in the room (including sender)
        io.to(`room:${roomId}`).emit(SOCKET_EVENTS.ROOM_PRESENCE_UPDATE, online);

        // Also send directly to the joining socket so they always get it
        // even if StrictMode caused a timing delay on the listener
        socket.emit(SOCKET_EVENTS.ROOM_PRESENCE_UPDATE, online);

        logger.info(`[Socket] User ${user.id} joined room:${roomId} — ${online.length} online`);
      });

      // Allow a client to fetch current presence without rejoining
      socket.on(SOCKET_EVENTS.ROOM_GET_PRESENCE, (roomId: string) => {
        const online = Array.from(roomPresence.get(roomId)?.values() ?? []);
        socket.emit(SOCKET_EVENTS.ROOM_PRESENCE_UPDATE, online);
      });

      socket.on(SOCKET_EVENTS.ROOM_LEAVE, (roomId: string) => {
        socket.leave(`room:${roomId}`);
        roomPresence.get(roomId)?.delete(socket.id);

        const online = Array.from(roomPresence.get(roomId)?.values() ?? []);
        io.to(`room:${roomId}`).emit(SOCKET_EVENTS.ROOM_PRESENCE_UPDATE, online);

        // Clean up empty room maps
        if (roomPresence.get(roomId)?.size === 0) {
          roomPresence.delete(roomId);
        }

        logger.info(`[Socket] User ${user.id} left room:${roomId} — ${online.length} online`);
      });

      socket.on("disconnect", () => {
        // Remove this socket from every room it was present in
        roomPresence.forEach((members, roomId) => {
          if (members.has(socket.id)) {
            members.delete(socket.id);
            const online = Array.from(members.values());
            io.to(`room:${roomId}`).emit(SOCKET_EVENTS.ROOM_PRESENCE_UPDATE, online);
            if (members.size === 0) roomPresence.delete(roomId);
          }
        });
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
