import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  getRoom,
  deleteRoom,
  updateRoom,
  getRoomParticipants,
  removeRoomUser,
} from "../../services/roomServices";
import {
  getWorkspaceDashboardStats,
  type DashboardData,
  type RoomUsage,
} from "../../services/workspaceAdminServices";

import RoomModal from "../../components/workspaceAdmin/RoomModal";
import RoomAccessModal from "../../components/workspaceAdmin/RoomAccessModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import { API_ROUTES } from "../../constants/Api_Routes";

import {
  Globe,
  Lock,
  Sparkles,
  ArrowLeft,
  MoreVertical,
  Edit3,
  ShieldBan,
  ShieldCheck,
  Trash2,
  Users,
  Video,
  Layout,
  FileText,
  UserMinus,
  Plus,
  Clock,
  RotateCcw,
  AlertCircle,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { VideoCallPanel } from "../../components/room/VideoCallPanel";
import { RoomDocuments } from "./RoomDocuments";
import { Whiteboard } from "../../components/whiteboard/Whiteboard";
import { LoungeView } from "../../components/room/lounge/LoungeView";
import type { RoomDetailData, ParticipantItem } from "../../types/rooms";

interface Room {
  _id: string;
  workspaceId?: string;
  name: string;
  description?: string;
  type: "public" | "private" | "lounge" | "standard";
  status: "active" | "blocked";
  isDefault?: boolean;
  allowedUsers?: string[];
  memberCount?: number;
  onlineCount?: number;
  createdAt: string;
}

interface ParticipantUser {
  _id: string;
  username: string;
  email: string;
  role: string;
  status: boolean;
  isOnline?: boolean;
  joinedAt?: string;
  createdAt?: string;
}

type ConfirmState =
  | { isOpen: false }
  | { isOpen: true; kind: "room"; actionType: "delete" | "block" | "unblock" }
  | { isOpen: true; kind: "removeUser"; userId: string; username: string };

const CLOSED_CONFIRM: ConfirmState = { isOpen: false };

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (!err || typeof err !== "object") return fallback;
  const response = "response" in err ? (err as any).response : undefined;
  if (!response || typeof response !== "object") return fallback;
  const data = "data" in response ? response.data : undefined;
  if (!data || typeof data !== "object") return fallback;
  const message = "message" in data ? data.message : undefined;
  return typeof message === "string" ? message : fallback;
};

const formatTimeSpent = (minutes: number): string => {
  if (!minutes || minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours > 0 && remainingMinutes > 0) return `${hours}h ${remainingMinutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${remainingMinutes}m`;
};

const formatFullDate = (iso: string | null | undefined): string => {
  if (!iso) return "–";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
};

