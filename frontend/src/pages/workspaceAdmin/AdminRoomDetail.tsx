import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getRoom,
  deleteRoom,
  updateRoom,
  getRoomParticipants,
  removeRoomUser,
} from "../../services/roomServices";

import RoomModal from "../../components/workspaceAdmin/RoomModal";
import RoomAccessModal from "../../components/workspaceAdmin/RoomAccessModal";

import ConfirmModal from "../../components/common/ConfirmModal";

import { API_ROUTES } from "../../constants/Api_Routes";
import ActionButton from "../../components/common/ActionButton";
import Table, { type Column } from "../../components/common/Table";

import {
  Globe,
  Lock,
  ArrowLeft,
  Pencil,
  ShieldBan,
  ShieldCheck,
  Trash2,
  UserCog,
  UserMinus,
  Wifi,
  WifiOff,
  Video,
  Layout,
  FileText,
} from "lucide-react";
import { updateWorkspaceUser } from "../../services/authServices";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { VideoCallPanel } from "../../components/room/VideoCallPanel";
import { RoomDocuments } from "./RoomDocuments";
import { Whiteboard } from "../../components/whiteboard/Whiteboard";

interface Room {
  _id: string;
  name: string;
  description: string;
  type: "public" | "private";
  status: "active" | "blocked";
  allowedUsers?: string[];
  createdAt: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  status: boolean;
}

type RoomActionType = "delete" | "block" | "unblock";

// Discriminated union: one branch for room-level actions, one for
// per-user actions. Each branch carries exactly the data it needs.
type ConfirmState =
  | { isOpen: false }
  | { isOpen: true; kind: "room"; actionType: RoomActionType }
  | {
      isOpen: true;
      kind: "user";
      userId: string;
      username: string;
      newStatus: boolean; // the status we're about to set (true = active)
    }
  | {
      isOpen: true;
      kind: "removeUser";
      userId: string;
      username: string;
    };

const PAGE_SIZE = 5;
const CLOSED_CONFIRM: ConfirmState = { isOpen: false };

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (!err || typeof err !== "object") return fallback;

  const response = "response" in err ? err.response : undefined;
  if (!response || typeof response !== "object") return fallback;

  const data = "data" in response ? response.data : undefined;
  if (!data || typeof data !== "object") return fallback;

  const message = "message" in data ? data.message : undefined;
  return typeof message === "string" ? message : fallback;
};

// Copy for the shared confirm modal, derived from the current state.
const getConfirmCopy = (state: ConfirmState, roomName: string) => {
  if (!state.isOpen) {
    return { title: "", message: "", label: "", isDanger: false };
  }

  if (state.kind === "room") {
    switch (state.actionType) {
      case "delete":
        return {
          title: "Delete Room?",
          message: `Are you sure you want to permanently delete "${roomName}"? This action cannot be undone.`,
          label: "Delete",
          isDanger: true,
        };
      case "block":
        return {
          title: "Block Room?",
          message: `"${roomName}" will be blocked and users won't be able to join it.`,
          label: "Block",
          isDanger: true,
        };
      case "unblock":
        return {
          title: "Unblock Room?",
          message: `"${roomName}" will be unblocked and active again.`,
          label: "Unblock",
          isDanger: false,
        };
    }
  }

  if (state.kind === "removeUser") {
    return {
      title: "Remove Participant?",
      message: `Are you sure you want to remove "${state.username}" from "${roomName}"?`,
      label: "Remove",
      isDanger: true,
    };
  }

  const { username, newStatus } = state;
  return {
    title: newStatus ? "Unblock User?" : "Block User?",
    message: newStatus
      ? `"${username}" will be unblocked and can participate in this room again.`
      : `"${username}" will be blocked.`,
    label: newStatus ? "Unblock" : "Block",
    isDanger: !newStatus,
  };
};

