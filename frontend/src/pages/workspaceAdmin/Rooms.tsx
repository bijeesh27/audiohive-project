import { useEffect, useState, useCallback, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import {
  DoorOpen,
  Search,
  Plus,
  MoreVertical,
  Globe,
  Lock,
  Sparkles,
  ExternalLink,
  Users,
  Edit3,
  ShieldBan,
  ShieldCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  AlertCircle,
} from "lucide-react";
import { getRooms, deleteRoom, updateRoom } from "../../services/roomServices";
import RoomModal from "../../components/workspaceAdmin/RoomModal";
import RoomAccessModal from "../../components/workspaceAdmin/RoomAccessModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import { API_ROUTES } from "../../constants/Api_Routes";

export interface RoomItem {
  _id: string;
  name: string;
  description?: string;
  type: "public" | "private" | "lounge" | "standard";
  status: "active" | "blocked";
  isDefault?: boolean;
  allowedUsers?: string[];
  memberCount?: number;
  onlineCount?: number;
  lastActivity?: string | null;
  createdAt: string;
}

const formatRelativeTime = (iso: string | null | undefined): string => {
  if (!iso) return "No activity";
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    if (diffMs < 0) return "Just now";
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 14) return `${diffDays}d ago`;
    return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "–";
  }
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

