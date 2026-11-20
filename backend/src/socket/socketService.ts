import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import { socketAuthMiddleware } from "./socketMiddleware.js";
import { SOCKET_EVENTS } from "./socketEvents.js";
import logger from "../shared/utils/logger.js";
import { RoomRepository } from "../modules/room/infrastructure/roomRepository.js";
import { ValidateRoomAccessUseCase } from "../modules/room/application/usecases/validateRoomAccessUseCase.js";
import { MeetingRepository } from "../modules/meeting/infrastructure/meetingRepository.js";
import { MeetingModel } from "../modules/meeting/infrastructure/meetingSchema.js";
import { ActivityLogModel } from "../modules/activityLog/infrastructure/activitylogSchema.js";
import { ValidateCallAccessUseCase } from "../modules/meeting/application/usecases/validateCallAccessUseCase.js";
import { WhiteboardRepository } from "../modules/whiteboard/infrastructure/whiteboardRepository.js";
import { loungeMusicManager } from "../modules/room/infrastructure/loungeMusicManager.js";
import type { TrackItem } from "../modules/room/domain/IAudioSourceService.js";
import { UserRoles } from "../common/constant/userRoles.js";
import { corsOriginChecker } from "../shared/utils/cors.utils.ts";
import { groqTranscriptionService } from "../services/groqTranscription.service.js";
import { liveTranscriptRepository } from "../modules/meeting/infrastructure/liveTranscriptRepository.js";

export interface CallParticipantSession {
  peerId: string;
  userId: string;
  username: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing?: boolean;
  joinedAt?: Date;
}

const roomPresence = new Map<string, Map<string, { userId: string; username: string }>>();
const whiteboardPresence = new Map<string, Map<string, { userId: string; username: string }>>();
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
const whiteboardRepository = new WhiteboardRepository();

let io: SocketIOServer;

