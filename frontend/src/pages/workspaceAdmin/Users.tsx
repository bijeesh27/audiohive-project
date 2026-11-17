import { useEffect, useState, useTransition, useRef, useCallback } from "react";
import {
  Users as UsersIcon,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Eye,
  Shield,
  UserCheck,
  UserX,
  UserMinus,
  DoorOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  X,
  RotateCcw,
} from "lucide-react";
import { worspaceAdminGetUsers, updateWorkspaceUser } from "../../services/authServices";
import { useAuth } from "../../context/AuthContext";
import { useDirectChat } from "../../context/useDirectChat";
import InviteUserModal from "../../components/workspaceAdmin/InviteUserModal";
import { MemberDrawer } from "../../components/workspaceAdmin/dashboard/MemberDrawer";
import ConfirmModal from "../../components/common/ConfirmModal";

export interface WorkspaceUser {
  _id: string;
  userId?: string;
  username: string;
  email: string;
  role: string;
  status: boolean;
  isOnline?: boolean;
  roomsCount?: number;
  lastActiveAt?: string | null;
  joinedAt?: string;
}

export type SortField = "name" | "role" | "status" | "rooms" | "lastActive" | "joined";

interface ToastNotification {
  id: number;
  type: "success" | "error";
  message: string;
}

const formatRole = (role: string): string => {
  const normalized = role?.toLowerCase() || "";
  if (normalized === "workspaceadmin" || normalized === "workspace-admin") {
    return "Workspace Admin";
  }
  if (normalized === "member") {
    return "Member";
  }
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const formatRelativeTime = (iso: string | null | undefined): string => {
  if (!iso) return "Never";
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
  if (!iso) return "No recorded activity";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
};

const formatJoinedDate = (iso: string | null | undefined): string => {
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

export default function Users() {
  const { userId: currentUserId } = useAuth();
  const { isUserOnline } = useDirectChat();

  // ── Member Data & Stats State ──
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [stats, setStats] = useState<{ total: number; online: number; active: number; disabled: number }>({
    total: 0,
    online: 0,
    active: 0,
    disabled: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filters & Pagination State ──
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("joined");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // ── Modals & Drawers State ──
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);
  const [activeInlineRoleUserId, setActiveInlineRoleUserId] = useState<string | null>(null);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    userId: string;
    username: string;
    action: "status" | "role" | "remove";
    newStatus?: boolean;
    newRole?: string;
  }>({ isOpen: false, userId: "", username: "", action: "status" });
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);

  // Toast Notifications
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ id: Date.now(), type, message });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  const [, startTransition] = useTransition();

  // Close menus on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-row-menu]") && !target.closest("[data-role-dropdown]")) {
        setOpenMenuUserId(null);
        setActiveInlineRoleUserId(null);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenuUserId(null);
        setActiveInlineRoleUserId(null);
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

  // Fetch users when params change
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await worspaceAdminGetUsers(
        page,
        limit,
        debouncedSearch,
        roleFilter,
        statusFilter,
        sortField,
        sortOrder
      );

      if (res?.data) {
        setUsers(res.data.users || []);
        setTotalCount(res.data.total ?? 0);
        setTotalPages(res.data.totalPages || Math.ceil((res.data.total || 0) / limit) || 1);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errorObj?.response?.data?.message || "Failed to load workspace members");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, roleFilter, statusFilter, sortField, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder(field === "name" ? "asc" : "desc");
    }
    setPage(1);
  };

  // ── Actions with Optimistic UI & Rollback ──

  // 1. Update Status (Block / Unblock)
  const handleStatusChange = async (targetUser: WorkspaceUser, newStatus: boolean) => {
    if (targetUser._id === currentUserId) {
      showToast("error", "You cannot disable your own workspace admin account.");
      return;
    }

    const previousUsers = [...users];
    const previousStats = { ...stats };

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u._id === targetUser._id ? { ...u, status: newStatus } : u))
    );
    setStats((prev) => ({
      ...prev,
      active: newStatus ? prev.active + 1 : Math.max(0, prev.active - 1),
      disabled: newStatus ? Math.max(0, prev.disabled - 1) : prev.disabled + 1,
    }));

    try {
      await updateWorkspaceUser(targetUser._id, { status: newStatus });
      showToast("success", `${targetUser.username} is now ${newStatus ? "active" : "disabled"}.`);
    } catch (err: unknown) {
      // Rollback
      setUsers(previousUsers);
      setStats(previousStats);
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showToast("error", errorObj?.response?.data?.message || `Failed to update status for ${targetUser.username}.`);
    }
  };

  // 2. Change Role
  const handleRoleChange = async (targetUser: WorkspaceUser, newRole: string) => {
    if (targetUser._id === currentUserId) {
      showToast("error", "You cannot modify your own workspace admin role.");
      return;
    }
    if (targetUser.role === newRole) return;

    const previousUsers = [...users];

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u._id === targetUser._id ? { ...u, role: newRole } : u))
    );

    try {
      await updateWorkspaceUser(targetUser._id, { role: newRole });
      showToast("success", `${targetUser.username}'s role changed to ${formatRole(newRole)}.`);
    } catch (err: unknown) {
      // Rollback
      setUsers(previousUsers);
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showToast("error", errorObj?.response?.data?.message || `Failed to change role for ${targetUser.username}.`);
    } finally {
      setActiveInlineRoleUserId(null);
    }
  };

  // 3. Remove from Workspace
  const handleRemoveUser = async (targetUser: WorkspaceUser) => {
    if (targetUser._id === currentUserId) {
      showToast("error", "You cannot remove your own workspace admin account.");
      return;
    }

    const previousUsers = [...users];
    const previousStats = { ...stats };
    const previousTotalCount = totalCount;

    // Optimistic UI update
    setUsers((prev) => prev.filter((u) => u._id !== targetUser._id));
    setTotalCount((prev) => Math.max(0, prev - 1));
    setStats((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
      active: targetUser.status ? Math.max(0, prev.active - 1) : prev.active,
      disabled: !targetUser.status ? Math.max(0, prev.disabled - 1) : prev.disabled,
    }));

    try {
      await updateWorkspaceUser(targetUser._id, { workspaceId: null });
      showToast("success", `${targetUser.username} removed from workspace.`);
      if (users.length <= 1 && page > 1) {
        setPage((p) => p - 1);
      }
    } catch (err: unknown) {
      // Rollback
      setUsers(previousUsers);
      setStats(previousStats);
      setTotalCount(previousTotalCount);
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showToast("error", errorObj?.response?.data?.message || `Failed to remove ${targetUser.username} from workspace.`);
    }
  };

  // Execute confirmed modal action
  const handleConfirmModalAction = async () => {
    setConfirmLoading(true);
    const targetUser = users.find((u) => u._id === confirmModal.userId);
    try {
      if (confirmModal.action === "status" && targetUser && confirmModal.newStatus !== undefined) {
        await handleStatusChange(targetUser, confirmModal.newStatus);
      } else if (confirmModal.action === "role" && targetUser && confirmModal.newRole) {
        await handleRoleChange(targetUser, confirmModal.newRole);
      } else if (confirmModal.action === "remove" && targetUser) {
        await handleRemoveUser(targetUser);
      }
    } finally {
      setConfirmLoading(false);
      setConfirmModal({ isOpen: false, userId: "", username: "", action: "status" });
    }
  };

  // Open member drawer
  const openDrawer = (userId: string) => {
    setDrawerUserId(userId);
    setIsDrawerOpen(true);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  const hasActiveFilters = debouncedSearch !== "" || roleFilter !== "all" || statusFilter !== "all";

  // Calculate pagination range display
  const startRecord = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalCount);

  return (
    <div className="space-y-6">
      {/* ── Toast Notification ── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all transform animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            {stats.total > 0 ? `${stats.total} total members in this workspace` : "Workspace member directory"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Server-debounced Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm"
              aria-label="Search members"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="appearance-none bg-white border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm cursor-pointer"
              aria-label="Filter by role"
            >
              <option value="all">All Roles</option>
              <option value="member">Member</option>
              <option value="workspaceadmin">Workspace Admin</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="appearance-none bg-white border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm cursor-pointer"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Assign User Button */}
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors whitespace-nowrap"
          >
            Assign User
          </button>
        </div>
      </div>

      {/* ── 4 Small Stat Chips Above the Table ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Members */}
        <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <UsersIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>

        {/* Online Members */}
        <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Online</p>
            <p className="text-xl font-bold text-gray-900">{stats.online}</p>
          </div>
        </div>

        {/* Active Members */}
        <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active</p>
            <p className="text-xl font-bold text-gray-900">{stats.active}</p>
          </div>
        </div>

        {/* Disabled Members */}
        <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Disabled</p>
            <p className="text-xl font-bold text-gray-900">{stats.disabled}</p>
          </div>
        </div>
      </div>

      {/* ── Table Card (No nested scrollbar; natural page scroll; mobile horizontal scroll) ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
        {/* Error State */}
        {error ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900">Failed to load members</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">{error}</p>
            <button
              onClick={() => fetchUsers()}
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
                  {/* Member (Avatar, Name, Email, Presence) */}
                  <th scope="col" className="py-3.5 pl-6 pr-3">
                    <button
                      onClick={() => handleSort("name")}
                      className="inline-flex items-center gap-1.5 hover:text-gray-900 focus:outline-none group"
                      title="Sort by Member Name"
                    >
                      <span>Member</span>
                      {sortField === "name" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-gray-400" />
                      )}
                    </button>
                  </th>

                  {/* Role */}
                  <th scope="col" className="px-3 py-3.5">
                    <button
                      onClick={() => handleSort("role")}
                      className="inline-flex items-center gap-1.5 hover:text-gray-900 focus:outline-none group"
                      title="Sort by Role"
                    >
                      <span>Role</span>
                      {sortField === "role" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-gray-400" />
                      )}
                    </button>
                  </th>

                  {/* Status */}
                  <th scope="col" className="px-3 py-3.5">
                    <button
                      onClick={() => handleSort("status")}
                      className="inline-flex items-center gap-1.5 hover:text-gray-900 focus:outline-none group"
                      title="Sort by Status"
                    >
                      <span>Status</span>
                      {sortField === "status" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-gray-400" />
                      )}
                    </button>
                  </th>

                  {/* Rooms Count */}
                  <th scope="col" className="px-3 py-3.5 text-center">
                    <button
                      onClick={() => handleSort("rooms")}
                      className="inline-flex items-center gap-1.5 hover:text-gray-900 focus:outline-none group"
                      title="Sort by Rooms Accessible"
                    >
                      <span>Rooms</span>
                      {sortField === "rooms" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-gray-400" />
                      )}
                    </button>
                  </th>

                  {/* Last Active */}
                  <th scope="col" className="px-3 py-3.5">
                    <button
                      onClick={() => handleSort("lastActive")}
                      className="inline-flex items-center gap-1.5 hover:text-gray-900 focus:outline-none group"
                      title="Sort by Last Active Time"
                    >
                      <span>Last Active</span>
                      {sortField === "lastActive" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-gray-400" />
                      )}
                    </button>
                  </th>

                  {/* Joined Date */}
                  <th scope="col" className="px-3 py-3.5">
                    <button
                      onClick={() => handleSort("joined")}
                      className="inline-flex items-center gap-1.5 hover:text-gray-900 focus:outline-none group"
                      title="Sort by Joined Date"
                    >
                      <span>Joined</span>
                      {sortField === "joined" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-gray-400" />
                      )}
                    </button>
                  </th>

                  {/* Actions */}
                  <th scope="col" className="py-3.5 pl-3 pr-6 text-right">
                    <span className="sr-only">Actions</span>
                    <span>Actions</span>
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
                          <div className="w-9 h-9 rounded-full bg-gray-200" />
                          <div className="space-y-1.5">
                            <div className="w-28 h-4 bg-gray-200 rounded" />
                            <div className="w-36 h-3 bg-gray-100 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="w-20 h-6 bg-gray-200 rounded-full" />
                      </td>
                      <td className="px-3 py-4">
                        <div className="w-16 h-6 bg-gray-200 rounded-full" />
                      </td>
                      <td className="px-3 py-4 text-center">
                        <div className="w-6 h-6 bg-gray-200 rounded mx-auto" />
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
                ) : users.length === 0 ? (
                  /* Empty State */
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="max-w-sm mx-auto">
                        <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-base font-semibold text-gray-900">No members match your filters</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {hasActiveFilters
                            ? "Try adjusting your search query, role filter, or status filter."
                            : "There are currently no members in this workspace."}
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
                  /* Member Rows */
                  users.map((user) => {
                    const online = user.isOnline || isUserOnline(user._id);
                    const isCurrentUser = user._id === currentUserId;
                    const isWorkspaceAdmin =
                      user.role?.toLowerCase() === "workspaceadmin" ||
                      user.role?.toLowerCase() === "workspace-admin";

                    return (
                      <tr
                        key={user._id}
                        onClick={() => openDrawer(user._id)}
                        className="group hover:bg-gray-50/70 transition-colors cursor-pointer"
                      >
                        {/* Member Cell: Avatar, Name, Email, Presence Dot */}
                        <td className="py-4 pl-6 pr-3">
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-800 font-semibold text-sm border border-indigo-200/60 shadow-xs">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <span
                                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                                  online ? "bg-emerald-500" : "bg-gray-300"
                                }`}
                                title={online ? "Online" : "Offline"}
                                aria-label={online ? "User is online" : "User is offline"}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold text-gray-900 truncate">
                                  {user.username}
                                </span>
                                {isCurrentUser && (
                                  <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-medium bg-gray-100 text-gray-600 rounded">
                                    You
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role Cell: Badge with Inline Dropdown */}
                        <td
                          className="px-3 py-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative inline-block" data-role-dropdown>
                            {isCurrentUser ? (
                              /* Current user cannot change own role */
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                                title="Workspace Admin (Your account)"
                              >
                                <Shield className="w-3 h-3 text-indigo-600" />
                                {formatRole(user.role)}
                              </span>
                            ) : (
                              /* Inline Role Selector Button */
                              <div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveInlineRoleUserId(
                                      activeInlineRoleUserId === user._id ? null : user._id
                                    );
                                    setOpenMenuUserId(null);
                                  }}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                    isWorkspaceAdmin
                                      ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                                      : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200/80"
                                  }`}
                                  title="Click to change role"
                                  aria-expanded={activeInlineRoleUserId === user._id}
                                >
                                  {isWorkspaceAdmin && <Shield className="w-3 h-3 text-indigo-600" />}
                                  <span>{formatRole(user.role)}</span>
                                  <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                                </button>

                                {/* Dropdown Menu for Inline Role Switching */}
                                {activeInlineRoleUserId === user._id && (
                                  <div
                                    className="absolute left-0 mt-1.5 w-44 rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 z-20 animate-in fade-in zoom-in-95 duration-100"
                                    role="menu"
                                    aria-label="Change role options"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleRoleChange(user, "member")}
                                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-gray-50 transition-colors ${
                                        !isWorkspaceAdmin ? "font-semibold text-indigo-600" : "text-gray-700"
                                      }`}
                                      role="menuitem"
                                    >
                                      <span>Member</span>
                                      {!isWorkspaceAdmin && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRoleChange(user, "workspaceadmin")}
                                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-gray-50 transition-colors ${
                                        isWorkspaceAdmin ? "font-semibold text-indigo-600" : "text-gray-700"
                                      }`}
                                      role="menuitem"
                                    >
                                      <span className="flex items-center gap-1.5">
                                        <Shield className="w-3.5 h-3.5 text-indigo-600" />
                                        Workspace Admin
                                      </span>
                                      {isWorkspaceAdmin && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status Cell: Badge with text and indicator */}
                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
                              user.status
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                            aria-label={`Status: ${user.status ? "Active" : "Disabled"}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.status ? "bg-emerald-500" : "bg-red-500"
                              }`}
                            />
                            {user.status ? "Active" : "Disabled"}
                          </span>
                        </td>

                        {/* Rooms Count */}
                        <td className="px-3 py-4 text-center">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200/80"
                            title={`${user.roomsCount ?? 0} accessible rooms`}
                          >
                            <DoorOpen className="w-3 h-3 text-gray-500" />
                            {user.roomsCount ?? 0}
                          </span>
                        </td>

                        {/* Last Active */}
                        <td className="px-3 py-4">
                          <span
                            className="text-sm text-gray-600 cursor-default hover:text-gray-900 transition-colors"
                            title={formatFullDate(user.lastActiveAt)}
                          >
                            {formatRelativeTime(user.lastActiveAt)}
                          </span>
                        </td>

                        {/* Joined Date */}
                        <td className="px-3 py-4">
                          <span
                            className="text-sm text-gray-600"
                            title={user.joinedAt ? new Date(user.joinedAt).toLocaleString() : ""}
                          >
                            {formatJoinedDate(user.joinedAt)}
                          </span>
                        </td>

                        {/* Actions Cell: "..." dropdown menu */}
                        <td
                          className="py-4 pl-3 pr-6 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative inline-block text-left" data-row-menu>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuUserId(openMenuUserId === user._id ? null : user._id);
                                setActiveInlineRoleUserId(null);
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              aria-label={`Open action menu for ${user.username}`}
                              aria-haspopup="true"
                              aria-expanded={openMenuUserId === user._id}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {openMenuUserId === user._id && (
                              <div
                                className="absolute right-0 mt-1.5 w-52 rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-black/5 z-30 divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100"
                                role="menu"
                                aria-orientation="vertical"
                              >
                                <div className="py-1">
                                  {/* View Profile */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuUserId(null);
                                      openDrawer(user._id);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                                    role="menuitem"
                                    title="View member profile drawer"
                                  >
                                    <Eye className="w-4 h-4 text-gray-500" />
                                    <span>View Profile</span>
                                  </button>

                                  {/* Change Role toggle */}
                                  {!isCurrentUser ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuUserId(null);
                                        const nextRole = isWorkspaceAdmin ? "member" : "workspaceadmin";
                                        setConfirmModal({
                                          isOpen: true,
                                          userId: user._id,
                                          username: user.username,
                                          action: "role",
                                          newRole: nextRole,
                                        });
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                                      role="menuitem"
                                      title={isWorkspaceAdmin ? "Demote to Member" : "Promote to Workspace Admin"}
                                    >
                                      <Shield className="w-4 h-4 text-indigo-600" />
                                      <span>
                                        {isWorkspaceAdmin ? "Demote to Member" : "Make Workspace Admin"}
                                      </span>
                                    </button>
                                  ) : null}
                                </div>

                                <div className="py-1">
                                  {/* Disable / Enable User */}
                                  {isCurrentUser ? (
                                    <div
                                      className="px-4 py-2 text-xs text-gray-400 italic cursor-not-allowed"
                                      title="You cannot disable your own admin account"
                                    >
                                      Cannot disable self
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuUserId(null);
                                        setConfirmModal({
                                          isOpen: true,
                                          userId: user._id,
                                          username: user.username,
                                          action: "status",
                                          newStatus: !user.status,
                                        });
                                      }}
                                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${
                                        user.status
                                          ? "text-amber-700 hover:bg-amber-50"
                                          : "text-emerald-700 hover:bg-emerald-50"
                                      }`}
                                      role="menuitem"
                                      title={user.status ? "Disable member access" : "Enable member access"}
                                    >
                                      {user.status ? (
                                        <>
                                          <UserX className="w-4 h-4 text-amber-600" />
                                          <span>Disable User</span>
                                        </>
                                      ) : (
                                        <>
                                          <UserCheck className="w-4 h-4 text-emerald-600" />
                                          <span>Enable User</span>
                                        </>
                                      )}
                                    </button>
                                  )}

                                  {/* Remove from Workspace */}
                                  {isCurrentUser ? null : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuUserId(null);
                                        setConfirmModal({
                                          isOpen: true,
                                          userId: user._id,
                                          username: user.username,
                                          action: "remove",
                                        });
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                                      role="menuitem"
                                      title="Remove member completely from workspace"
                                    >
                                      <UserMinus className="w-4 h-4 text-red-500" />
                                      <span>Remove from Workspace</span>
                                    </button>
                                  )}
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
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
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

      {/* ── Assign User Modal ── */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => {
          fetchUsers();
          showToast("success", "User successfully assigned to workspace.");
        }}
      />

      {/* ── Reused Dashboard Member Drawer ── */}
      <MemberDrawer
        userId={drawerUserId}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setDrawerUserId(null);
        }}
      />

      {/* ── Confirmation Modal ── */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.action === "remove"
            ? "Remove member from workspace?"
            : confirmModal.action === "role"
            ? `Change ${confirmModal.username}'s role?`
            : confirmModal.newStatus
            ? "Enable member access?"
            : "Disable member access?"
        }
        message={
          confirmModal.action === "remove"
            ? `Are you sure you want to remove "${confirmModal.username}" from this workspace? They will lose access to all rooms, documents, and meetings immediately.`
            : confirmModal.action === "role"
            ? `Change role for "${confirmModal.username}" to ${formatRole(confirmModal.newRole || "")}?`
            : confirmModal.newStatus
            ? `Restore login and room access for "${confirmModal.username}"?`
            : `Disable "${confirmModal.username}"? They will lose access to the workspace immediately.`
        }
        confirmLabel={
          confirmModal.action === "remove"
            ? "Remove"
            : confirmModal.action === "role"
            ? "Confirm Change"
            : confirmModal.newStatus
            ? "Enable"
            : "Disable"
        }
        onConfirm={handleConfirmModalAction}
        onCancel={() =>
          setConfirmModal({ isOpen: false, userId: "", username: "", action: "status" })
        }
        isLoading={confirmLoading}
        isDanger={confirmModal.action === "remove" || (confirmModal.action === "status" && !confirmModal.newStatus)}
      />
    </div>
  );
}
