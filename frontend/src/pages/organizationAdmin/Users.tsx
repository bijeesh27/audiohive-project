import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  RotateCw,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";
import {
  organizationOwnerGetUsers,
  organizationUpdateUserStatus,
  organizationUpdateUserRole,
  organizationRemoveUser,
  updateUserWorkspaces,
} from "../../services/authServices";
import { getMyWorkspaces } from "../../services/workspaceServices";
import { useAuth } from "../../context/AuthContext";
import { useDirectChat } from "../../context/useDirectChat";
import { MembersTable } from "../../components/common/MembersTable";
import type { MemberRowData, SortField } from "../../components/common/MembersTable";
import ConfirmModal from "../../components/common/ConfirmModal";
import { MemberDrawer } from "../../components/workspaceAdmin/dashboard/MemberDrawer";

interface WorkspaceOption {
  _id: string;
  workspaceName: string;
  status: "active" | "suspended" | "archived";
}

interface ToastNotification {
  id: number;
  type: "success" | "error";
  message: string;
}

type RoleFilterType = "all" | "admin" | "member";
type StatusFilterType = "all" | "active" | "disabled";
type PresenceFilterType = "all" | "online" | "offline";
type SortOptionType = "newest" | "name" | "lastActive";

interface ConfirmModalState {
  isOpen: boolean;
  action: "status" | "role" | "remove" | null;
  user: MemberRowData | null;
  newStatus?: boolean;
  newRole?: string;
  isLoading: boolean;
}