export const socketService = {
  init(httpServer: HttpServer) {
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: corsOriginChecker,
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

      const emitRoomPresenceChanged = (targetRoomId: string) => {
        if (!workspaceId) return;
        const liveParticipants = socketService.getRoomLiveParticipants(targetRoomId);
        io.to(`workspace:${workspaceId}`).emit(SOCKET_EVENTS.ROOM_PRESENCE_CHANGED, {
          roomId: targetRoomId,
          participantCount: liveParticipants.length,
          isLive: liveParticipants.length > 0,
          participants: liveParticipants.slice(0, 3),
        });
      };

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
        emitRoomPresenceChanged(roomId);

        // Instantly push live music playback state to late joiner so they hear current song
        const liveMusicSnapshot = loungeMusicManager.getSnapshot(roomId, user.id, online.length);
        if (liveMusicSnapshot && liveMusicSnapshot.currentTrack) {
          socket.emit(SOCKET_EVENTS.MUSIC_STATE, liveMusicSnapshot);
        }

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
        emitRoomPresenceChanged(roomId);

        if (roomPresence.get(roomId)?.size === 0) {
          roomPresence.delete(roomId);
        }

        logger.info(`[Socket] User ${user.id} left room:${roomId} — ${online.length} online`);
      });

      // ── Lounge Music Synchronization (Feature-flagged with In-Memory Permission Cache) ──
      const loungeAccessCache = new Map<string, { isLounge: boolean; musicEnabled: boolean; expiresAt: number }>();

      const verifyLoungeMusicAccess = async (targetRoomId: string) => {
        const cached = loungeAccessCache.get(targetRoomId);
        if (cached && cached.expiresAt > Date.now()) {
          return cached.isLounge && cached.musicEnabled;
        }
        const room = await roomRepository.findRoom(targetRoomId);
        if (!room) return false;
        const isLounge = Boolean(room.isDefault || room.type === "lounge");
        const musicEnabled = room.settings?.music?.enabled !== false;
        loungeAccessCache.set(targetRoomId, {
          isLounge,
          musicEnabled,
          expiresAt: Date.now() + 60000, // cache for 60 seconds
        });
        return isLounge && musicEnabled;
      };

      const getActiveListenerCount = (targetRoomId: string) => {
        return Math.max(1, roomPresence.get(targetRoomId)?.size || 1);
      };

      socket.on(SOCKET_EVENTS.MUSIC_GET_STATE, async (targetRoomId: string) => {
        try {
          const allowed = await verifyLoungeMusicAccess(targetRoomId);
          if (!allowed) return;
          const listeners = getActiveListenerCount(targetRoomId);
          const snapshot = loungeMusicManager.getSnapshot(targetRoomId, user.id, listeners);
          socket.emit(SOCKET_EVENTS.MUSIC_STATE, snapshot);
        } catch (err) {
          logger.error(`[Socket] Error getting music state for ${targetRoomId}`, err);
        }
      });

      socket.on(SOCKET_EVENTS.MUSIC_PLAY, async (targetRoomId: string) => {
        try {
          const allowed = await verifyLoungeMusicAccess(targetRoomId);
          if (!allowed) return;
          loungeMusicManager.play(targetRoomId);
          const listeners = getActiveListenerCount(targetRoomId);
          const snapshot = loungeMusicManager.getSnapshot(targetRoomId, undefined, listeners);
          io.to(`room:${targetRoomId}`).emit(SOCKET_EVENTS.MUSIC_STATE, snapshot);
        } catch (err) {
          logger.error(`[Socket] Error playing music in ${targetRoomId}`, err);
        }
      });

      socket.on(SOCKET_EVENTS.MUSIC_PAUSE, async (targetRoomId: string) => {
        try {
          const allowed = await verifyLoungeMusicAccess(targetRoomId);
          if (!allowed) return;
          loungeMusicManager.pause(targetRoomId);
          const listeners = getActiveListenerCount(targetRoomId);
          const snapshot = loungeMusicManager.getSnapshot(targetRoomId, undefined, listeners);
          io.to(`room:${targetRoomId}`).emit(SOCKET_EVENTS.MUSIC_STATE, snapshot);
        } catch (err) {
          logger.error(`[Socket] Error pausing music in ${targetRoomId}`, err);
        }
      });

      socket.on(SOCKET_EVENTS.MUSIC_SEEK, async ({ roomId: targetRoomId, position }: { roomId: string; position: number }) => {
        try {
          const allowed = await verifyLoungeMusicAccess(targetRoomId);
          if (!allowed) return;
          loungeMusicManager.seek(targetRoomId, position);
          const listeners = getActiveListenerCount(targetRoomId);
          const snapshot = loungeMusicManager.getSnapshot(targetRoomId, undefined, listeners);
          io.to(`room:${targetRoomId}`).emit(SOCKET_EVENTS.MUSIC_STATE, snapshot);
        } catch (err) {
          logger.error(`[Socket] Error seeking music in ${targetRoomId}`, err);
        }
      });

      socket.on(SOCKET_EVENTS.MUSIC_ADD_QUEUE, async ({ roomId: targetRoomId, track }: { roomId: string; track: TrackItem }) => {
        try {
          const allowed = await verifyLoungeMusicAccess(targetRoomId);
          if (!allowed) return;
          loungeMusicManager.addToQueue(targetRoomId, track, {
            userId: user.id,
            username: user.username ?? user.userEmail ?? "Member",
          });
          const listeners = getActiveListenerCount(targetRoomId);
          const snapshot = loungeMusicManager.getSnapshot(targetRoomId, undefined, listeners);
          io.to(`room:${targetRoomId}`).emit(SOCKET_EVENTS.MUSIC_STATE, snapshot);
        } catch (err) {
          logger.error(`[Socket] Error adding music to queue in ${targetRoomId}`, err);
        }
      });

      socket.on(SOCKET_EVENTS.MUSIC_VOTE_SKIP, async (targetRoomId: string) => {
        try {
          const allowed = await verifyLoungeMusicAccess(targetRoomId);
          if (!allowed) return;
          const listeners = getActiveListenerCount(targetRoomId);
          loungeMusicManager.voteSkip(targetRoomId, user.id, listeners);
          const snapshot = loungeMusicManager.getSnapshot(targetRoomId, undefined, listeners);
          io.to(`room:${targetRoomId}`).emit(SOCKET_EVENTS.MUSIC_STATE, snapshot);
        } catch (err) {
          logger.error(`[Socket] Error voting skip in ${targetRoomId}`, err);
        }
      });

      socket.on(SOCKET_EVENTS.MUSIC_ADMIN_SKIP, async (targetRoomId: string) => {
        try {
          const allowed = await verifyLoungeMusicAccess(targetRoomId);
          if (!allowed) return;
          const isAdmin = user.role === UserRoles.WORKSPACE_ADMIN || user.role === UserRoles.ORGANIZATION_OWNER;
          if (!isAdmin) {
            socket.emit(SOCKET_EVENTS.MUSIC_ERROR, { message: "Only workspace admins can override skip" });
            return;
          }
          loungeMusicManager.adminSkip(targetRoomId);
          const listeners = getActiveListenerCount(targetRoomId);
          const snapshot = loungeMusicManager.getSnapshot(targetRoomId, undefined, listeners);
          io.to(`room:${targetRoomId}`).emit(SOCKET_EVENTS.MUSIC_STATE, snapshot);
        } catch (err) {
          logger.error(`[Socket] Error admin skipping music in ${targetRoomId}`, err);
        }
      });

      socket.on(SOCKET_EVENTS.MUSIC_GET_LIBRARY, async () => {
        try {
          const library = await loungeMusicManager.getAudioLibrary();
          socket.emit(SOCKET_EVENTS.MUSIC_LIBRARY, library);
        } catch (err) {
          logger.error("[Socket] Error fetching audio library", err);
        }
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

      // ── Collaborative Whiteboard ─────────────────────────────────
      socket.on(SOCKET_EVENTS.WHITEBOARD_JOIN, async (roomId: string) => {
        try {
          const room = await roomRepository.findRoom(roomId);
          if (!room) {
            socket.emit(SOCKET_EVENTS.WHITEBOARD_ERROR, { message: "Room not found" });
            return;
          }

          const effectiveWorkspaceId =
            workspaceId || room.workspaceId?.toString() || "";

          const isAllowed = await validateRoomAccessUseCase.execute({
            roomId,
            workspaceId: effectiveWorkspaceId,
            userId: user.id,
            role: user.role,
          });

          if (!isAllowed) {
            socket.emit(SOCKET_EVENTS.WHITEBOARD_ERROR, { message: "Whiteboard access denied" });
            return;
          }

          socket.join(`whiteboard:${roomId}`);

          if (!whiteboardPresence.has(roomId)) {
            whiteboardPresence.set(roomId, new Map());
          }
          whiteboardPresence.get(roomId)!.set(socket.id, {
            userId: user.id,
            username: user.username ?? user.userEmail ?? user.id,
          });

          const collaborators = Array.from(whiteboardPresence.get(roomId)!.values());
          io.to(`whiteboard:${roomId}`).emit(SOCKET_EVENTS.WHITEBOARD_PRESENCE, collaborators);

          const notes = await whiteboardRepository.findByRoomId(roomId);
          socket.emit(SOCKET_EVENTS.WHITEBOARD_INITIAL_STATE, notes);
          logger.info(`[Whiteboard] User ${user.id} joined whiteboard:${roomId}`);
        } catch (err) {
          logger.error(`[Whiteboard] Error joining whiteboard:${roomId}`, err);
          socket.emit(SOCKET_EVENTS.WHITEBOARD_ERROR, { message: "Failed to join whiteboard" });
        }
      });

      socket.on(SOCKET_EVENTS.WHITEBOARD_LEAVE, (roomId: string) => {
        if (!socket.rooms.has(`whiteboard:${roomId}`)) return;
        socket.leave(`whiteboard:${roomId}`);
        whiteboardPresence.get(roomId)?.delete(socket.id);

        const collaborators = Array.from(whiteboardPresence.get(roomId)?.values() ?? []);
        io.to(`whiteboard:${roomId}`).emit(SOCKET_EVENTS.WHITEBOARD_PRESENCE, collaborators);
        if (whiteboardPresence.get(roomId)?.size === 0) whiteboardPresence.delete(roomId);
        logger.info(`[Whiteboard] User ${user.id} left whiteboard:${roomId}`);
      });

      socket.on(
        SOCKET_EVENTS.WHITEBOARD_NOTE_CREATE,
        async (data: {
          roomId: string;
          content?: string;
          positionX?: number;
          positionY?: number;
          color?: string;
        }) => {
          try {
            const room = await roomRepository.findRoom(data.roomId);
            if (!room) return;

            const effectiveWorkspaceId =
              workspaceId || room.workspaceId?.toString() || "";

            const isAllowed = await validateRoomAccessUseCase.execute({
              roomId: data.roomId,
              workspaceId: effectiveWorkspaceId,
              userId: user.id,
              role: user.role,
            });
            if (!isAllowed) return;

            const defaultColors = [
              "#fef08a",
              "#fed7aa",
              "#bbf7d0",
              "#bae6fd",
              "#e9d5ff",
              "#fbcfe8",
            ];
            const color =
              data.color || defaultColors[Math.floor(Math.random() * defaultColors.length)];
            const posX =
              typeof data.positionX === "number"
                ? data.positionX
                : Math.round(80 + Math.random() * 200);
            const posY =
              typeof data.positionY === "number"
                ? data.positionY
                : Math.round(80 + Math.random() * 150);

            const newNote = await whiteboardRepository.create({
              roomId: data.roomId,
              workspaceId: effectiveWorkspaceId,
              content: data.content || "",
              positionX: posX,
              positionY: posY,
              color,
              createdBy: {
                userId: user.id,
                username: user.username ?? user.userEmail ?? user.id,
                email: user.userEmail,
              },
              version: 1,
              isDeleted: false,
            });

            io.to(`whiteboard:${data.roomId}`).emit(
              SOCKET_EVENTS.WHITEBOARD_NOTE_CREATED,
              newNote
            );
          } catch (err) {
            logger.error("[Whiteboard] Failed to create sticky note", err);
          }
        }
      );

      socket.on(
        SOCKET_EVENTS.WHITEBOARD_NOTE_UPDATE,
        async (data: {
          roomId: string;
          noteId: string;
          content?: string;
          positionX?: number;
          positionY?: number;
          color?: string;
          expectedVersion?: number;
        }) => {
          try {
            const isAllowed = await validateRoomAccessUseCase.execute({
              roomId: data.roomId,
              workspaceId,
              userId: user.id,
              role: user.role,
            });
            if (!isAllowed) return;

            const updatedNote = await whiteboardRepository.update(
              data.noteId,
              {
                content: data.content,
                positionX: data.positionX,
                positionY: data.positionY,
                color: data.color,
                updatedBy: {
                  userId: user.id,
                  username: user.username ?? user.userEmail ?? user.id,
                },
              },
              data.expectedVersion
            );

            if (updatedNote) {
              io.to(`whiteboard:${data.roomId}`).emit(
                SOCKET_EVENTS.WHITEBOARD_NOTE_UPDATED,
                updatedNote
              );
            }
          } catch (err) {
            logger.error("[Whiteboard] Failed to update sticky note", err);
          }
        }
      );

      socket.on(
        SOCKET_EVENTS.WHITEBOARD_NOTE_MOVE,
        async (data: {
          roomId: string;
          noteId: string;
          positionX: number;
          positionY: number;
        }) => {
          try {
            const isAllowed = await validateRoomAccessUseCase.execute({
              roomId: data.roomId,
              workspaceId,
              userId: user.id,
              role: user.role,
            });
            if (!isAllowed) return;

            const updatedNote = await whiteboardRepository.update(data.noteId, {
              positionX: data.positionX,
              positionY: data.positionY,
              updatedBy: {
                userId: user.id,
                username: user.username ?? user.userEmail ?? user.id,
              },
            });

            if (updatedNote) {
              socket.to(`whiteboard:${data.roomId}`).emit(SOCKET_EVENTS.WHITEBOARD_NOTE_MOVED, {
                noteId: updatedNote.id,
                positionX: updatedNote.positionX,
                positionY: updatedNote.positionY,
                updatedBy: updatedNote.updatedBy,
                version: updatedNote.version,
              });
            }
          } catch (err) {
            logger.error("[Whiteboard] Failed to move sticky note", err);
          }
        }
      );

      socket.on(
        SOCKET_EVENTS.WHITEBOARD_NOTE_COLOR,
        async (data: {
          roomId: string;
          noteId: string;
          color: string;
        }) => {
          try {
            const isAllowed = await validateRoomAccessUseCase.execute({
              roomId: data.roomId,
              workspaceId,
              userId: user.id,
              role: user.role,
            });
            if (!isAllowed) return;

            const updatedNote = await whiteboardRepository.update(data.noteId, {
              color: data.color,
              updatedBy: {
                userId: user.id,
                username: user.username ?? user.userEmail ?? user.id,
              },
            });

            if (updatedNote) {
              io.to(`whiteboard:${data.roomId}`).emit(
                SOCKET_EVENTS.WHITEBOARD_NOTE_COLOR_UPDATED,
                {
                  noteId: updatedNote.id,
                  color: updatedNote.color,
                  updatedBy: updatedNote.updatedBy,
                  version: updatedNote.version,
                }
              );
            }
          } catch (err) {
            logger.error("[Whiteboard] Failed to update sticky note color", err);
          }
        }
      );

      socket.on(
        SOCKET_EVENTS.WHITEBOARD_NOTE_DELETE,
        async (data: {
          roomId: string;
          noteId: string;
        }) => {
          try {
            const isAllowed = await validateRoomAccessUseCase.execute({
              roomId: data.roomId,
              workspaceId,
              userId: user.id,
              role: user.role,
            });
            if (!isAllowed) return;

            const existingNote = await whiteboardRepository.findById(data.noteId);
            if (!existingNote) return;

            const isAuthor = existingNote.createdBy?.userId === user.id;
            const isAdmin = user.role === "workspaceAdmin" || user.role === "admin";
            if (!isAuthor && !isAdmin) {
              socket.emit(SOCKET_EVENTS.WHITEBOARD_ERROR, {
                message: "Only the note author or an admin can delete this note",
              });
              return;
            }

            const deleted = await whiteboardRepository.delete(data.noteId);
            if (deleted) {
              io.to(`whiteboard:${data.roomId}`).emit(SOCKET_EVENTS.WHITEBOARD_NOTE_DELETED, {
                noteId: data.noteId,
              });
            }
          } catch (err) {
            logger.error("[Whiteboard] Failed to delete sticky note", err);
          }
        }
      );

      // Whiteboard Note Realtime Editing indicator
      socket.on(
        "whiteboard:note:editing",
        (data: { roomId: string; noteId: string; isEditing: boolean; username?: string }) => {
          socket.to(`whiteboard:${data.roomId}`).emit("whiteboard:note:editing", {
            noteId: data.noteId,
            isEditing: data.isEditing,
            username: data.username || user.username || "Someone",
            userId: user.id,
          });
        }
      );

      // ── Call / WebRTC (Audio & Video) ──────────────────────────
      const handleLeaveCall = (socketId: string) => {
        const roomId = socketCallRoom.get(socketId);
        if (!roomId) return;

        socketCallRoom.delete(socketId);
        const callMap = callRooms.get(roomId);
        if (callMap) {
          const participant = callMap.get(socketId);
          if (participant) {
            const durationSeconds = participant.joinedAt
              ? Math.max(0, Math.round((Date.now() - participant.joinedAt.getTime()) / 1000))
              : 0;
            const durationMinutes = Math.round(durationSeconds / 60);

            // Record attendance and update meeting if applicable
            (async () => {
              try {
                if (workspaceId) {
                  const query = mongoose.Types.ObjectId.isValid(roomId)
                    ? { _id: roomId }
                    : { meetingCode: roomId };

                  await MeetingModel.updateOne(query, {
                    $addToSet: { participants: new mongoose.Types.ObjectId(participant.userId) },
                    $set: { status: callMap.size <= 1 ? "completed" : "live" },
                  });

                  if (durationSeconds >= 5) {
                    await ActivityLogModel.create({
                      action: "CALL_ATTENDED",
                      actorId: participant.userId,
                      workspaceId,
                      targetType: "CALL",
                      targetId: roomId,
                      occurredAt: new Date(),
                      metadata: {
                        durationMinutes,
                        durationSeconds,
                      },
                    });
                  }
                }
              } catch (err) {
                logger.error(`[Call] Error recording meeting attendance: ${err}`);
              }
            })();
          }

          callMap.delete(socketId);
          io.to(`call:${roomId}`).emit(SOCKET_EVENTS.CALL_USER_LEFT, { peerId: socketId });
          io.to(`call:${roomId}`).emit(SOCKET_EVENTS.VOICE_USER_LEFT, { peerId: socketId });
          if (callMap.size === 0) {
            callRooms.delete(roomId);
          }
        }
        socket.leave(`call:${roomId}`);
        emitRoomPresenceChanged(roomId);
        const remainingCallUsers = Array.from(callRooms.get(roomId)?.values() ?? []);
        io.to(`room:${roomId}`).emit("call:status", {
          roomId,
          inCallUsers: remainingCallUsers,
          count: remainingCallUsers.length,
          isLive: remainingCallUsers.length > 0,
        });
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
          joinedAt: new Date(),
        };

        // Asynchronously update meeting status to live and add participant
        if (workspaceId) {
          (async () => {
            try {
              const query = mongoose.Types.ObjectId.isValid(roomId)
                ? { _id: roomId }
                : { meetingCode: roomId };
              await MeetingModel.updateOne(query, {
                $addToSet: { participants: new mongoose.Types.ObjectId(user.id) },
                $set: { status: "live" },
              });
            } catch (err) {
              logger.error(`[Call] Error updating meeting status on join: ${err}`);
            }
          })();
        }

        // Send existing participants to the newly joined peer
        const existingParticipants = Array.from(callMap.values());
        socket.emit(SOCKET_EVENTS.CALL_PARTICIPANTS, existingParticipants);
        socket.emit(SOCKET_EVENTS.VOICE_PARTICIPANTS, existingParticipants);

        // Notify all existing peers in this room's call
        socket.to(`call:${roomId}`).emit(SOCKET_EVENTS.CALL_USER_JOINED, participant);
        socket.to(`call:${roomId}`).emit(SOCKET_EVENTS.VOICE_USER_JOINED, participant);

        callMap.set(socket.id, participant);
        emitRoomPresenceChanged(roomId);

        io.to(`room:${roomId}`).emit("call:status", {
          roomId,
          inCallUsers: Array.from(callMap.values()),
          count: callMap.size,
          isLive: callMap.size > 0,
        });

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

      socket.on("call:get-status", (roomId: string) => {
        const callMap = callRooms.get(roomId);
        const inCallUsers = Array.from(callMap?.values() ?? []);
        socket.emit("call:status", {
          roomId,
          inCallUsers,
          count: inCallUsers.length,
          isLive: inCallUsers.length > 0,
        });
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

      // ── Live Transcription (Groq Whisper AI) ───────────────────
      socket.on(
        SOCKET_EVENTS.CALL_LIVE_AUDIO_CHUNK,
        async (payload: {
          roomId: string;
          audioData: Buffer | ArrayBuffer | Uint8Array;
          mimeType?: string;
          speakerName?: string;
          speakerId?: string;
        }) => {
          try {
            logger.info(`[LiveTranscript] Received audio chunk from socket ${socket.id}, roomId=${payload?.roomId}, type=${typeof payload?.audioData}`);

            if (!payload || !payload.audioData) {
              logger.warn("[LiveTranscript] Invalid payload - missing audioData");
              return;
            }

            const effectiveRoomId = socketCallRoom.get(socket.id) || payload.roomId;
            if (!effectiveRoomId) {
              logger.warn(`[LiveTranscript] Socket ${socket.id} has no associated call room`);
              return;
            }

            // Ensure socket is in the call room
            socket.join(`call:${effectiveRoomId}`);
            if (!socketCallRoom.has(socket.id)) {
              socketCallRoom.set(socket.id, effectiveRoomId);
            }

            const callMap = callRooms.get(effectiveRoomId);
            const participant = callMap?.get(socket.id);

            const speakerName =
              participant?.username ||
              payload.speakerName ||
              user?.username ||
              (user as unknown as { name?: string })?.name ||
              "Participant";
            const speakerId = participant?.userId || user?.id || socket.id;

            let buffer: Buffer;
            if (Buffer.isBuffer(payload.audioData)) {
              buffer = payload.audioData;
            } else if (payload.audioData instanceof ArrayBuffer) {
              buffer = Buffer.from(payload.audioData);
            } else if (ArrayBuffer.isView(payload.audioData)) {
              buffer = Buffer.from(
                (payload.audioData as Uint8Array).buffer,
                (payload.audioData as Uint8Array).byteOffset,
                (payload.audioData as Uint8Array).byteLength
              );
            } else {
              try {
                const raw = payload.audioData as unknown as { type: string; data: number[] };
                if (raw && raw.data && Array.isArray(raw.data)) {
                  buffer = Buffer.from(raw.data);
                } else {
                  buffer = Buffer.from(payload.audioData as unknown as ArrayBuffer);
                }
              } catch {
                buffer = Buffer.from(payload.audioData as unknown as ArrayBuffer);
              }
            }

            logger.info(`[LiveTranscript] Buffer resolved: ${buffer.length} bytes, mimeType=${payload.mimeType}`);

            if (buffer.length < 300) {
              logger.info(`[LiveTranscript] Chunk too small (${buffer.length} bytes), skipping`);
              return;
            }

            const mimeType = payload.mimeType || "audio/webm";
            const ext = mimeType.includes("wav") ? "audio.wav" : "audio.webm";

            logger.info(`[LiveTranscript] Calling Groq API for ${buffer.length} bytes from ${speakerName}`);
            const result = await groqTranscriptionService.transcribeAudio(
              buffer,
              mimeType,
              ext
            );

            logger.info(`[LiveTranscript] Groq result: success=${result.success}, text="${result.text}", error="${result.error}"`);

            if (!result.success) {
              if (result.error?.includes("GROQ_API_KEY")) {
                socket.emit(SOCKET_EVENTS.CALL_LIVE_TRANSCRIPT_ERROR, {
                  message: "GROQ_API_KEY is not configured on the server",
                });
              }
              return;
            }

            const text = result.text?.trim();
            if (!text) {
              logger.info("[LiveTranscript] Groq returned empty/filtered text, skipping");
              return;
            }

            const turn = {
              id: new mongoose.Types.ObjectId().toString(),
              speakerId,
              speakerName,
              text,
              timestamp: Date.now(),
            };

            // Broadcast real-time live transcript turn to all participants in this call room
            io.to(`call:${effectiveRoomId}`).emit(
              SOCKET_EVENTS.CALL_LIVE_TRANSCRIPT,
              turn
            );

            // Persist turn in MongoDB for history & drawer export
            liveTranscriptRepository
              .addTurn(effectiveRoomId, workspaceId, turn)
              .catch((err) => {
                logger.error("[Socket] Failed to save transcript turn:", err);
              });
          } catch (err) {
            logger.error("[Socket] Error handling live audio chunk:", err);
          }
        }
      );

      // Peer live transcript broadcast & persistence
      socket.on(
        SOCKET_EVENTS.CALL_LIVE_TRANSCRIPT,
        (turn: {
          id: string;
          roomId?: string;
          speakerId: string;
          speakerName: string;
          text: string;
          timestamp: number;
        }) => {
          try {
            if (!turn || !turn.text) return;
            const targetRoomId = turn.roomId || socketCallRoom.get(socket.id);
            if (!targetRoomId) return;

            // Broadcast to all other peers in this room
            socket.to(`call:${targetRoomId}`).emit(SOCKET_EVENTS.CALL_LIVE_TRANSCRIPT, turn);

            // Persist to MongoDB
            liveTranscriptRepository
              .addTurn(targetRoomId, workspaceId, turn)
              .catch(() => {});
          } catch (err) {
            logger.error("[Socket] Error broadcasting live transcript:", err);
          }
        }
      );

      socket.on(
        SOCKET_EVENTS.CALL_GET_LIVE_TRANSCRIPTS,
        async (roomId: string) => {
          try {
            if (!roomId) return;
            const transcript =
              await liveTranscriptRepository.getTranscriptByMeetingId(roomId);
            socket.emit(SOCKET_EVENTS.CALL_GET_LIVE_TRANSCRIPTS, {
              roomId,
              turns: transcript?.turns || [],
            });
          } catch (err) {
            logger.error("[Socket] Error getting live transcripts:", err);
          }
        }
      );

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
            emitRoomPresenceChanged(roomId);
            if (members.size === 0) roomPresence.delete(roomId);
          }
        });

        // ── Clean up whiteboard presence ──
        whiteboardPresence.forEach((members, roomId) => {
          if (members.has(socket.id)) {
            members.delete(socket.id);
            const collaborators = Array.from(members.values());
            io.to(`whiteboard:${roomId}`).emit(SOCKET_EVENTS.WHITEBOARD_PRESENCE, collaborators);
            if (members.size === 0) whiteboardPresence.delete(roomId);
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

  getUserCurrentRoom(userId: string): string | null {
    for (const [roomId, members] of roomPresence.entries()) {
      for (const m of members.values()) {
        if (m.userId === userId) return roomId;
      }
    }
    for (const [roomId, members] of callRooms.entries()) {
      for (const m of members.values()) {
        if (m.userId === userId) return roomId;
      }
    }
    return null;
  },

  getRoomLiveParticipants(roomId: string): { userId: string; username: string }[] {
    const presenceUsers = Array.from(roomPresence.get(roomId)?.values() ?? []);
    const callUsers = Array.from(callRooms.get(roomId)?.values() ?? []).map((p) => ({
      userId: p.userId,
      username: p.username,
    }));
    const map = new Map<string, { userId: string; username: string }>();
    for (const u of presenceUsers) map.set(u.userId, u);
    for (const u of callUsers) map.set(u.userId, u);
    return Array.from(map.values());
  },

  getAllRoomPresences(): Record<string, { userId: string; username: string }[]> {
    const result: Record<string, { userId: string; username: string }[]> = {};
    roomPresence.forEach((_, roomId) => {
      result[roomId] = this.getRoomLiveParticipants(roomId);
    });
    callRooms.forEach((_, roomId) => {
      if (!result[roomId]) {
        result[roomId] = this.getRoomLiveParticipants(roomId);
      }
    });
    return result;
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
