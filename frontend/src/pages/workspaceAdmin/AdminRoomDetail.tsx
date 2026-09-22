import { useCallback, useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import { updateWorkspaceUser } from "../../services/authServices";

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

const PAGE_SIZE = 10;
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

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);


  const [confirmModal, setConfirmModal] = useState<ConfirmState>(CLOSED_CONFIRM);

  // Guards against stale responses (id/page/search changed, or unmounted).
  const roomRequestIdRef = useRef(0);
  const participantsRequestIdRef = useRef(0);

  // Reset everything when navigating from one room to another. The route
  // element is reused, so without this the previous room's data would
  // stay on screen until the new fetch finished.
  useEffect(() => {
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

  // Bumping the request id in cleanup invalidates any in-flight request
  // when the deps change or the component unmounts.
  useEffect(() => {
    fetchRoom();
    return () => {
      roomRequestIdRef.current++;
    };
  }, [fetchRoom]);

  useEffect(() => {
    fetchParticipants();
    return () => {
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
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-sm font-medium">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-900">
            {user.username}
          </span>
        </div>
      ),
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

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_348px] gap-10 items-start">
        {/* ROOM CARD */}
        <div className="w-full min-w-0 bg-white border border-gray-200 rounded-xl shadow-sm px-8 py-7">
          <div className="flex items-start justify-between gap-8">
            {/* LEFT SIDE */}
            <div className="flex items-start gap-4 min-w-0 flex-1">
              {/* ROOM ICON */}
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                  room.type === "public" ? "bg-indigo-50" : "bg-orange-50"
                }`}
              >
                {room.type === "public" ? (
                  <Globe className="w-7 h-7 text-indigo-600" />
                ) : (
                  <Lock className="w-7 h-7 text-orange-600" />
                )}
              </div>

              {/* NAME + BADGES */}
              <div className="min-w-0 pt-1">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {room.name}
                </h1>

                <div className="flex items-center flex-wrap gap-2 mt-4">
                  {/* TYPE */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
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
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
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
            <div className="shrink-0 text-right pt-1 max-w-[190px]">
              <p className="text-sm text-gray-400 whitespace-nowrap">
                Created{" "}
                {new Date(room.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>

              {room.description && (
                <p
                  className="mt-1 text-sm text-gray-600 truncate"
                  title={room.description}
                >
                  {room.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ACTIONS CARD */}
        <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm px-7 py-5">
          <h2 className="text-sm font-semibold text-gray-700 text-center mb-5">
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

      <div className="mt-6 mb-3">
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