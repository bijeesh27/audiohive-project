import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { socketAuthMiddleware } from "./socketMiddleware.js";
import { SOCKET_EVENTS } from "./socketEvents.js";
import logger from "../shared/utils/logger.js";
import { RoomRepository } from "../modules/room/infrastructure/roomRepository.js";
import { ValidateRoomAccessUseCase } from "../modules/room/application/usecases/validateRoomAccessUseCase.js";
import { MeetingRepository } from "../modules/meeting/infrastructure/meetingRepository.js";
import { ValidateCallAccessUseCase } from "../modules/meeting/application/usecases/validateCallAccessUseCase.js";

export interface CallParticipantSession {
  peerId: string;
  userId: string;
  username: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing?: boolean;
}

const roomPresence = new Map<string, Map<string, { userId: string; username: string }>>();
const callRooms = new Map<string, Map<string, CallParticipantSession>>();
const socketCallRoom = new Map<string, string>(); // socketId -> roomId
const onlineUsers = new Map<string, number>();

const roomRepository = new RoomRepository();
const validateRoomAccessUseCase = new ValidateRoomAccessUseCase(roomRepository);
const meetingRepository = new MeetingRepository();
const validateCallAccessUseCase = new ValidateCallAccessUseCase(
  roomRepository,
  meetingRepository
);

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
      if (!user) return;

      const userId = user.id;
      const workspaceId: string | undefined = user?.workspaceId
        ? String(user.workspaceId)
        : undefined;

      // Join individual user room for private/direct messaging & notifications
      socket.join(`user:${userId}`);

      // Track online status
      const currentSocketCount = (onlineUsers.get(userId) || 0) + 1;
      onlineUsers.set(userId, currentSocketCount);

      if (currentSocketCount === 1) {
        if (workspaceId) {
          io.to(`workspace:${workspaceId}`).emit(SOCKET_EVENTS.USER_STATUS_CHANGED, {
            userId,
            isOnline: true,
          });
        }
      }

      if (workspaceId) {
        socket.join(`workspace:${workspaceId}`);
        logger.info(
          `[Socket] User ${user?.id} (${user?.role}) joined workspace:${workspaceId}`
        );
      } else {
        logger.info(
          `[Socket] User ${user?.id} (${user?.role}) connected without workspaceId`
        );
      }

      // ── Direct Messaging events ────────────────────────────────
      socket.on(SOCKET_EVENTS.DM_TYPING, ({ receiverId, conversationId }: { receiverId: string; conversationId: string }) => {
        io.to(`user:${receiverId}`).emit(SOCKET_EVENTS.DM_TYPING, {
          senderId: userId,
          username: user.username ?? user.userEmail ?? userId,
          conversationId,
        });
      });

      socket.on(SOCKET_EVENTS.DM_STOP_TYPING, ({ receiverId, conversationId }: { receiverId: string; conversationId: string }) => {
        io.to(`user:${receiverId}`).emit(SOCKET_EVENTS.DM_STOP_TYPING, {
          senderId: userId,
          conversationId,
        });
      });

      socket.on("dm:get-online-users", (callback?: (users: string[]) => void) => {
        const activeIds = Array.from(onlineUsers.keys());
        if (typeof callback === "function") {
          callback(activeIds);
        } else {
          socket.emit("dm:online-users", activeIds);
        }
      });

      // ── Room presence ──────────────────────────────────────────
      socket.on(SOCKET_EVENTS.ROOM_JOIN, async (roomId: string) => {
        const isAllowed = await validateRoomAccessUseCase.execute({
          roomId,
          workspaceId,
          userId: user.id,
          role: user.role,
        });

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
        const isAllowed = await validateRoomAccessUseCase.execute({
          roomId,
          workspaceId,
          userId: user.id,
          role: user.role,
        });

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

      // ── Call / WebRTC (Audio & Video) ──────────────────────────
      const handleLeaveCall = (socketId: string) => {
        const roomId = socketCallRoom.get(socketId);
        if (!roomId) return;

        socketCallRoom.delete(socketId);
        const callMap = callRooms.get(roomId);
        if (callMap) {
          callMap.delete(socketId);
          io.to(`call:${roomId}`).emit(SOCKET_EVENTS.CALL_USER_LEFT, { peerId: socketId });
          io.to(`call:${roomId}`).emit(SOCKET_EVENTS.VOICE_USER_LEFT, { peerId: socketId });
          if (callMap.size === 0) {
            callRooms.delete(roomId);
          }
        }
        socket.leave(`call:${roomId}`);
        logger.info(`[Call] Peer ${socketId} left call in room:${roomId}`);
      };

      const handleJoinCall = async (
        roomId: string,
        mediaState?: { isMuted?: boolean; isVideoOff?: boolean }
      ) => {
        const isAllowed = await validateCallAccessUseCase.execute({
          roomId,
          workspaceId,
          userId: user.id,
          role: user.role,
        });

        if (!isAllowed) {
          socket.emit("access-denied", { message: "Call access denied" });
          return;
        }

        // Leave any prior call session first
        if (socketCallRoom.has(socket.id)) {
          handleLeaveCall(socket.id);
        }

        socket.join(`call:${roomId}`);
        socketCallRoom.set(socket.id, roomId);

        if (!callRooms.has(roomId)) {
          callRooms.set(roomId, new Map());
        }

        const callMap = callRooms.get(roomId)!;
        const participant: CallParticipantSession = {
          peerId: socket.id,
          userId: user.id,
          username: user.username ?? user.userEmail ?? user.id,
          isMuted: mediaState?.isMuted ?? false,
          isVideoOff: mediaState?.isVideoOff ?? false,
        };

        // Send existing participants to the newly joined peer
        const existingParticipants = Array.from(callMap.values());
        socket.emit(SOCKET_EVENTS.CALL_PARTICIPANTS, existingParticipants);
        socket.emit(SOCKET_EVENTS.VOICE_PARTICIPANTS, existingParticipants);

        // Notify all existing peers in this room's call
        socket.to(`call:${roomId}`).emit(SOCKET_EVENTS.CALL_USER_JOINED, participant);
        socket.to(`call:${roomId}`).emit(SOCKET_EVENTS.VOICE_USER_JOINED, participant);

        callMap.set(socket.id, participant);

        logger.info(
          `[Call] User ${user.id} (${participant.username}) joined call in room:${roomId} — ${callMap.size} in call`
        );
      };

      const verifyCallSignaling = (to: string): boolean => {
        const senderRoom = socketCallRoom.get(socket.id);
        const targetRoom = socketCallRoom.get(to);
        if (!senderRoom || !targetRoom || senderRoom !== targetRoom) {
          logger.warn(
            `[Call] Unauthorized signaling attempt from ${socket.id} to ${to}`
          );
          return false;
        }
        return true;
      };

      // Join call (support both CALL_JOIN and VOICE_JOIN)
      socket.on(
        SOCKET_EVENTS.CALL_JOIN,
        (roomId: string, mediaState?: { isMuted?: boolean; isVideoOff?: boolean }) => {
          handleJoinCall(roomId, mediaState);
        }
      );

      socket.on(
        SOCKET_EVENTS.VOICE_JOIN,
        (roomId: string, mediaState?: { isMuted?: boolean; isVideoOff?: boolean }) => {
          handleJoinCall(roomId, mediaState);
        }
      );

      // Leave call (support both CALL_LEAVE and VOICE_LEAVE)
      socket.on(SOCKET_EVENTS.CALL_LEAVE, () => {
        handleLeaveCall(socket.id);
      });

      socket.on(SOCKET_EVENTS.VOICE_LEAVE, () => {
        handleLeaveCall(socket.id);
      });

      // Media state toggle (mic / video / screen share)
      socket.on(
        SOCKET_EVENTS.CALL_MEDIA_STATE_CHANGED,
        ({
          isMuted,
          isVideoOff,
          isScreenSharing,
        }: {
          isMuted?: boolean;
          isVideoOff?: boolean;
          isScreenSharing?: boolean;
        }) => {
          const roomId = socketCallRoom.get(socket.id);
          if (!roomId) return;
          const callMap = callRooms.get(roomId);
          const participant = callMap?.get(socket.id);
          if (!participant) return;

          if (typeof isMuted === "boolean") participant.isMuted = isMuted;
          if (typeof isVideoOff === "boolean") participant.isVideoOff = isVideoOff;
          if (typeof isScreenSharing === "boolean") participant.isScreenSharing = isScreenSharing;

          io.to(`call:${roomId}`).emit(SOCKET_EVENTS.CALL_MEDIA_STATE_CHANGED, {
            peerId: socket.id,
            isMuted: participant.isMuted,
            isVideoOff: participant.isVideoOff,
            isScreenSharing: participant.isScreenSharing,
          });
        }
      );

      // WebRTC Offer
      const handleOffer = ({ to, sdp }: { to: string; sdp: RTCSessionDescriptionInit }) => {
        if (!verifyCallSignaling(to)) return;
        io.to(to).emit(SOCKET_EVENTS.CALL_OFFER, { from: socket.id, sdp });
        io.to(to).emit(SOCKET_EVENTS.VOICE_OFFER, { from: socket.id, sdp });
      };
      socket.on(SOCKET_EVENTS.CALL_OFFER, handleOffer);
      socket.on(SOCKET_EVENTS.VOICE_OFFER, handleOffer);

      // WebRTC Answer
      const handleAnswer = ({ to, sdp }: { to: string; sdp: RTCSessionDescriptionInit }) => {
        if (!verifyCallSignaling(to)) return;
        io.to(to).emit(SOCKET_EVENTS.CALL_ANSWER, { from: socket.id, sdp });
        io.to(to).emit(SOCKET_EVENTS.VOICE_ANSWER, { from: socket.id, sdp });
      };
      socket.on(SOCKET_EVENTS.CALL_ANSWER, handleAnswer);
      socket.on(SOCKET_EVENTS.VOICE_ANSWER, handleAnswer);

      // WebRTC ICE Candidate
      const handleIceCandidate = ({
        to,
        candidate,
      }: {
        to: string;
        candidate: RTCIceCandidateInit;
      }) => {
        if (!verifyCallSignaling(to)) return;
        io.to(to).emit(SOCKET_EVENTS.CALL_ICE_CANDIDATE, { from: socket.id, candidate });
        io.to(to).emit(SOCKET_EVENTS.VOICE_ICE_CANDIDATE, { from: socket.id, candidate });
      };
      socket.on(SOCKET_EVENTS.CALL_ICE_CANDIDATE, handleIceCandidate);
      socket.on(SOCKET_EVENTS.VOICE_ICE_CANDIDATE, handleIceCandidate);

      socket.on("disconnect", () => {
        // ── Clean up online users ──
        const remainingSockets = (onlineUsers.get(userId) || 1) - 1;
        if (remainingSockets <= 0) {
          onlineUsers.delete(userId);
          if (workspaceId) {
            io.to(`workspace:${workspaceId}`).emit(SOCKET_EVENTS.USER_STATUS_CHANGED, {
              userId,
              isOnline: false,
            });
          }
        } else {
          onlineUsers.set(userId, remainingSockets);
        }

        // ── Clean up room presence ──
        roomPresence.forEach((members, roomId) => {
          if (members.has(socket.id)) {
            members.delete(socket.id);
            const online = Array.from(members.values());
            io.to(`room:${roomId}`).emit(SOCKET_EVENTS.ROOM_PRESENCE_UPDATE, online);
            if (members.size === 0) roomPresence.delete(roomId);
          }
        });

        // ── Clean up call rooms ──
        handleLeaveCall(socket.id);

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

  isUserOnline(userId: string): boolean {
    return (onlineUsers.get(userId) || 0) > 0;
  },

  getOnlineUserIds(): string[] {
    return Array.from(onlineUsers.keys());
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
