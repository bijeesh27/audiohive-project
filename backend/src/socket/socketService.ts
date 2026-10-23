import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { socketAuthMiddleware } from "./socketMiddleware.js";
import { SOCKET_EVENTS } from "./socketEvents.js";
import logger from "../shared/utils/logger.js";
import { RoomModel } from "../modules/room/infrastructure/roomSchema.js";

const roomPresence = new Map<string, Map<string, { userId: string; username: string }>>();

const voiceRooms = new Map<string, Map<string, { userId: string; username: string }>>();

let io: SocketIOServer;

export const socketService = {
  init(httpServer: HttpServer) {
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:5173",
        credentials: true,
      },
    });

    io.use(socketAuthMiddleware);

    io.on("connection", (socket) => {
      const user = socket.data.user;
      const workspaceId: string | undefined = user?.workspaceId
        ? String(user.workspaceId)
        : undefined;

      if (workspaceId) {
        socket.join(`workspace:${workspaceId}`);
        socket.join(`user:${user.id}`);
        logger.info(
          `[Socket] User ${user?.id} (${user?.role}) joined workspace:${workspaceId}`
        );
      } else {
        logger.warn(
          `[Socket] User ${user?.id} (${user?.role}) connected without workspaceId`
        );
      }

      // ── Room presence ──────────────────────────────────────────
      socket.on(SOCKET_EVENTS.ROOM_JOIN, async (roomId: string) => {
        const room = await RoomModel.findById(roomId).select("workspaceId allowedUsers type");
        const isAllowed = room && room.workspaceId.toString() === workspaceId && (
          user.role !== "member" || room.type === "public" || room.allowedUsers.some((id) => id.toString() === user.id)
        );
        if (!isAllowed) {
          socket.emit("access-denied", { message: "Room access denied" });
          return;
        }

        socket.join(`room:${roomId}`);

        if (!roomPresence.has(roomId)) {
          roomPresence.set(roomId, new Map());
        }
        roomPresence.get(roomId)!.set(socket.id, {
          userId: user.id,
          username: user.username ?? user.userEmail ?? user.id,
        });

        const online = Array.from(roomPresence.get(roomId)!.values());

        io.to(`room:${roomId}`).emit(SOCKET_EVENTS.ROOM_PRESENCE_UPDATE, online);

        socket.emit(SOCKET_EVENTS.ROOM_PRESENCE_UPDATE, online);

        logger.info(`[Socket] User ${user.id} joined room:${roomId} — ${online.length} online`);
      });

      socket.on(SOCKET_EVENTS.ROOM_GET_PRESENCE, async (roomId: string) => {
        const room = await RoomModel.findById(roomId).select("workspaceId allowedUsers type");
        const isAllowed = room && room.workspaceId.toString() === workspaceId && (
          user.role !== "member" || room.type === "public" || room.allowedUsers.some((id) => id.toString() === user.id)
        );
        if (!isAllowed) {
          socket.emit("access-denied", { message: "Room access denied" });
          return;
        }
        const online = Array.from(roomPresence.get(roomId)?.values() ?? []);
        socket.emit(SOCKET_EVENTS.ROOM_PRESENCE_UPDATE, online);
      });

      socket.on(SOCKET_EVENTS.ROOM_LEAVE, (roomId: string) => {
        if (!socket.rooms.has(`room:${roomId}`)) return;
        socket.leave(`room:${roomId}`);
        roomPresence.get(roomId)?.delete(socket.id);

        const online = Array.from(roomPresence.get(roomId)?.values() ?? []);
        io.to(`room:${roomId}`).emit(SOCKET_EVENTS.ROOM_PRESENCE_UPDATE, online);

        if (roomPresence.get(roomId)?.size === 0) {
          roomPresence.delete(roomId);
        }

        logger.info(`[Socket] User ${user.id} left room:${roomId} — ${online.length} online`);
      });

      // ── Room Chat Typing Indicators ────────────────────────────
      socket.on(SOCKET_EVENTS.CHAT_TYPING, (roomId: string) => {
        socket.to(`room:${roomId}`).emit(SOCKET_EVENTS.CHAT_TYPING, {
          userId: user.id,
          username: user.username ?? user.userEmail ?? user.id,
          roomId,
        });
      });

      socket.on(SOCKET_EVENTS.CHAT_STOP_TYPING, (roomId: string) => {
        socket.to(`room:${roomId}`).emit(SOCKET_EVENTS.CHAT_STOP_TYPING, {
          userId: user.id,
          roomId,
        });
      });

      // ── Voice / WebRTC Signaling ────────────────────────────────
      socket.on(SOCKET_EVENTS.VOICE_JOIN, async (roomId: string) => {
        // Reuse existing access-check logic
        const room = await RoomModel.findById(roomId).select("workspaceId allowedUsers type");
        const isAllowed =
          room &&
          room.workspaceId.toString() === workspaceId &&
          (user.role !== "member" ||
            room.type === "public" ||
            room.allowedUsers.some((id) => id.toString() === user.id));

        if (!isAllowed) {
          socket.emit("access-denied", { message: "Room access denied" });
          return;
        }

        if (!voiceRooms.has(roomId)) {
          voiceRooms.set(roomId, new Map());
        }

        const voiceMap = voiceRooms.get(roomId)!;
        const existingParticipants = Array.from(voiceMap.entries()).map(
          ([peerId, info]) => ({ peerId, ...info })
        );
        socket.emit(SOCKET_EVENTS.VOICE_PARTICIPANTS, existingParticipants);
        voiceMap.forEach((_info, peerId) => {
          io.to(peerId).emit(SOCKET_EVENTS.VOICE_USER_JOINED, {
            peerId: socket.id,
            userId: user.id,
            username: user.username ?? user.userEmail ?? user.id,
          });
        });

        voiceMap.set(socket.id, {
          userId: user.id,
          username: user.username ?? user.userEmail ?? user.id,
        });

        logger.info(
          `[Voice] User ${user.id} joined voice in room:${roomId} — ${voiceMap.size} in voice`
        );
      });

      socket.on(SOCKET_EVENTS.VOICE_LEAVE, (roomId: string) => {
        const voiceMap = voiceRooms.get(roomId);
        if (!voiceMap) return;

        voiceMap.delete(socket.id);
        io.to(`room:${roomId}`).emit(SOCKET_EVENTS.VOICE_USER_LEFT, {
          peerId: socket.id,
        });

        if (voiceMap.size === 0) {
          voiceRooms.delete(roomId);
        }

        logger.info(
          `[Voice] User ${user.id} left voice in room:${roomId} — ${voiceMap?.size ?? 0} in voice`
        );
      });
      socket.on(
        SOCKET_EVENTS.VOICE_OFFER,
        ({ to, sdp }: { to: string; sdp: RTCSessionDescriptionInit }) => {
          io.to(to).emit(SOCKET_EVENTS.VOICE_OFFER, { from: socket.id, sdp });
        }
      );

      socket.on(
        SOCKET_EVENTS.VOICE_ANSWER,
        ({ to, sdp }: { to: string; sdp: RTCSessionDescriptionInit }) => {
          io.to(to).emit(SOCKET_EVENTS.VOICE_ANSWER, { from: socket.id, sdp });
        }
      );

      socket.on(
        SOCKET_EVENTS.VOICE_ICE_CANDIDATE,
        ({ to, candidate }: { to: string; candidate: RTCIceCandidateInit }) => {
          io.to(to).emit(SOCKET_EVENTS.VOICE_ICE_CANDIDATE, {
            from: socket.id,
            candidate,
          });
        }
      );

      socket.on("disconnect", () => {
        // ── Clean up room presence ──
        roomPresence.forEach((members, roomId) => {
          if (members.has(socket.id)) {
            members.delete(socket.id);
            const online = Array.from(members.values());
            io.to(`room:${roomId}`).emit(SOCKET_EVENTS.ROOM_PRESENCE_UPDATE, online);
            if (members.size === 0) roomPresence.delete(roomId);
          }
        });

        // ── Clean up voice rooms ──
        voiceRooms.forEach((voiceMap, roomId) => {
          if (voiceMap.has(socket.id)) {
            voiceMap.delete(socket.id);
            io.to(`room:${roomId}`).emit(SOCKET_EVENTS.VOICE_USER_LEFT, {
              peerId: socket.id,
            });
            if (voiceMap.size === 0) voiceRooms.delete(roomId);
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

  async disconnectUserFromWorkspaces(userId: string, workspaceIds: string[]) {
    if (!io || workspaceIds.length === 0) return;
    const sockets = await io.in(`user:${userId}`).fetchSockets();
    for (const socket of sockets) {
      const activeWorkspaceId = socket.data.user?.workspaceId?.toString();
      if (activeWorkspaceId && workspaceIds.includes(activeWorkspaceId)) {
        socket.disconnect(true);
      }
    }
  },
};
