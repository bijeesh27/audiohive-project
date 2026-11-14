import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware";
import { ApiResposne } from "../../../common/Response/Response";
import { WorkspaceModel } from "../../workspace/infrastructure/workspaceSchema";
import { RoomModel } from "../../room/infrastructure/roomSchema";
import { MeetingModel } from "../../meeting/infrastructure/meetingSchema";
import { AnnouncementModel } from "../../announcement/infrastructure/announcementSchema";
import { DirectMessageRepository } from "../../chat/infrastructure/directMessageRepository";
import { GetConversationsUseCase } from "../../chat/application/usecases/getConversationsUseCase";
import { socketService } from "../../../socket/socketService";
import { UserRoles } from "../../../common/constant/userRoles";
import { Types } from "mongoose";

export class MemberDashboardController {
  private dmRepository = new DirectMessageRepository();
  private getConversationsUseCase = new GetConversationsUseCase(this.dmRepository);

  getDashboardSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      const workspaceId = req.user?.workspaceId;

      if (!userId || !workspaceId) {
        return ApiResposne.success(res, "Dashboard summary empty", {
          organizationName: "AudioHive",
          workspaceName: "",
          stats: {
            roomsCount: 0,
            upcomingMeetingsCount: 0,
            unreadChatCount: 0,
            unreadAnnouncementsCount: 0,
          },
          activeRooms: [],
          upcomingMeetings: [],
          announcements: [],
          recentChats: [],
          activity: {
            hoursThisWeek: 0,
            meetingsAttended: 0,
          },
        });
      }

      const workspaceObjectId = Types.ObjectId.isValid(workspaceId)
        ? new Types.ObjectId(workspaceId)
        : null;

      // 1. Workspace & Organization Details
      const workspace = workspaceObjectId
        ? await WorkspaceModel.findById(workspaceObjectId)
            .populate<{ organizationId: { companyName?: string } }>("organizationId", "companyName")
            .lean()
        : null;

      const organizationName =
        workspace?.organizationId?.companyName || workspace?.workspaceName || "AudioHive";
      const workspaceName = workspace?.workspaceName || "Main Workspace";

      // 2. Rooms: filter by organization/workspace and member room access
      const roomQuery: Record<string, unknown> = {
        workspaceId,
        status: { $ne: "blocked" },
      };

      if (role === UserRoles.MEMBER) {
        roomQuery.$or = [
          { type: "public" },
          { type: "private", allowedUsers: new Types.ObjectId(userId) },
          { type: "private", allowedUsers: userId },
        ];
      }

      const allAccessibleRooms = await RoomModel.find(roomQuery)
        .sort({ createdAt: -1 })
        .lean();

      const totalRoomsCount = allAccessibleRooms.length;

      // Map live participants via socketService
      const roomsWithPresence = allAccessibleRooms.map((room) => {
        const liveParticipants = socketService.getRoomLiveParticipants(room._id.toString());
        return {
          _id: room._id.toString(),
          name: room.name,
          description: room.description || "",
          type: room.type,
          status: room.status,
          liveParticipants,
          participantCount: liveParticipants.length,
          createdAt: room.createdAt ? new Date(room.createdAt).toISOString() : new Date().toISOString(),
        };
      });