export default function Rooms() {
  const navigate = useNavigate();

  // ── Room Data & Stats State ──
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [liveRoomsCount, setLiveRoomsCount] = useState<number>(0);

  // ── Filters & Pagination State ──
  const [page, setPage] = useState<number>(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // ── Modals & Actions Menu State ──
  const [openMenuRoomId, setOpenMenuRoomId] = useState<string | null>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<any>(undefined);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState<boolean>(false);
  const [accessRoom, setAccessRoom] = useState<RoomItem | undefined>(undefined);

  // ── Confirmation Modal ──
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    roomId: string;
    roomName: string;
    actionType: "delete" | "block" | "unblock";
  }>({ isOpen: false, roomId: "", roomName: "", actionType: "delete" });

  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  // Close actions menu on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-row-menu]")) {
        setOpenMenuRoomId(null);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenuRoomId(null);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearch(searchInput.trim());
        setPage(1);
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch rooms
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRooms(page, limit, debouncedSearch, typeFilter, statusFilter);
      const resData = res.data?.data || res.data;
      const roomList: RoomItem[] = resData.rooms || [];
      const total = resData.total ?? roomList.length;
      const live = resData.liveRoomsCount ?? roomList.filter((r) => (r.onlineCount ?? 0) > 0).length;

      setRooms(roomList);
      setTotalCount(total);
      setLiveRoomsCount(live);
      setTotalPages(Math.max(1, Math.ceil(total / limit)));
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errorObj?.response?.data?.message || "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, typeFilter, statusFilter]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleActionConfirm = async () => {
    if (!confirmModal.roomId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      if (confirmModal.actionType === "delete") {
        await deleteRoom(confirmModal.roomId);
      } else {
        const newStatus = confirmModal.actionType === "block" ? "blocked" : "active";
        await updateRoom(confirmModal.roomId, { status: newStatus });
      }
      setConfirmModal({ isOpen: false, roomId: "", roomName: "", actionType: "delete" });
      fetchRooms();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setActionError(errorObj?.response?.data?.message || `Failed to ${confirmModal.actionType} room`);
    } finally {
      setActionLoading(false);
    }
  };

  const isDefaultRoom = (room: RoomItem): boolean => {
    return Boolean(room.isDefault || room.name === "Lounge" || room.name === "Office Common Room");
  };

  const hasActiveFilters = searchInput.length > 0 || typeFilter !== "all" || statusFilter !== "all";

  const handleClearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  const startRecord = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalCount);

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-indigo-600" />
            Rooms
          </h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            {loading && totalCount === 0
              ? "Loading rooms..."
              : `${totalCount} ${totalCount === 1 ? "room" : "rooms"} · ${liveRoomsCount} live`}
          </p>
        </div>

        {/* Create Room Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingRoom(undefined);
              setIsRoomModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold shadow-sm shadow-indigo-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Room</span>
          </button>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search rooms by name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="w-full md:w-44">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
              aria-label="Filter by room type"
            >
              <option value="all">All Types</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="lounge">Lounge</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-40">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
              aria-label="Filter by room status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Disabled</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              title="Reset all filters"
            >
              <X className="w-4 h-4" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {error ? (
          <div className="py-16 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-gray-900">Failed to load rooms</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">{error}</p>
            <button
              onClick={() => fetchRooms()}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" role="table">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th scope="col" className="py-3.5 pl-6 pr-3">
                    Room
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    Type
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-center">
                    Members
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    Online Now
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    Last Activity
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    Created
                  </th>
                  <th scope="col" className="py-3.5 pl-3 pr-6 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {/* Skeleton Loading State */}
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="py-4 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gray-200" />
                          <div className="space-y-1.5">
                            <div className="w-32 h-4 bg-gray-200 rounded" />
                            <div className="w-44 h-3 bg-gray-100 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="w-18 h-6 bg-gray-200 rounded-full" />
                      </td>
                      <td className="px-3 py-4">
                        <div className="w-16 h-6 bg-gray-200 rounded-full" />
                      </td>
                      <td className="px-3 py-4 text-center">
                        <div className="w-8 h-4 bg-gray-200 rounded mx-auto" />
                      </td>
                      <td className="px-3 py-4">
                        <div className="w-16 h-4 bg-gray-200 rounded" />
                      </td>
                      <td className="px-3 py-4">
                        <div className="w-20 h-4 bg-gray-200 rounded" />
                      </td>
                      <td className="px-3 py-4">
                        <div className="w-24 h-4 bg-gray-200 rounded" />
                      </td>
                      <td className="py-4 pl-3 pr-6 text-right">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : rooms.length === 0 ? (
                  /* Empty State */
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="max-w-sm mx-auto">
                        <DoorOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-base font-semibold text-gray-900">No rooms match your filters</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {hasActiveFilters
                            ? "Try adjusting your search query, type filter, or status filter."
                            : "There are currently no rooms created in this workspace."}
                        </p>
                        {hasActiveFilters && (
                          <button
                            onClick={handleClearFilters}
                            className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  rooms.map((room) => {
                    const isDef = isDefaultRoom(room);
                    const isOnline = (room.onlineCount ?? 0) > 0;
                    const isRoomLounge = room.type === "lounge" || room.name.toLowerCase() === "lounge";

                    return (
                      <tr
                        key={room._id}
                        onClick={() => navigate(API_ROUTES.WORKSPACE_ADMIN.NAV.ROOM_DETAIL(room._id))}
                        className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                      >
                        {/* Room Info */}
                        <td className="py-4 pl-6 pr-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                isRoomLounge
                                  ? "bg-purple-50 text-purple-600 border-purple-100"
                                  : room.type === "public"
                                  ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                                  : "bg-orange-50 text-orange-600 border-orange-100"
                              }`}
                            >
                              {isRoomLounge ? (
                                <Sparkles className="w-4 h-4" />
                              ) : room.type === "public" ? (
                                <Globe className="w-4 h-4" />
                              ) : (
                                <Lock className="w-4 h-4" />
                              )}
                            </div>

                            <div className="min-w-0 max-w-xs">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                                  {room.name}
                                </span>
                                {isDef && (
                                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p
                                className="text-xs text-gray-500 truncate mt-0.5"
                                title={room.description || "No description provided"}
                              >
                                {room.description || "No description provided"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Type Badge */}
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
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
                        </td>

                        {/* Status Badge */}
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              room.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {room.status === "active" ? "Active" : "Disabled"}
                          </span>
                        </td>

                        {/* Members Count */}
                        <td className="px-3 py-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 font-mono">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            {room.memberCount ?? (room.allowedUsers?.length || 0)}
                          </span>
                        </td>

                        {/* Online Now */}
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {isOnline ? (
                              <>
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-bold text-emerald-700">
                                  {room.onlineCount} online
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="w-2 h-2 rounded-full bg-gray-300" />
                                <span className="text-xs text-gray-400">0 online</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Last Activity */}
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span
                            className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
                            title={room.lastActivity ? formatFullDate(room.lastActivity) : ""}
                          >
                            {formatRelativeTime(room.lastActivity)}
                          </span>
                        </td>

                        {/* Created Date */}
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className="text-xs text-gray-600">
                            {formatFullDate(room.createdAt)}
                          </span>
                        </td>

                        {/* Actions Cell: "..." dropdown menu */}
                        <td
                          className="py-4 pl-3 pr-6 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative inline-block text-left" data-row-menu>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuRoomId(openMenuRoomId === room._id ? null : room._id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              aria-label={`Open actions for ${room.name}`}
                              aria-haspopup="true"
                              aria-expanded={openMenuRoomId === room._id}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openMenuRoomId === room._id && (
                              <div
                                className="absolute right-0 mt-1.5 w-52 rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-black/5 z-30 divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100"
                                role="menu"
                              >
                                <div className="py-1">
                                  {/* Open Room Detail */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuRoomId(null);
                                      navigate(API_ROUTES.WORKSPACE_ADMIN.NAV.ROOM_DETAIL(room._id));
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                                    role="menuitem"
                                  >
                                    <ExternalLink className="w-4 h-4 text-gray-400" />
                                    <span>Open</span>
                                  </button>

                                  {/* Manage Members */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuRoomId(null);
                                      setAccessRoom(room);
                                      setIsAccessModalOpen(true);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                                    role="menuitem"
                                  >
                                    <Users className="w-4 h-4 text-gray-400" />
                                    <span>Manage Members</span>
                                  </button>

                                  {/* Edit Room */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuRoomId(null);
                                      setEditingRoom(room);
                                      setIsRoomModalOpen(true);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                                    role="menuitem"
                                  >
                                    <Edit3 className="w-4 h-4 text-gray-400" />
                                    <span>Edit</span>
                                  </button>
                                </div>

                                <div className="py-1">
                                  {/* Disable / Enable */}
                                  <button
                                    type="button"
                                    disabled={isDef}
                                    onClick={() => {
                                      setOpenMenuRoomId(null);
                                      if (isDef) return;
                                      setActionError(null);
                                      setConfirmModal({
                                        isOpen: true,
                                        roomId: room._id,
                                        roomName: room.name,
                                        actionType: room.status === "active" ? "block" : "unblock",
                                      });
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${
                                      isDef
                                        ? "text-gray-300 cursor-not-allowed"
                                        : room.status === "active"
                                        ? "text-amber-700 hover:bg-amber-50"
                                        : "text-emerald-700 hover:bg-emerald-50"
                                    }`}
                                    role="menuitem"
                                    title={isDef ? "Default rooms cannot be disabled" : undefined}
                                  >
                                    {room.status === "active" ? (
                                      <ShieldBan className="w-4 h-4 text-amber-600" />
                                    ) : (
                                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                    )}
                                    <span>{room.status === "active" ? "Disable" : "Enable"}</span>
                                  </button>

                                  {/* Delete Room */}
                                  <button
                                    type="button"
                                    disabled={isDef}
                                    onClick={() => {
                                      setOpenMenuRoomId(null);
                                      if (isDef) return;
                                      setActionError(null);
                                      setConfirmModal({
                                        isOpen: true,
                                        roomId: room._id,
                                        roomName: room.name,
                                        actionType: "delete",
                                      });
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${
                                      isDef
                                        ? "text-gray-300 cursor-not-allowed"
                                        : "text-rose-600 hover:bg-rose-50"
                                    }`}
                                    role="menuitem"
                                    title={isDef ? "Default rooms cannot be deleted" : undefined}
                                  >
                                    <Trash2 className="w-4 h-4 text-rose-500" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Single Footer & Pagination ── */}
        {!error && totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-white">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-900">{startRecord}</span>-
              <span className="font-semibold text-gray-900">{endRecord}</span> of{" "}
              <span className="font-semibold text-gray-900">{totalCount}</span>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        onSuccess={() => fetchRooms()}
        room={editingRoom}
      />

      <RoomAccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        onSuccess={() => fetchRooms()}
        roomId={accessRoom?._id || ""}
        roomName={accessRoom?.name || ""}
        initialAllowedUsers={accessRoom?.allowedUsers || []}
      />

      {/* ── Confirmation Modal with Detailed Consequences ── */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.actionType === "delete"
            ? `Delete "${confirmModal.roomName}"?`
            : confirmModal.actionType === "block"
            ? `Disable "${confirmModal.roomName}"?`
            : `Enable "${confirmModal.roomName}"?`
        }
        message={
          confirmModal.actionType === "delete"
            ? `Are you sure you want to permanently delete "${confirmModal.roomName}"? Active members will be disconnected, and all documents, whiteboard notes, and meeting history in this room will be permanently removed. This action cannot be undone.`
            : confirmModal.actionType === "block"
            ? `"${confirmModal.roomName}" will be disabled. Active members will be disconnected and unable to join or access meetings, documents, and whiteboard notes until the room is re-enabled. Existing files and notes will remain safely stored.`
            : `"${confirmModal.roomName}" will be reactivated. Members will immediately regain access to meetings, documents, and whiteboard notes.`
        }
        confirmLabel={
          confirmModal.actionType === "delete"
            ? "Delete Room"
            : confirmModal.actionType === "block"
            ? "Disable Room"
            : "Enable Room"
        }
        onConfirm={handleActionConfirm}
        onCancel={() => {
          setActionError(null);
          setConfirmModal({ isOpen: false, roomId: "", roomName: "", actionType: "delete" });
        }}
        isLoading={actionLoading}
        isDanger={confirmModal.actionType === "delete" || confirmModal.actionType === "block"}
        error={actionError}
      />
    </div>
  );
}