const AdminRoomDetail = () => {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { username } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [participantsError, setParticipantsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Errors from block / unblock / delete / remove actions. Kept separate
  // from load errors so an action failure never masquerades as
  // "Room not found" or an empty table.
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"meeting" | "whiteboard" | "details" | "documents">("meeting");

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  const { socket } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<{ userId: string; username: string }[]>([]);
  const [presenceFilter, setPresenceFilter] = useState<"all" | "online" | "offline">("all");

  const onlineUserIdSet = useMemo(() => new Set(onlineUsers.map((u) => u.userId)), [onlineUsers]);

  const presenceMembers = useMemo(() => {
    const map = new Map<string, { id: string; username: string; email?: string; role?: string; isOnline: boolean }>();

    users.forEach((u) => {
      map.set(u._id, {
        id: u._id,
        username: u.username,
        email: u.email,
        role: u.role,
        isOnline: onlineUserIdSet.has(u._id),
      });
    });

    onlineUsers.forEach((u) => {
      if (!map.has(u.userId)) {
        map.set(u.userId, {
          id: u.userId,
          username: u.username,
          isOnline: true,
        });
      }
    });

    return Array.from(map.values());
  }, [users, onlineUserIdSet, onlineUsers]);

  const onlineCount = useMemo(() => presenceMembers.filter((m) => m.isOnline).length, [presenceMembers]);
  const offlineCount = useMemo(() => presenceMembers.filter((m) => !m.isOnline).length, [presenceMembers]);

  const filteredPresenceMembers = useMemo(() => {
    if (presenceFilter === "online") return presenceMembers.filter((m) => m.isOnline);
    if (presenceFilter === "offline") return presenceMembers.filter((m) => !m.isOnline);
    return presenceMembers;
  }, [presenceMembers, presenceFilter]);

  const [confirmModal, setConfirmModal] = useState<ConfirmState>(CLOSED_CONFIRM);

  // Guards against stale responses (id/page/search changed, or unmounted).
  const roomRequestIdRef = useRef(0);
  const participantsRequestIdRef = useRef(0);

  // Reset everything when navigating from one room to another. The route
  // element is reused, so without this the previous room's data would
  // stay on screen until the new fetch finished.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoom(null);
    setUsers([]);
    setPage(1);
    setTotalPages(1);
    setSearch("");
    setDebouncedSearch("");
    setRoomError(null);
    setParticipantsError(null);
    setActionError(null);
    setConfirmModal(CLOSED_CONFIRM);
  }, [roomId]);

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1); // reset to first page on a new search
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchRoom = useCallback(async () => {
    if (!roomId) return;

    const requestId = ++roomRequestIdRef.current;
    setRoomLoading(true);
    setRoomError(null);

    try {
      const res = await getRoom(roomId);
      if (requestId !== roomRequestIdRef.current) return;
      setRoom(res.data.data || res.data);
    } catch (err: unknown) {
      if (requestId !== roomRequestIdRef.current) return;
      setRoomError(getErrorMessage(err, "Failed to load room"));
    } finally {
      // No `return` inside finally: it would swallow exceptions/returns
      // from the try/catch above (and trips no-unsafe-finally).
      if (requestId === roomRequestIdRef.current) {
        setRoomLoading(false);
      }
    }
  }, [roomId]);

  const fetchParticipants = useCallback(async () => {
    if (!roomId) return;

    const requestId = ++participantsRequestIdRef.current;
    setParticipantsLoading(true);
    setParticipantsError(null);

    try {
      const res = await getRoomParticipants(roomId, {
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch, // already trimmed in the debounce effect
      });

      if (requestId !== participantsRequestIdRef.current) return;

      const payload = res.data.data ?? res.data;
      const list: User[] = Array.isArray(payload)
        ? payload
        : payload.users ?? [];
      const pages: number = res.data.totalPages ?? payload.totalPages ?? 1;
      const safeTotalPages = Math.max(1, pages || 1);

      setUsers(list);
      setTotalPages(safeTotalPages);

      if (page > safeTotalPages) {
        setPage(safeTotalPages);
      }
    } catch (err: unknown) {
      if (requestId !== participantsRequestIdRef.current) return;
      setParticipantsError(getErrorMessage(err, "Failed to load participants"));
    } finally {
      if (requestId === participantsRequestIdRef.current) {
        setParticipantsLoading(false);
      }
    }
  }, [roomId, page, debouncedSearch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRoom();
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      roomRequestIdRef.current++;
    };
  }, [fetchRoom]);

  useEffect(() => {
    if (!roomId) return;

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchParticipants();
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      participantsRequestIdRef.current++;
    };
  }, [fetchParticipants]);

  const closeConfirmModal = () => setConfirmModal(CLOSED_CONFIRM);

  const handleActionConfirm = async () => {
    if (!roomId || !confirmModal.isOpen) return;

    setActionError(null);

    if (confirmModal.kind === "room") {
      const { actionType } = confirmModal;
      let navigatedAway = false;
      setActionLoading(true);

      try {
        if (actionType === "delete") {
          await deleteRoom(roomId);
          navigatedAway = true;
          navigate(API_ROUTES.WORKSPACE_ADMIN.NAV.ROOMS);
          return;
        }

        await updateRoom(roomId, {
          status: actionType === "block" ? "blocked" : "active",
        });
        fetchRoom();
      } catch (err: unknown) {
        setActionError(getErrorMessage(err, `Failed to ${actionType} room`));
      } finally {
        // `return` inside try still runs finally, so guard explicitly
        // instead of relying on a comment.
        if (!navigatedAway) {
          setActionLoading(false);
          closeConfirmModal();
        }
      }
      return;
    }

    if (confirmModal.kind === "removeUser") {
      const { userId } = confirmModal;
      closeConfirmModal();
      await handleRemove(userId);
      return;
    }

    // kind === "user"
    const { userId, newStatus } = confirmModal;
    setUserActionLoading(true);

    try {
      await updateWorkspaceUser(userId, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, status: newStatus } : u))
      );
    } catch (err: unknown) {
      setActionError(
        getErrorMessage(err, `Failed to ${newStatus ? "unblock" : "block"} user`)
      );
    } finally {
      setUserActionLoading(false);
      closeConfirmModal();
    }
  };

  const handleRemove = async (userId: string) => {
    if (!roomId) return;

    setRemovingId(userId);
    setActionError(null);

    try {
      await removeRoomUser(roomId, userId);

      if (users.length === 1 && page > 1) {
        // Last row on a non-first page: step back (this triggers a refetch).
        setPage((p) => Math.max(1, p - 1));
      } else {
        // Refetch so the page refills and totalPages stays accurate.
        fetchParticipants();
      }
    } catch (err: unknown) {
      setActionError(getErrorMessage(err, "Failed to remove user"));
    } finally {
      setRemovingId(null);
    }
  };

  if (roomLoading && !room) {
    return (
      <div className="w-full max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-5 w-36 bg-gray-200 rounded" />

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_348px] gap-10">
            <div className="h-52 bg-white border border-gray-200 rounded-xl" />
            <div className="h-52 bg-white border border-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (roomError && !room) {
    return (
      <div className="w-full max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-base font-medium text-gray-700">Room not found</p>

          <p className="text-sm text-gray-400 mt-1 mb-6">{roomError}</p>

          <button
            type="button"
            onClick={() => navigate(API_ROUTES.WORKSPACE_ADMIN.NAV.ROOMS)}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  if (!room) return null;

  const columns: Column<User>[] = [
    {
      header: "Username",
      render: (user) => {
        const isOnline = onlineUserIdSet.has(user._id);
        return (
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-sm font-medium">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                  isOnline ? "bg-emerald-500" : "bg-gray-300"
                }`}
                title={isOnline ? "Online" : "Offline"}
              />
            </div>
            <span className="text-sm font-medium text-gray-900">
              {user.username}
            </span>
          </div>
        );
      },
    },
    {
      header: "Presence",
      render: (user) => {
        const isOnline = onlineUserIdSet.has(user._id);
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
              isOnline
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-gray-50 text-gray-500 border-gray-200"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            {isOnline ? "Online" : "Offline"}
          </span>
        );
      },
    },
    {
      header: "Email",
      render: (user) => (
        <span className="text-sm text-gray-700">{user.email}</span>
      ),
    },
    {
      header: "User Role",
      render: (user) => (
        <span className="text-sm font-medium text-gray-900">{user.role}</span>
      ),
    },
    {
      header: "Status",
      render: (user) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            user.status ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          }`}
        >
          {user.status ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (user) => (
        <div className="flex items-center gap-2">
          <ActionButton
            icon={user.status ? ShieldBan : ShieldCheck}
            label={user.status ? "Block User" : "Unblock User"}
            onClick={() =>
              setConfirmModal({
                isOpen: true,
                kind: "user",
                userId: user._id,
                username: user.username,
                newStatus: !user.status,
              })
            }
            colorClasses={
              user.status
                ? "bg-amber-50 text-amber-700 hover:bg-amber-100 focus:ring-amber-300"
                : "bg-green-50 text-green-700 hover:bg-green-100 focus:ring-green-300"
            }
            disabled={userActionLoading}
          />
          {room.type === "private" && (
            <ActionButton
              icon={UserMinus}
              label="Remove User"
              onClick={() =>
                setConfirmModal({
                  isOpen: true,
                  kind: "removeUser",
                  userId: user._id,
                  username: user.username,
                })
              }
              colorClasses="bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-300"
              disabled={removingId === user._id || actionLoading || userActionLoading}
            />
          )}
        </div>
      ),
    },
  ];

  const confirmCopy = getConfirmCopy(confirmModal, room.name);

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8">
      {/* BACK */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(API_ROUTES.WORKSPACE_ADMIN.NAV.ROOMS)}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Rooms
        </button>
      </div>

      {/* ACTION ERROR */}
      {actionError && (
        <div
          role="alert"
          className="mb-6 flex items-start justify-between gap-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="shrink-0 font-medium hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Room Navigation Tabs - underline style */}
      <div className="flex items-center gap-0 border-b border-gray-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("meeting")}
          className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 whitespace-nowrap ${activeTab === "meeting" ? "text-violet-700" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
        >
          <Video className="w-4 h-4" />
          <span>Meeting & Video</span>
          {activeTab === "meeting" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("whiteboard")}
          className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 whitespace-nowrap ${activeTab === "whiteboard" ? "text-violet-700" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
        >
          <Layout className="w-4 h-4" />
          <span>Collaborative Whiteboard</span>
          {activeTab === "whiteboard" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 whitespace-nowrap ${activeTab === "details" ? "text-violet-700" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
        >
          <UserCog className="w-4 h-4" />
          <span>Room Details & Members</span>
          {activeTab === "details" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("documents")}
          className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 whitespace-nowrap ${activeTab === "documents" ? "text-violet-700" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
        >
          <FileText className="w-4 h-4" />
          <span>Documents</span>
          {activeTab === "documents" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />}
        </button>
      </div>

      {/* meeting tab */}
      <div className={activeTab === "meeting" ? "block" : "hidden"}>
        <VideoCallPanel roomId={room._id} roomName={room.name} roomType={room.type} currentUsername={username ?? "Admin"} />
      </div>

      {/* whiteboard tab */}
      <div className={activeTab === "whiteboard" ? "block h-[82vh] rounded-xl overflow-hidden border border-gray-200 shadow-lg" : "hidden"}>
        <Whiteboard roomId={room._id} />
      </div>

      {/* documents tab */}
      <div className={activeTab === "documents" ? "block space-y-6" : "hidden"}>
        <RoomDocuments roomId={room._id} />
      </div>

      {/* details tab */}
      <div className={activeTab === "details" ? "block space-y-6" : "hidden"}>
        {/* MAIN GRID: Room Card & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] gap-6 items-start">
          {/* ROOM CARD */}
          <div className="w-full min-w-0 bg-white border border-gray-200 rounded-xl shadow-sm px-6 py-6">
            <div className="flex items-start justify-between gap-4">
              {/* LEFT SIDE */}
              <div className="flex items-start gap-4 min-w-0 flex-1">
                {/* ROOM ICON */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    room.type === "public" ? "bg-indigo-50" : "bg-orange-50"
                  }`}
                >
                  {room.type === "public" ? (
                    <Globe className="w-6 h-6 text-indigo-600" />
                  ) : (
                    <Lock className="w-6 h-6 text-orange-600" />
                  )}
                </div>

                {/* NAME + BADGES */}
                <div className="min-w-0 pt-0.5">
                  <h1 className="text-xl font-bold text-gray-900 truncate">
                    {room.name}
                  </h1>

                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    {/* TYPE */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        room.type === "public"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      {room.type === "public" ? (
                        <Globe className="w-3 h-3" />
                      ) : (
                        <Lock className="w-3 h-3" />
                      )}
                      {room.type.charAt(0).toUpperCase() + room.type.slice(1)}
                    </span>

                    {/* STATUS */}
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        room.status === "active"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE INFO */}
              <div className="shrink-0 text-right pt-0.5">
                <p className="text-xs text-gray-400 whitespace-nowrap">
                  Created{" "}
                  {new Date(room.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {room.description && (
              <p
                className="mt-4 text-xs text-gray-600 leading-relaxed"
                title={room.description}
              >
                {room.description}
              </p>
            )}
          </div>

          {/* ACTIONS CARD */}
          <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm px-5 py-5">
            <h2 className="text-xs font-semibold text-gray-700 text-center mb-4">
              Room Actions
            </h2>

            <div
              className={`grid gap-3 justify-items-center ${
                room.type === "private" ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {room.type === "private" && (
                <ActionButton
                  icon={UserCog}
                  label="Manage Access"
                  onClick={() => setIsAccessModalOpen(true)}
                  colorClasses="bg-blue-50 text-blue-600 hover:bg-blue-100 focus:ring-blue-300"
                />
              )}

              <ActionButton
                icon={Pencil}
                label="Edit Room"
                onClick={() => setIsRoomModalOpen(true)}
                colorClasses="bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300"
              />

              <ActionButton
                icon={room.status === "active" ? ShieldBan : ShieldCheck}
                label={room.status === "active" ? "Block Room" : "Unblock Room"}
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    kind: "room",
                    actionType: room.status === "active" ? "block" : "unblock",
                  })
                }
                colorClasses={
                  room.status === "active"
                    ? "bg-amber-50 text-amber-700 hover:bg-amber-100 focus:ring-amber-300"
                    : "bg-green-50 text-green-700 hover:bg-green-100 focus:ring-green-300"
                }
                disabled={actionLoading}
              />

              <ActionButton
                icon={Trash2}
                label="Delete Room"
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    kind: "room",
                    actionType: "delete",
                  })
                }
                colorClasses="bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-300"
                disabled={actionLoading}
              />
            </div>
          </div>
        </div>

        {/* Room Presence (Online & Offline) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Room Presence</h2>
                <p className="text-xs text-gray-400">
                  <span className="text-emerald-600 font-medium">{onlineCount} online</span>
                  {" • "}
                  <span>{offlineCount} offline</span>
                </p>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setPresenceFilter("all")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  presenceFilter === "all"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                All ({presenceMembers.length})
              </button>
              <button
                type="button"
                onClick={() => setPresenceFilter("online")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  presenceFilter === "online"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-gray-500 hover:text-emerald-700"
                }`}
              >
                Online ({onlineCount})
              </button>
              <button
                type="button"
                onClick={() => setPresenceFilter("offline")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  presenceFilter === "offline"
                    ? "bg-white text-gray-800 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Offline ({offlineCount})
              </button>
            </div>
          </div>

          {filteredPresenceMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <WifiOff className="w-8 h-8 mb-2 text-gray-300" />
              <p className="text-sm text-gray-500">
                {presenceFilter === "online"
                  ? "No users currently online in this room"
                  : presenceFilter === "offline"
                  ? "All participants are online"
                  : "No presence records"}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {filteredPresenceMembers.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${
                          u.isOnline ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {u.username.slice(0, 2).toUpperCase()}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                          u.isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-300"
                        }`}
                        title={u.isOnline ? "Online" : "Offline"}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.username}</p>
                      {u.email && <p className="text-xs text-gray-400 truncate">{u.email}</p>}
                    </div>
                  </div>

                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                      u.isOnline
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        u.isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                      }`}
                    />
                    {u.isOnline ? "Online" : "Offline"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* PARTICIPANTS TABLE */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Participants</h2>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search username or email..."
              aria-label="Search participants"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <Table
            columns={columns}
            data={users}
            keyExtractor={(u) => u._id}
            loading={participantsLoading}
            error={participantsError}
            emptyMessage="No users found."
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* ROOM MODAL */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        onSuccess={() => {
          setIsRoomModalOpen(false);
          fetchRoom();
        }}
        room={room}
      />

      {/* ACCESS MODAL */}
      <RoomAccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        onSuccess={() => {
          setIsAccessModalOpen(false);
          fetchRoom();
          fetchParticipants(); // access changes can change who is listed
        }}
        roomId={room._id}
        roomName={room.name}
        initialAllowedUsers={room.allowedUsers || []}
      />

      {/* CONFIRM MODAL (shared for room-level and per-user actions) */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmCopy.title}
        message={confirmCopy.message}
        confirmLabel={confirmCopy.label}
        onConfirm={handleActionConfirm}
        onCancel={closeConfirmModal}
        isLoading={
          confirmModal.isOpen && confirmModal.kind === "room"
            ? actionLoading
            : userActionLoading
        }
        isDanger={confirmCopy.isDanger}
      />
    </div>
  );
};

export default AdminRoomDetail;