export default function AdminRoomDetail() {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { username } = useAuth();
  const { socket } = useSocket();

  // Tab State synced with URL (?tab=)
  const tabParam = searchParams.get("tab");
  const activeTab: "overview" | "meeting" | "whiteboard" | "documents" =
    tabParam === "meeting" || tabParam === "whiteboard" || tabParam === "documents"
      ? tabParam
      : "overview";

  const handleTabChange = (newTab: "overview" | "meeting" | "whiteboard" | "documents") => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newTab === "overview") {
        next.delete("tab");
      } else {
        next.set("tab", newTab);
      }
      return next;
    });
  };

  // Room State
  const [room, setRoom] = useState<Room | null>(null);
  const [roomLoading, setRoomLoading] = useState<boolean>(true);
  const [roomError, setRoomError] = useState<string | null>(null);

  // Analytics Usage State (reusing Dashboard room usage data)
  const [dashboardUsage, setDashboardUsage] = useState<RoomUsage | null>(null);
  const [meetingsOverviewCount, setMeetingsOverviewCount] = useState<number>(0);

  // Participants & Live Presence State
  const [participants, setParticipants] = useState<ParticipantUser[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState<boolean>(true);
  const [participantsError, setParticipantsError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const limit = 10;
  const [totalParticipants, setTotalParticipants] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Live Socket Connected Users in this Room
  const [onlineUsers, setOnlineUsers] = useState<{ userId: string; username: string }[]>([]);
  const onlineUserIdSet = useMemo(() => new Set(onlineUsers.map((u) => u.userId)), [onlineUsers]);

  // Modals & Menu State
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState<boolean>(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState<boolean>(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState<boolean>(false);

  const [confirmModal, setConfirmModal] = useState<ConfirmState>(CLOSED_CONFIRM);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [, startTransition] = useTransition();
  const roomRequestIdRef = useRef(0);
  const participantsRequestIdRef = useRef(0);

  // Close menus on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-header-menu]")) {
        setIsHeaderMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsHeaderMenuOpen(false);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Debounce search input for participants
  useEffect(() => {
    const t = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearch(searchQuery.trim());
        setPage(1);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch Room Details
  const fetchRoom = useCallback(async () => {
    if (!roomId) return;
    const requestId = ++roomRequestIdRef.current;
    setRoomLoading(true);
    setRoomError(null);

    try {
      const res = await getRoom(roomId);
      if (requestId !== roomRequestIdRef.current) return;
      const roomData = res.data?.data || res.data;
      setRoom(roomData);
    } catch (err: unknown) {
      if (requestId !== roomRequestIdRef.current) return;
      setRoomError(getErrorMessage(err, "Failed to load room details"));
    } finally {
      if (requestId === roomRequestIdRef.current) {
        setRoomLoading(false);
      }
    }
  }, [roomId]);

  // Fetch Dashboard Stats to reuse Room Usage data (avoids creating new analytics endpoint)
  const fetchDashboardUsage = useCallback(async () => {
    if (!roomId) return;
    try {
      const res: DashboardData = await getWorkspaceDashboardStats();
      if (res?.roomUsage?.topRooms) {
        const found = res.roomUsage.topRooms.find((r) => r.roomId === roomId);
        if (found) setDashboardUsage(found);
      }
      if (res?.roomUsage?.meetingsOverview) {
        setMeetingsOverviewCount(res.roomUsage.meetingsOverview.completed || 0);
      }
    } catch {
      // Non-blocking fallback
    }
  }, [roomId]);

  // Fetch Unified Participants List
  const fetchParticipants = useCallback(async () => {
    if (!roomId) return;
    const requestId = ++participantsRequestIdRef.current;
    setParticipantsLoading(true);
    setParticipantsError(null);

    try {
      const res = await getRoomParticipants(roomId, {
        page,
        limit,
        search: debouncedSearch,
      });
      if (requestId !== participantsRequestIdRef.current) return;

      const payload = res.data?.data ?? res.data;
      const list: ParticipantUser[] = Array.isArray(payload)
        ? payload
        : payload?.users ?? [];
      const total = payload?.total ?? list.length;
      const pages = payload?.totalPages ?? Math.max(1, Math.ceil(total / limit));

      setParticipants(list);
      setTotalParticipants(total);
      setTotalPages(pages);
    } catch (err: unknown) {
      if (requestId !== participantsRequestIdRef.current) return;
      setParticipantsError(getErrorMessage(err, "Failed to load room members"));
    } finally {
      if (requestId === participantsRequestIdRef.current) {
        setParticipantsLoading(false);
      }
    }
  }, [roomId, page, debouncedSearch]);

  // Socket Presence Connection
  useEffect(() => {
    if (!roomId || !socket) return;

    const handlePresence = (users: { userId: string; username: string }[]) => {
      setOnlineUsers(users);
    };

    socket.on("room:presence-update", handlePresence);

    const emitJoin = () => {
      socket.emit("room:join", roomId);
      socket.emit("room:get-presence", roomId);
    };

    if (socket.connected) {
      emitJoin();
    } else {
      socket.once("connect", emitJoin);
    }

    return () => {
      if (socket.connected) socket.emit("room:leave", roomId);
      socket.off("room:presence-update", handlePresence);
      socket.off("connect", emitJoin);
    };
  }, [roomId, socket]);

  useEffect(() => {
    fetchRoom();
    fetchDashboardUsage();
  }, [fetchRoom, fetchDashboardUsage]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Merge participants with live socket presence
  const unifiedMembers = useMemo(() => {
    return participants.map((p) => {
      const isOnline = onlineUserIdSet.has(p._id);
      return {
        ...p,
        isOnline,
      };
    });
  }, [participants, onlineUserIdSet]);

  const liveOnlineCount = useMemo(() => {
    return onlineUsers.length;
  }, [onlineUsers]);

  const isDefault = Boolean(
    room?.isDefault || room?.name === "Lounge" || room?.name === "Office Common Room"
  );
  const isRoomLounge = room?.type === "lounge" || room?.name?.toLowerCase() === "lounge";

  const loungeRoomData: RoomDetailData | null = useMemo(() => {
    if (!room) return null;
    return {
      _id: room._id,
      id: room._id,
      workspaceId: room.workspaceId || (room as any).workspace?._id || (room as any).workspace,
      name: room.name,
      description: room.description,
      type: "lounge",
      isDefault: isDefault,
      status: room.status,
      createdAt: room.createdAt,
      memberCount: totalParticipants || room.memberCount || participants.length,
      onlineCount: onlineUsers.length,
      myRole: "admin",
      isLive: onlineUsers.length > 0,
    };
  }, [room, isDefault, totalParticipants, participants.length, onlineUsers.length]);

  const loungeParticipants: ParticipantItem[] = useMemo(() => {
    return participants.map((p) => ({
      _id: p._id,
      username: p.username,
      email: p.email,
      role: (p.role === "workspace-admin" || p.role === "admin" ? "admin" : "member") as "admin" | "member" | "owner",
      status: p.status,
      isOnline: Boolean(p.isOnline),
      joinedAt: p.joinedAt,
      createdAt: p.createdAt,
    }));
  }, [participants]);

  // Actions confirm handler
  const handleActionConfirm = async () => {
    if (!roomId || !confirmModal.isOpen) return;
    setActionLoading(true);
    setActionError(null);

    try {
      if (confirmModal.kind === "room") {
        const { actionType } = confirmModal;
        if (actionType === "delete") {
          await deleteRoom(roomId);
          navigate(API_ROUTES.WORKSPACE_ADMIN.NAV.ROOMS);
          return;
        }

        const newStatus = actionType === "block" ? "blocked" : "active";
        await updateRoom(roomId, { status: newStatus });
        await fetchRoom();
        setConfirmModal(CLOSED_CONFIRM);
        return;
      }

      if (confirmModal.kind === "removeUser") {
        await removeRoomUser(roomId, confirmModal.userId);
        setConfirmModal(CLOSED_CONFIRM);
        fetchParticipants();
        fetchRoom();
      }
    } catch (err: unknown) {
      setActionError(getErrorMessage(err, "Failed to complete action"));
    } finally {
      setActionLoading(false);
    }
  };

  if (roomLoading && !room) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-gray-200 rounded-xl" />
        <div className="h-10 bg-gray-200 rounded-lg w-1/3" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (roomError && !room) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center max-w-lg mx-auto shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900">Room not found</h2>
        <p className="text-sm text-gray-500 mt-1">{roomError}</p>
        <button
          onClick={() => navigate(API_ROUTES.WORKSPACE_ADMIN.NAV.ROOMS)}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Rooms
        </button>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="space-y-6">
      {isRoomLounge && loungeRoomData ? (
        <LoungeView
          room={loungeRoomData}
          participants={loungeParticipants}
          onlineUsers={onlineUsers}
          onLeaveRoom={() => navigate(API_ROUTES.WORKSPACE_ADMIN.NAV.ROOMS)}
        />
      ) : (
        <>
          {/* ── CLEAN ROOM DETAIL HEADER ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {/* Left: Back Link, Room Icon, Name, Badges, Description */}
          <div className="min-w-0 flex-1 space-y-3">
            {/* Back link */}
            <button
              type="button"
              onClick={() => navigate(API_ROUTES.WORKSPACE_ADMIN.NAV.ROOMS)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors focus:outline-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Rooms</span>
            </button>

            {/* Title & Badges */}
            <div className="flex items-start gap-3.5">
              {/* Room Type Icon (matching exact type: no lock on public!) */}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                  isRoomLounge
                    ? "bg-purple-50 text-purple-600 border-purple-100"
                    : room.type === "public"
                    ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                    : "bg-orange-50 text-orange-600 border-orange-100"
                }`}
              >
                {isRoomLounge ? (
                  <Sparkles className="w-5 h-5" />
                ) : room.type === "public" ? (
                  <Globe className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">
                    {room.name}
                  </h1>

                  {/* Default Badge */}
                  {isDefault && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                      Default
                    </span>
                  )}

                  {/* Type Badge */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isRoomLounge
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : room.type === "public"
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : "bg-orange-50 text-orange-700 border border-orange-200"
                    }`}
                  >
                    {isRoomLounge ? (
                      <Sparkles className="w-3 h-3 text-purple-500" />
                    ) : room.type === "public" ? (
                      <Globe className="w-3 h-3 text-indigo-500" />
                    ) : (
                      <Lock className="w-3 h-3 text-orange-500" />
                    )}
                    {isRoomLounge
                      ? "Lounge"
                      : room.type.charAt(0).toUpperCase() + room.type.slice(1)}
                  </span>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      room.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {room.status === "active" ? "Active" : "Disabled"}
                  </span>
                </div>

                {/* Created Date */}
                <p className="text-xs text-gray-400 mt-1">
                  Created {formatFullDate(room.createdAt)}
                </p>

                {/* Description */}
                {room.description && (
                  <p
                    className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed max-w-3xl"
                    title={room.description}
                  >
                    {room.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Room Actions "..." menu */}
          <div className="relative inline-block text-left shrink-0 self-start" data-header-menu>
            <button
              type="button"
              onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Room actions"
              aria-haspopup="true"
              aria-expanded={isHeaderMenuOpen}
            >
              <span>Room Actions</span>
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>

            {isHeaderMenuOpen && (
              <div
                className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-black/5 z-30 divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100"
                role="menu"
              >
                <div className="py-1">
                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsHeaderMenuOpen(false);
                      setIsRoomModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                    role="menuitem"
                  >
                    <Edit3 className="w-4 h-4 text-gray-400" />
                    <span>Edit Room</span>
                  </button>

                  {/* Manage Access (for private rooms) */}
                  {room.type === "private" && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setIsAccessModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                      role="menuitem"
                    >
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>Manage Access</span>
                    </button>
                  )}
                </div>

                <div className="py-1">
                  {/* Disable / Enable */}
                  <button
                    type="button"
                    disabled={isDefault}
                    onClick={() => {
                      setIsHeaderMenuOpen(false);
                      if (isDefault) return;
                      setActionError(null);
                      setConfirmModal({
                        isOpen: true,
                        kind: "room",
                        actionType: room.status === "active" ? "block" : "unblock",
                      });
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${
                      isDefault
                        ? "text-gray-300 cursor-not-allowed"
                        : room.status === "active"
                        ? "text-amber-700 hover:bg-amber-50"
                        : "text-emerald-700 hover:bg-emerald-50"
                    }`}
                    role="menuitem"
                    title={isDefault ? "System default rooms cannot be disabled" : undefined}
                  >
                    {room.status === "active" ? (
                      <ShieldBan className="w-4 h-4 text-amber-600" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>{room.status === "active" ? "Disable Room" : "Enable Room"}</span>
                  </button>

                  {/* Delete Room */}
                  <button
                    type="button"
                    disabled={isDefault}
                    onClick={() => {
                      setIsHeaderMenuOpen(false);
                      if (isDefault) return;
                      setActionError(null);
                      setConfirmModal({
                        isOpen: true,
                        kind: "room",
                        actionType: "delete",
                      });
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${
                      isDefault
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-rose-600 hover:bg-rose-50"
                    }`}
                    role="menuitem"
                    title={isDefault ? "System default rooms cannot be deleted" : undefined}
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>Delete Room</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CLEAN TABS NAVIGATION (Overview, Meeting, Whiteboard, Documents) ── */}
      <div className="flex items-center gap-0 border-b border-gray-200 overflow-x-auto bg-transparent">
        <button
          type="button"
          onClick={() => handleTabChange("overview")}
          className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors duration-150 whitespace-nowrap focus:outline-none ${
            activeTab === "overview"
              ? "text-indigo-600"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/50"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Overview</span>
          {activeTab === "overview" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("meeting")}
          className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors duration-150 whitespace-nowrap focus:outline-none ${
            activeTab === "meeting"
              ? "text-indigo-600"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/50"
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Meeting</span>
          {activeTab === "meeting" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("whiteboard")}
          className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors duration-150 whitespace-nowrap focus:outline-none ${
            activeTab === "whiteboard"
              ? "text-indigo-600"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/50"
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>Whiteboard</span>
          {activeTab === "whiteboard" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("documents")}
          className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors duration-150 whitespace-nowrap focus:outline-none ${
            activeTab === "documents"
              ? "text-indigo-600"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/50"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Documents</span>
          {activeTab === "documents" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      </div>

      {/* ── TAB CONTENT ── */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stat Chips (Members, Online now, Total meetings, Total time spent) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Members */}
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium block">Members</span>
                <span className="text-lg sm:text-xl font-bold text-gray-900 font-mono">
                  {room.memberCount ?? totalParticipants}
                </span>
              </div>
            </div>

            {/* Online Now */}
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                <span className="w-5 h-5 rounded-full bg-emerald-500 animate-pulse block" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium block">Online Now</span>
                <span className="text-lg sm:text-xl font-bold text-emerald-700 font-mono">
                  {liveOnlineCount}
                </span>
              </div>
            </div>

            {/* Total Meetings */}
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium block">Total Meetings</span>
                <span className="text-lg sm:text-xl font-bold text-blue-900 font-mono">
                  {dashboardUsage?.activityCount ?? meetingsOverviewCount}
                </span>
              </div>
            </div>

            {/* Total Time Spent */}
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium block">Total Time Spent</span>
                <span className="text-lg sm:text-xl font-bold text-purple-900 font-mono">
                  {formatTimeSpent(dashboardUsage?.timeSpentMinutes ?? 0)}
                </span>
              </div>
            </div>
          </div>

          {/* ONE Unified Members Table combining presence and membership */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            {/* Table Header Toolbar */}
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Room Members & Presence
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Unified member directory showing live online presence and access permissions
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Add Members Button (especially for private rooms) */}
                {room.type === "private" && (
                  <button
                    type="button"
                    onClick={() => setIsAccessModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Members</span>
                  </button>
                )}
              </div>
            </div>

            {/* Table or States */}
            {participantsError ? (
              <div className="py-12 text-center">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                <p className="text-xs text-gray-600">{participantsError}</p>
                <button
                  type="button"
                  onClick={() => fetchParticipants()}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-600 font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retry
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" role="table">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/75 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th scope="col" className="py-3.5 pl-6 pr-3">
                        Member
                      </th>
                      <th scope="col" className="px-3 py-3.5">
                        Email
                      </th>
                      <th scope="col" className="px-3 py-3.5">
                        Role
                      </th>
                      <th scope="col" className="px-3 py-3.5">
                        Presence
                      </th>
                      <th scope="col" className="px-3 py-3.5">
                        Joined
                      </th>
                      <th scope="col" className="py-3.5 pl-3 pr-6 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {participantsLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={`p-skeleton-${i}`} className="animate-pulse">
                          <td className="py-3.5 pl-6 pr-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-200" />
                              <div className="w-24 h-4 bg-gray-200 rounded" />
                            </div>
                          </td>
                          <td className="px-3 py-3.5">
                            <div className="w-32 h-4 bg-gray-200 rounded" />
                          </td>
                          <td className="px-3 py-3.5">
                            <div className="w-16 h-5 bg-gray-200 rounded-full" />
                          </td>
                          <td className="px-3 py-3.5">
                            <div className="w-16 h-5 bg-gray-200 rounded-full" />
                          </td>
                          <td className="px-3 py-3.5">
                            <div className="w-20 h-4 bg-gray-200 rounded" />
                          </td>
                          <td className="py-3.5 pl-3 pr-6 text-right">
                            <div className="w-6 h-6 bg-gray-200 rounded ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : unifiedMembers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-500">
                          <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-gray-900">No participants found</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {searchQuery
                              ? "No members match your search criteria."
                              : "No members have been added to this room yet."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      unifiedMembers.map((user) => {
                        const isOwner = user.role?.toLowerCase() === "owner";
                        return (
                          <tr key={user._id} className="hover:bg-gray-50/70 transition-colors">
                            {/* Member Avatar & Username */}
                            <td className="py-3.5 pl-6 pr-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 uppercase shadow-xs">
                                  {user.username ? user.username.substring(0, 2) : "U"}
                                </div>
                                <span className="text-sm font-semibold text-gray-900">
                                  {user.username}
                                </span>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="px-3 py-3.5 text-xs text-gray-600 font-medium">
                              {user.email || "–"}
                            </td>

                            {/* Role */}
                            <td className="px-3 py-3.5 whitespace-nowrap">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  isOwner
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-gray-100 text-gray-700 border border-gray-200"
                                }`}
                              >
                                {isOwner ? "Room Owner" : user.role || "Member"}
                              </span>
                            </td>

                            {/* Live Presence Indicator */}
                            <td className="px-3 py-3.5 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  user.isOnline
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-gray-50 text-gray-500 border border-gray-200"
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    user.isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                                  }`}
                                />
                                {user.isOnline ? "Online" : "Offline"}
                              </span>
                            </td>

                            {/* Joined Date */}
                            <td className="px-3 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                              {formatFullDate(user.createdAt || user.joinedAt)}
                            </td>

                            {/* Actions (Remove from Room) */}
                            <td className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">
                              {!isOwner && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmModal({
                                      isOpen: true,
                                      kind: "removeUser",
                                      userId: user._id,
                                      username: user.username,
                                    })
                                  }
                                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title={`Remove ${user.username} from room`}
                                  aria-label={`Remove ${user.username} from room`}
                                >
                                  <UserMinus className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Single Footer & Pagination */}
            {!participantsError && totalPages > 1 && (
              <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between bg-white text-xs text-gray-500">
                <span>
                  Showing {Math.min((page - 1) * limit + 1, totalParticipants)} to{" "}
                  {Math.min(page * limit, totalParticipants)} of {totalParticipants} members
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || participantsLoading}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || participantsLoading}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. MEETING TAB (Constrained dark call UI fitting viewport with no overflow) */}
      {activeTab === "meeting" && (
        <div className="w-full max-h-[calc(100vh-230px)] min-h-[520px] rounded-2xl overflow-hidden flex flex-col bg-[#090C15] border border-slate-800 shadow-xl">
          <VideoCallPanel
            roomId={room._id}
            roomName={room.name}
            roomType={room.type === "private" ? "private" : "public"}
            currentUsername={username ?? "Admin"}
          />
        </div>
      )}

      {/* 3. WHITEBOARD TAB (Contained canvas inside tab area, no overflow past bottom) */}
      {activeTab === "whiteboard" && (
        <div className="w-full h-[calc(100vh-230px)] min-h-[580px] rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
          <Whiteboard roomId={room._id} />
        </div>
      )}

      {/* 4. DOCUMENTS TAB */}
      {activeTab === "documents" && (
        <div className="w-full">
          <RoomDocuments roomId={room._id} />
        </div>
      )}
      </>
      )}

      {/* ── SHARED MODALS ── */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        onSuccess={() => fetchRoom()}
        room={room as any}
      />

      <RoomAccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        onSuccess={() => {
          fetchRoom();
          fetchParticipants();
        }}
        roomId={room._id}
        roomName={room.name}
        initialAllowedUsers={room.allowedUsers || []}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.isOpen && confirmModal.kind === "room"
            ? confirmModal.actionType === "delete"
              ? `Delete "${room.name}"?`
              : confirmModal.actionType === "block"
              ? `Disable "${room.name}"?`
              : `Enable "${room.name}"?`
            : confirmModal.isOpen && confirmModal.kind === "removeUser"
            ? `Remove "${confirmModal.username}"?`
            : "Confirm Action"
        }
        message={
          confirmModal.isOpen && confirmModal.kind === "room"
            ? confirmModal.actionType === "delete"
              ? `Are you sure you want to permanently delete "${room.name}"? Active members will be disconnected, and all documents, whiteboard notes, and meeting history in this room will be permanently removed. This action cannot be undone.`
              : confirmModal.actionType === "block"
              ? `"${room.name}" will be disabled. Active members will be disconnected and unable to join or access meetings, documents, and whiteboard notes until the room is re-enabled. Existing files and notes will remain safely stored.`
              : `"${room.name}" will be reactivated. Members will immediately regain access to meetings, documents, and whiteboard notes.`
            : confirmModal.isOpen && confirmModal.kind === "removeUser"
            ? `Are you sure you want to remove "${confirmModal.username}" from "${room.name}"? They will lose access to all room meetings, documents, and whiteboard notes.`
            : ""
        }
        confirmLabel={
          confirmModal.isOpen && confirmModal.kind === "room"
            ? confirmModal.actionType === "delete"
              ? "Delete Room"
              : confirmModal.actionType === "block"
              ? "Disable Room"
              : "Enable Room"
            : confirmModal.isOpen && confirmModal.kind === "removeUser"
            ? "Remove Member"
            : "Confirm"
        }
        onConfirm={handleActionConfirm}
        onCancel={() => {
          setActionError(null);
          setConfirmModal(CLOSED_CONFIRM);
        }}
        isLoading={actionLoading}
        isDanger={
          confirmModal.isOpen &&
          (confirmModal.kind === "removeUser" ||
            (confirmModal.kind === "room" && confirmModal.actionType !== "unblock"))
        }
        error={actionError}
      />
    </div>
  );
}