export const Users: React.FC = () => {
  const { userId: currentUserId } = useAuth();
  const { isUserOnline } = useDirectChat();

  // ── URL Query Synchronization ──
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get("search") || "";
  const urlWorkspace = searchParams.get("workspace") || "all";
  const urlRole = (searchParams.get("role") as RoleFilterType) || "all";
  const urlStatus = (searchParams.get("status") as StatusFilterType) || "all";
  const urlPresence = (searchParams.get("presence") as PresenceFilterType) || "all";
  const urlSort = (searchParams.get("sort") as SortOptionType) || "newest";
  const urlPage = parseInt(searchParams.get("page") || "1", 10) || 1;

  // Search input state (debounced)
  const [searchInput, setSearchInput] = useState<string>(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(urlSearch);

  // Filter & pagination state
  const [workspaceFilter, setWorkspaceFilter] = useState<string>(urlWorkspace);
  const [roleFilter, setRoleFilter] = useState<RoleFilterType>(urlRole);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>(urlStatus);
  const [presenceFilter, setPresenceFilter] = useState<PresenceFilterType>(urlPresence);
  const [sortOption, setSortOption] = useState<SortOptionType>(urlSort);
  const [page, setPage] = useState<number>(urlPage);

  // Data state
  const [users, setUsers] = useState<MemberRowData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [metrics, setMetrics] = useState<{ totalMembers: number; planLimit: number | null; planName?: string }>({
    totalMembers: 0,
    planLimit: null,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Available workspaces in organization
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);

  // Modals & Drawer
  const [selectedDrawerUserId, setSelectedDrawerUserId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    action: null,
    user: null,
    isLoading: false,
  });

  // Workspace assignment modal
  const [workspaceModalUser, setWorkspaceModalUser] = useState<MemberRowData | null>(null);
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>([]);
  const [savingWorkspaces, setSavingWorkspaces] = useState<boolean>(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const nextToastId = useRef(1);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = nextToastId.current++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch workspaces for dropdown filter
  useEffect(() => {
    getMyWorkspaces(1, 1000)
      .then((res) => {
        setWorkspaces(res.data?.workspaces ?? []);
      })
      .catch(() => {
        setWorkspaces([]);
      });
  }, []);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Update URL search parameters when state changes
  const updateQueryParams = useCallback(
    (updates: {
      search?: string;
      workspace?: string;
      role?: string;
      status?: string;
      presence?: string;
      sort?: string;
      page?: number;
    }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const newSearch = updates.search !== undefined ? updates.search : debouncedSearch;
          const newWorkspace = updates.workspace !== undefined ? updates.workspace : workspaceFilter;
          const newRole = updates.role !== undefined ? updates.role : roleFilter;
          const newStatus = updates.status !== undefined ? updates.status : statusFilter;
          const newPresence = updates.presence !== undefined ? updates.presence : presenceFilter;
          const newSort = updates.sort !== undefined ? updates.sort : sortOption;
          const newPage = updates.page !== undefined ? updates.page : page;

          if (newSearch) next.set("search", newSearch);
          else next.delete("search");

          if (newWorkspace && newWorkspace !== "all") next.set("workspace", newWorkspace);
          else next.delete("workspace");

          if (newRole && newRole !== "all") next.set("role", newRole);
          else next.delete("role");

          if (newStatus && newStatus !== "all") next.set("status", newStatus);
          else next.delete("status");

          if (newPresence && newPresence !== "all") next.set("presence", newPresence);
          else next.delete("presence");

          if (newSort && newSort !== "newest") next.set("sort", newSort);
          else next.delete("sort");

          if (newPage > 1) next.set("page", String(newPage));
          else next.delete("page");

          return next;
        },
        { replace: true }
      );
    },
    [
      debouncedSearch,
      workspaceFilter,
      roleFilter,
      statusFilter,
      presenceFilter,
      sortOption,
      page,
      setSearchParams,
    ]
  );

  // Sync state from URL when navigating back/forward
  useEffect(() => {
    setSearchInput(urlSearch);
    setDebouncedSearch(urlSearch);
    setWorkspaceFilter(urlWorkspace);
    setRoleFilter(urlRole);
    setStatusFilter(urlStatus);
    setPresenceFilter(urlPresence);
    setSortOption(urlSort);
    setPage(urlPage);
  }, [urlSearch, urlWorkspace, urlRole, urlStatus, urlPresence, urlSort, urlPage]);

  // Fetch Users from server
  const fetchUsers = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const sortFieldMap: Record<SortOptionType, string> = {
      newest: "joined",
      name: "name",
      lastActive: "lastActive",
    };

    organizationOwnerGetUsers({
      page,
      limit: 10,
      search: debouncedSearch,
      workspaceId: workspaceFilter !== "all" ? workspaceFilter : undefined,
      role: roleFilter !== "all" ? roleFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      presence: presenceFilter !== "all" ? presenceFilter : undefined,
      sortField: sortFieldMap[sortOption] || "joined",
      sortOrder: sortOption === "name" ? "asc" : "desc",
    })
      .then((res) => {
        if (!cancelled) {
          const rawUsers: MemberRowData[] = (res.data?.users ?? []).map((u: MemberRowData) => ({
            ...u,
            isOnline: u.isOnline || isUserOnline(u._id),
          }));
          setUsers(rawUsers);
          setTotalCount(res.data?.total ?? 0);
          setTotalPages(res.data?.totalPages || Math.ceil((res.data?.total ?? 0) / 10) || 1);
          if (res.data?.metrics) {
            setMetrics(res.data.metrics);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message || err?.message || "Failed to load organization users.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, workspaceFilter, roleFilter, statusFilter, presenceFilter, sortOption, isUserOnline]);

  useEffect(() => {
    const cleanup = fetchUsers();
    return cleanup;
  }, [fetchUsers]);

  // Filter change handlers that reset page to 1
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
    updateQueryParams({ search: value.trim(), page: 1 });
  };

  const handleWorkspaceFilterChange = (value: string) => {
    setWorkspaceFilter(value);
    setPage(1);
    updateQueryParams({ workspace: value, page: 1 });
  };

  const handleRoleFilterChange = (value: RoleFilterType) => {
    setRoleFilter(value);
    setPage(1);
    updateQueryParams({ role: value, page: 1 });
  };

  const handleStatusFilterChange = (value: StatusFilterType) => {
    setStatusFilter(value);
    setPage(1);
    updateQueryParams({ status: value, page: 1 });
  };

  const handlePresenceFilterChange = (value: PresenceFilterType) => {
    setPresenceFilter(value);
    setPage(1);
    updateQueryParams({ presence: value, page: 1 });
  };

  const handleSortChange = (value: SortOptionType) => {
    setSortOption(value);
    updateQueryParams({ sort: value });
  };

  const handleTableColumnSort = (field: SortField) => {
    if (field === "name") {
      handleSortChange("name");
    } else if (field === "lastActive") {
      handleSortChange("lastActive");
    } else {
      handleSortChange("newest");
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateQueryParams({ page: newPage });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setWorkspaceFilter("all");
    setRoleFilter("all");
    setStatusFilter("all");
    setPresenceFilter("all");
    setSortOption("newest");
    setPage(1);
    updateQueryParams({
      search: "",
      workspace: "all",
      role: "all",
      status: "all",
      presence: "all",
      sort: "newest",
      page: 1,
    });
  };

  const hasActiveFilters = Boolean(
    debouncedSearch ||
      workspaceFilter !== "all" ||
      roleFilter !== "all" ||
      statusFilter !== "all" ||
      presenceFilter !== "all"
  );

  // ── Member Drawer Handler ──
  const handleOpenDrawer = (user: MemberRowData) => {
    setSelectedDrawerUserId(user._id);
    setIsDrawerOpen(true);
  };

  // ── Action Handlers ──
  // 1. Move to Workspace / Manage Workspaces
  const handleOpenWorkspaceModal = (user: MemberRowData) => {
    const currentIds = user.workspaces?.map((w) => w._id) ||
      user.workspaceIds?.map((w) => (typeof w === "string" ? w : w._id)) || [];
    setSelectedWorkspaceIds(currentIds);
    setWorkspaceModalUser(user);
  };

  const handleSaveWorkspaceAssignments = async () => {
    if (!workspaceModalUser) return;
    setSavingWorkspaces(true);
    const previousUsers = [...users];

    // Optimistic update
    const updatedWs = workspaces
      .filter((w) => selectedWorkspaceIds.includes(w._id))
      .map(({ _id, workspaceName }) => ({ _id, workspaceName }));

    setUsers((prev) =>
      prev.map((u) =>
        u._id === workspaceModalUser._id
          ? { ...u, workspaces: updatedWs, workspaceIds: updatedWs }
          : u
      )
    );

    try {
      await updateUserWorkspaces(workspaceModalUser._id, selectedWorkspaceIds);
      showToast(`Workspaces updated for ${workspaceModalUser.username}.`);
      setWorkspaceModalUser(null);
      fetchUsers();
    } catch (err: unknown) {
      // Rollback
      setUsers(previousUsers);
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(e.response?.data?.message || e.message || "Failed to update workspaces.", "error");
    } finally {
      setSavingWorkspaces(false);
    }
  };

  // 2. Change Role confirmation trigger
  const handleTriggerRoleChange = (user: MemberRowData) => {
    const normalizedRole = user.role?.toLowerCase() || "";
    const isCurrentlyAdmin =
      normalizedRole === "workspaceadmin" ||
      normalizedRole === "workspace-admin" ||
      normalizedRole === "admin";
    const nextRole = isCurrentlyAdmin ? "member" : "workspaceadmin";

    setConfirmModal({
      isOpen: true,
      action: "role",
      user,
      newRole: nextRole,
      isLoading: false,
    });
  };

  // 3. Toggle Status confirmation trigger
  const handleTriggerStatusChange = (user: MemberRowData) => {
    setConfirmModal({
      isOpen: true,
      action: "status",
      user,
      newStatus: !user.status,
      isLoading: false,
    });
  };

  // 4. Remove User confirmation trigger
  const handleTriggerRemoveUser = (user: MemberRowData) => {
    setConfirmModal({
      isOpen: true,
      action: "remove",
      user,
      isLoading: false,
    });
  };

  // Confirm Modal Execution with Optimistic Update and Rollback
  const handleExecuteConfirmAction = async () => {
    const { action, user, newStatus, newRole } = confirmModal;
    if (!action || !user) return;

    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    const previousUsers = [...users];

    if (action === "status" && typeof newStatus === "boolean") {
      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, status: newStatus } : u))
      );

      try {
        await organizationUpdateUserStatus(user._id, newStatus);
        showToast(`${user.username} was ${newStatus ? "enabled" : "disabled"}.`);
        setConfirmModal({ isOpen: false, action: null, user: null, isLoading: false });
        fetchUsers();
      } catch (err: unknown) {
        setUsers(previousUsers);
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        showToast(e.response?.data?.message || e.message || "Failed to update user status.", "error");
        setConfirmModal((prev) => ({ ...prev, isLoading: false }));
      }
    } else if (action === "role" && newRole) {
      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, role: newRole } : u))
      );

      try {
        await organizationUpdateUserRole(user._id, newRole);
        showToast(`Role for ${user.username} changed to ${newRole === "member" ? "Member" : "Admin"}.`);
        setConfirmModal({ isOpen: false, action: null, user: null, isLoading: false });
        fetchUsers();
      } catch (err: unknown) {
        setUsers(previousUsers);
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        showToast(e.response?.data?.message || e.message || "Failed to update user role.", "error");
        setConfirmModal((prev) => ({ ...prev, isLoading: false }));
      }
    } else if (action === "remove") {
      // Optimistic update
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      setTotalCount((c) => Math.max(0, c - 1));

      try {
        await organizationRemoveUser(user._id);
        showToast(`${user.username} was removed from the organization.`);
        setConfirmModal({ isOpen: false, action: null, user: null, isLoading: false });
        fetchUsers();
      } catch (err: unknown) {
        setUsers(previousUsers);
        setTotalCount(previousUsers.length);
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        showToast(e.response?.data?.message || e.message || "Failed to remove user.", "error");
        setConfirmModal((prev) => ({ ...prev, isLoading: false }));
      }
    }
  };

  // Header subtitle format
  const subtitleCount = useMemo(() => {
    const current = metrics.totalMembers || totalCount;
    if (metrics.planLimit && metrics.planLimit > 0) {
      return `${current} of ${metrics.planLimit} members`;
    }
    return `${current} members`;
  }, [metrics.totalMembers, metrics.planLimit, totalCount]);

  return (
    <div className="space-y-6">
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
              toast.type === "success"
                ? "bg-white border-emerald-200 text-emerald-950"
                : "bg-white border-red-200 text-red-950"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs sm:text-sm font-medium flex-1">{toast.message}</div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Organization Users
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 font-medium">
            {loading && users.length === 0 ? "Loading users..." : subtitleCount}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Refresh user list"
          >
            <RotateCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Controls: Search & Filters ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search: debounced 300ms, searches username & email */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member by name or email..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Workspace Filter */}
            <div className="relative">
              <select
                value={workspaceFilter}
                onChange={(e) => handleWorkspaceFilterChange(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                aria-label="Filter by workspace"
              >
                <option value="all">All Workspaces</option>
                {workspaces
                  .filter((w) => w.status === "active")
                  .map((ws) => (
                    <option key={ws._id} value={ws._id}>
                      {ws.workspaceName}
                    </option>
                  ))}
              </select>
            </div>

            {/* Role Filter */}
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => handleRoleFilterChange(e.target.value as RoleFilterType)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                aria-label="Filter by role"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value as StatusFilterType)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                aria-label="Filter by account status"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            {/* Presence Filter */}
            <div className="relative">
              <select
                value={presenceFilter}
                onChange={(e) => handlePresenceFilterChange(e.target.value as PresenceFilterType)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                aria-label="Filter by presence"
              >
                <option value="all">All Presence</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => handleSortChange(e.target.value as SortOptionType)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                aria-label="Sort users"
              >
                <option value="newest">Newest</option>
                <option value="name">Name</option>
                <option value="lastActive">Last active</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200/70 transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Shared MembersTable ── */}
      <MembersTable
        users={users}
        loading={loading}
        error={error}
        currentUserId={currentUserId ?? undefined}
        currentUserEmail={undefined}
        showWorkspaceColumn={true}
        sortField={sortOption === "name" ? "name" : sortOption === "lastActive" ? "lastActive" : "joined"}
        sortOrder={sortOption === "name" ? "asc" : "desc"}
        onSort={handleTableColumnSort}
        onRowClick={handleOpenDrawer}
        onViewProfile={handleOpenDrawer}
        onMoveWorkspace={handleOpenWorkspaceModal}
        onChangeRole={handleTriggerRoleChange}
        onToggleStatus={handleTriggerStatusChange}
        onRemove={handleTriggerRemoveUser}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={10}
        onPageChange={handlePageChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        onRetry={fetchUsers}
        removeActionLabel="Remove from Organization"
      />

      {/* ── Member Drawer ── */}
      <MemberDrawer
        userId={selectedDrawerUserId}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedDrawerUserId(null);
        }}
      />

      {/* ── Move to Workspace / Manage Workspaces Modal ── */}
      {workspaceModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Manage Workspaces</h2>
                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                  Select which workspaces <span className="font-semibold text-gray-800">{workspaceModalUser.username}</span> can access.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWorkspaceModalUser(null)}
                disabled={savingWorkspaces}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 max-h-72 space-y-2 overflow-y-auto pr-1">
              {workspaces
                .filter((w) => w.status === "active")
                .map((ws) => {
                  const isChecked = selectedWorkspaceIds.includes(ws._id);
                  const isSoleAdminOfThis =
                    workspaceModalUser.soleAdminWorkspaceNames?.includes(ws.workspaceName);

                  return (
                    <label
                      key={ws._id}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-xs sm:text-sm transition-all cursor-pointer ${
                        isChecked
                          ? "border-indigo-300 bg-indigo-50/40 text-indigo-950 font-medium"
                          : "border-gray-200 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWorkspaceIds((prev) => [...prev, ws._id]);
                          } else {
                            if (isSoleAdminOfThis) {
                              showToast(
                                `Cannot remove ${workspaceModalUser.username} from "${ws.workspaceName}" because they are the sole administrator.`,
                                "error"
                              );
                              return;
                            }
                            setSelectedWorkspaceIds((prev) => prev.filter((id) => id !== ws._id));
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <span className="truncate">{ws.workspaceName}</span>
                          {isSoleAdminOfThis && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                              Sole Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              {workspaces.filter((w) => w.status === "active").length === 0 && (
                <p className="text-xs sm:text-sm text-gray-500 text-center py-4">
                  No active workspaces available.
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setWorkspaceModalUser(null)}
                disabled={savingWorkspaces}
                className="rounded-xl border border-gray-300 px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveWorkspaceAssignments}
                disabled={savingWorkspaces || selectedWorkspaceIds.length === 0}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs sm:text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {savingWorkspaces ? "Saving..." : "Save Assignments"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Modals ── */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.action === "status"
            ? confirmModal.newStatus
              ? `Enable ${confirmModal.user?.username}?`
              : `Disable ${confirmModal.user?.username}?`
            : confirmModal.action === "role"
            ? `Change role for ${confirmModal.user?.username}?`
            : confirmModal.action === "remove"
            ? `Remove ${confirmModal.user?.username} from organization?`
            : "Confirm Action"
        }
        message={
          confirmModal.action === "status"
            ? confirmModal.newStatus
              ? `${confirmModal.user?.username} will regain active access to their assigned workspaces and rooms.`
              : `${confirmModal.user?.username} will immediately lose access to all workspaces and collaboration rooms in the organization.`
            : confirmModal.action === "role"
            ? confirmModal.newRole === "workspaceadmin"
              ? `This will grant ${confirmModal.user?.username} workspace administrator privileges across their assigned workspace.`
              : `This will demote ${confirmModal.user?.username} to a standard Member without workspace administration privileges.`
            : confirmModal.action === "remove"
            ? `This will completely remove ${confirmModal.user?.username} from all workspaces and collaboration rooms in this organization. This action cannot be undone.`
            : ""
        }
        confirmLabel={
          confirmModal.action === "status"
            ? confirmModal.newStatus
              ? "Enable User"
              : "Disable User"
            : confirmModal.action === "role"
            ? "Change Role"
            : confirmModal.action === "remove"
            ? "Remove User"
            : "Confirm"
        }
        onConfirm={handleExecuteConfirmAction}
        onCancel={() =>
          setConfirmModal({ isOpen: false, action: null, user: null, isLoading: false })
        }
        isLoading={confirmModal.isLoading}
        isDanger={
          confirmModal.action === "remove" ||
          (confirmModal.action === "status" && !confirmModal.newStatus)
        }
      />
    </div>
  );
};

export default Users;