      // Sort: live rooms (participants > 0) first, then latest created
      const activeRooms = [...roomsWithPresence]
        .sort((a, b) => {
          if (b.participantCount !== a.participantCount) {
            return b.participantCount - a.participantCount;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .slice(0, 6);

      // 3. Upcoming Meetings: scheduled or live, future/current
      const now = new Date();
      const meetingQuery: Record<string, unknown> = {
        workspaceId,
        status: { $in: ["scheduled", "live"] },
        endTime: { $gte: now },
      };

      if (role === UserRoles.MEMBER) {
        const userObjId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;
        meetingQuery.$or = [
          { hostId: userObjId },
          { participants: userObjId },
        ];
      }

      const [allMeetings, totalMeetingsCount] = await Promise.all([
        MeetingModel.find(meetingQuery)
          .populate("hostId", "username email")
          .populate("participants", "username email")
          .sort({ startTime: 1 })
          .limit(5)
          .lean(),
        MeetingModel.countDocuments(meetingQuery),
      ]);

      const upcomingMeetings = allMeetings.map((m) => {
        const host = m.hostId as unknown as { _id?: Types.ObjectId; username?: string; email?: string } | null;
        return {
          _id: m._id.toString(),
          title: m.title,
          description: m.description || "",
          meetingCode: m.meetingCode,
          startTime: m.startTime ? new Date(m.startTime).toISOString() : "",
          endTime: m.endTime ? new Date(m.endTime).toISOString() : "",
          status: m.status,
          host: {
            _id: host?._id ? host._id.toString() : "",
            username: host?.username || "Host",
            email: host?.email || "",
          },
          participantsCount: Array.isArray(m.participants) ? m.participants.length : 0,
        };
      });

      // 4. Announcements
      const announcementQuery: Record<string, unknown> = {
        workspaceId,
        status: "published",
      };

      const [announcementsDocs, unreadAnnouncementsCount] = await Promise.all([
        AnnouncementModel.find(announcementQuery)
          .populate("createdBy", "username")
          .sort({ isPinned: -1, createdAt: -1 })
          .limit(5)
          .lean(),
        AnnouncementModel.countDocuments({
          ...announcementQuery,
          readBy: { $ne: new Types.ObjectId(userId) },
        }),
      ]);

      const announcements = announcementsDocs.map((a) => {
        const creator = a.createdBy as unknown as { username?: string } | null;
        return {
          _id: a._id.toString(),
          title: a.title,
          content: a.content,
          type: a.type,
          isPinned: Boolean(a.isPinned),
          authorName: creator?.username || "Workspace Admin",
          createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
          isRead: Array.isArray(a.readBy) ? a.readBy.some((id) => id?.toString() === userId) : false,
        };
      });

      // 5. Recent Chats (Direct Messages)
      let recentChats: unknown[] = [];
      let unreadChatCount = 0;
      try {
        const [conversations, unreadCountRes] = await Promise.all([
          this.getConversationsUseCase.execute({ userId }),
          this.dmRepository.getTotalUnreadCount(userId),
        ]);
        recentChats = (conversations || []).slice(0, 5);
        unreadChatCount = typeof unreadCountRes === "number" ? unreadCountRes : 0;
      } catch {
        recentChats = [];
        unreadChatCount = 0;
      }

      // 6. User Activity: hours spent in meetings this week
      let hoursThisWeek = 0;
      let meetingsAttended = 0;
      try {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const userObjId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;
        const pastMeetings = await MeetingModel.find({
          workspaceId,
          status: { $in: ["completed", "live"] },
          startTime: { $gte: oneWeekAgo },
          $or: [{ hostId: userObjId }, { participants: userObjId }],
        })
          .select("startTime endTime")
          .lean();

        meetingsAttended = pastMeetings.length;
        let totalMinutes = 0;
        for (const m of pastMeetings) {
          if (m.startTime && m.endTime) {
            const diffMs = new Date(m.endTime).getTime() - new Date(m.startTime).getTime();
            totalMinutes += Math.max(0, diffMs / (1000 * 60));
          }
        }
        hoursThisWeek = Number((totalMinutes / 60).toFixed(1));
      } catch {
        hoursThisWeek = 0;
        meetingsAttended = 0;
      }

      return ApiResposne.success(res, "Dashboard summary retrieved successfully", {
        organizationName,
        workspaceName,
        stats: {
          roomsCount: totalRoomsCount,
          upcomingMeetingsCount: totalMeetingsCount,
          unreadChatCount,
          unreadAnnouncementsCount,
        },
        activeRooms,
        upcomingMeetings,
        announcements,
        recentChats,
        activity: {
          hoursThisWeek,
          meetingsAttended,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getMemberRooms = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      const workspaceId = req.user?.workspaceId;

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, parseInt(req.query.limit as string) || 12);
      const q = ((req.query.q || req.query.search || "") as string).trim();
      const type = ((req.query.type || "all") as string).toLowerCase();
      const sort = ((req.query.sort || "active") as string).toLowerCase();

      if (!userId || !workspaceId) {
        return ApiResposne.success(res, "Rooms retrieved successfully", {
          rooms: [],
          total: 0,
          page: 1,
          totalPages: 1,
          counts: { all: 0, public: 0, private: 0, live: 0 },
        });
      }

      // Base query enforcing workspace tenancy and access control
      const baseFilter: Record<string, unknown> = {
        workspaceId,
        status: { $ne: "blocked" },
      };

      if (role === UserRoles.MEMBER) {
        const userObjId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;
        baseFilter.$or = [
          { type: "public" },
          { type: "private", allowedUsers: userObjId },
          { type: "private", allowedUsers: userId },
        ];
      }

      // Search filter on room name or description
      const searchFilter: Record<string, unknown> = { ...baseFilter };
      if (q) {
        const regex = { $regex: q, $options: "i" };
        searchFilter.$and = [
          {
            $or: [{ name: regex }, { description: regex }],
          },
        ];
      }

      const rawRooms = await RoomModel.find(searchFilter).lean();

      // Enrich rooms with real-time live presence from socket service
      const roomsWithPresence = rawRooms.map((room) => {
        const liveParticipants = socketService.getRoomLiveParticipants(room._id.toString());
        const participantCount = liveParticipants.length;
        const isLive = participantCount > 0;
        return {
          id: room._id.toString(),
          _id: room._id.toString(),
          name: room.name,
          description: room.description || "",
          type: room.type as "public" | "private",
          isLive,
          participantCount,
          capacity: (room as unknown as { capacity?: number }).capacity || 25,
          participants: liveParticipants.slice(0, 3).map((p) => ({
            userId: p.userId,
            username: p.username,
          })),
          createdAt: room.createdAt ? new Date(room.createdAt).toISOString() : new Date().toISOString(),
        };
      });

      // Calculate tab counts under the current search scope
      const counts = {
        all: roomsWithPresence.length,
        public: roomsWithPresence.filter((r) => r.type === "public").length,
        private: roomsWithPresence.filter((r) => r.type === "private").length,
        live: roomsWithPresence.filter((r) => r.isLive).length,
      };

      // Filter by type: all | public | private | live
      let filtered = roomsWithPresence;
      if (type === "public") {
        filtered = filtered.filter((r) => r.type === "public");
      } else if (type === "private") {
        filtered = filtered.filter((r) => r.type === "private");
      } else if (type === "live") {
        filtered = filtered.filter((r) => r.isLive);
      }

      // Sort: active (most active first) | newest | name (A-Z)
      if (sort === "name") {
        filtered.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
      } else if (sort === "newest") {
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else {
        // default "active"
        filtered.sort((a, b) => {
          if (b.participantCount !== a.participantCount) {
            return b.participantCount - a.participantCount;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      }

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const safePage = Math.min(Math.max(1, page), totalPages);
      const skip = (safePage - 1) * limit;
      const paginatedRooms = filtered.slice(skip, skip + limit);

      return ApiResposne.success(res, "Rooms retrieved successfully", {
        rooms: paginatedRooms,
        total,
        page: safePage,
        totalPages,
        counts,
      });
    } catch (error) {
      next(error);
    }
  };
}
