import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Users as UsersIcon,
  Search,
  RotateCcw,
  Building2,
  Layers,
  Shield,
  Activity,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import {
  getSuperAdminUsers,
  toggleSuperAdminUserStatus,
} from "../../services/superAdminServices";
import type {
  IPlatformUserItem,
  IPlatformUsersStats,
} from "../../services/superAdminServices";
import { MembersTable } from "../../components/common/MembersTable";
import type {
  MemberRowData,
  SortField,
  SortOrder,
  RowActionRules,
} from "../../components/common/MembersTable";
import { MemberDrawer } from "../../components/workspaceAdmin/dashboard/MemberDrawer";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { useAuth } from "../../context/AuthContext";

export const Users: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { userId: currentUserId } = useAuth();

  // State from URL query parameters
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const searchParam = searchParams.get("search") || "";
  const roleParam = searchParams.get("role") || "all";
  const statusParam = searchParams.get("status") || "all";
  const presenceParam = searchParams.get("presence") || "all";
  const orgParam = searchParams.get("organizationId") || "all";
  const wsParam = searchParams.get("workspaceId") || "all";
  const sortParam = (searchParams.get("sort") as "newest" | "oldest" | "name" | "lastActive") || "newest";

  // Local state for debounced search input
  const [searchInput, setSearchInput] = useState(searchParam);
  const [debouncedSearch, setDebouncedSearch] = useState(searchParam);

  // Table Data & Meta
  const [users, setUsers] = useState<IPlatformUserItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Platform user statistics
  const [stats, setStats] = useState<IPlatformUsersStats>({
    totalUsers: 0,
    ownersCount: 0,
    membersCount: 0,
    onlineCount: 0,
  });

  // Filter options returned from backend
  const [filterOptions, setFilterOptions] = useState<{
    organizations: Array<{ _id: string; companyName: string; slug: string }>;
    workspaces: Array<{ _id: string; workspaceName: string; organizationId?: string }>;
  }>({ organizations: [], workspaces: [] });

  // Sorting state for table header
  const [sortField, setSortField] = useState<SortField>(
    sortParam === "name" ? "name" : sortParam === "lastActive" ? "lastActive" : "joined"
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(sortParam === "oldest" ? "asc" : "desc");

  // Selected user for Member Drawer
  const [selectedDrawerUserId, setSelectedDrawerUserId] = useState<string | null>(null);

  // Confirm modal state for Disable / Enable
  const [statusConfirmTarget, setStatusConfirmTarget] = useState<IPlatformUserItem | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Keep search param in URL updated when debounced search changes
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (debouncedSearch) {
          next.set("search", debouncedSearch);
        } else {
          next.delete("search");
        }
        next.set("page", "1");
        return next;
      },
      { replace: true }
    );
  }, [debouncedSearch, setSearchParams]);

  // Helper to update specific search param
  const updateQueryParam = useCallback(
    (key: string, value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (!value || value === "all") {
            next.delete(key);
          } else {
            next.set(key, value);
          }
          next.set("page", "1");
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getSuperAdminUsers({
        page: pageParam,
        limit: pageSize,
        search: debouncedSearch || undefined,
        role: roleParam !== "all" ? roleParam : undefined,
        status: statusParam !== "all" ? statusParam : undefined,
        presence: presenceParam !== "all" ? presenceParam : undefined,
        organizationId: orgParam !== "all" ? orgParam : undefined,
        workspaceId: wsParam !== "all" ? wsParam : undefined,
        sort: sortParam,
      });

      if (res.data) {
        setUsers(res.data.users);
        setTotalCount(res.data.total);
        setTotalPages(res.data.totalPages);
        setStats(res.data.stats);
        if (res.data.filterOptions) {
          setFilterOptions(res.data.filterOptions);
        }
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(
        errorObj?.response?.data?.message ||
          "Failed to load platform users. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [
    pageParam,
    pageSize,
    debouncedSearch,
    roleParam,
    statusParam,
    presenceParam,
    orgParam,
    wsParam,
    sortParam,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Table Header Sorting
  const handleSort = (field: SortField) => {
    let nextSortOrder: SortOrder = "asc";
    if (sortField === field) {
      nextSortOrder = sortOrder === "asc" ? "desc" : "asc";
    }
    setSortField(field);
    setSortOrder(nextSortOrder);

    let backendSort: "newest" | "oldest" | "name" | "lastActive" = "newest";
    if (field === "name") {
      backendSort = "name";
    } else if (field === "lastActive") {
      backendSort = "lastActive";
    } else if (field === "joined") {
      backendSort = nextSortOrder === "asc" ? "oldest" : "newest";
    }

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("sort", backendSort);
        next.set("page", "1");
        return next;
      },
      { replace: true }
    );
  };

  // Handle Page Change
  const handlePageChange = (newPage: number) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("page", String(newPage));
        return next;
      },
      { replace: true }
    );
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setSearchParams(
      {
        page: "1",
      },
      { replace: true }
    );
  };

  const hasActiveFilters = useMemo(() => {
    return (
      Boolean(debouncedSearch) ||
      roleParam !== "all" ||
      statusParam !== "all" ||
      presenceParam !== "all" ||
      orgParam !== "all" ||
      wsParam !== "all"
    );
  }, [debouncedSearch, roleParam, statusParam, presenceParam, orgParam, wsParam]);

  // Transform platform users to MemberRowData for MembersTable
  const tableData: MemberRowData[] = useMemo(() => {
    return users.map((u) => ({
      _id: u._id,
      userId: u.userId,
      username: u.username,
      email: u.email,
      role: u.role,
      status: u.status,
      isOnline: u.isOnline,
      lastActiveAt: u.lastActiveAt,
      joinedAt: u.joinedAt,
      workspaces: u.workspaces,
      workspaceIds: u.workspaces,
      organization: u.organization,
      isOwner: u.isOwner,
      isSoleAdmin: u.isSoleAdmin,
      soleAdminWorkspaceNames: u.soleAdminWorkspaceNames,
    }));
  }, [users]);

  // Determine row action permissions and disabled reasons
  const getRowActionRules = (row: MemberRowData): RowActionRules => {
    const isSelf = Boolean(currentUserId && (row._id === currentUserId || row.userId === currentUserId));
    const isSuperAdminRole =
      row.role?.toLowerCase() === "superadmin" || row.role?.toLowerCase() === "super-admin";
    const isOwner = Boolean(row.isOwner || row.role?.toLowerCase() === "organization-owner");

    let toggleStatusDisabledReason: string | undefined;
    if (isSelf) {
      toggleStatusDisabledReason = "You cannot disable your own Super Admin account";
    } else if (isSuperAdminRole) {
      toggleStatusDisabledReason = "Super Admin accounts cannot be disabled here";
    } else if (isOwner && row.status) {
      toggleStatusDisabledReason =
        "Cannot disable an organization owner. Reassign organization ownership first";
    }

    let removeDisabledReason: string | undefined;
    if (isSelf) {
      removeDisabledReason = "You cannot remove your own account";
    } else if (isOwner) {
      removeDisabledReason = "Cannot remove an organization owner";
    }

    return {
      canViewProfile: true,
      canMoveWorkspace: false,
      canChangeRole: false,
      canToggleStatus: !toggleStatusDisabledReason,
      toggleStatusDisabledReason,
      canRemove: !removeDisabledReason,
      removeDisabledReason,
    };
  };

  // Open status confirm dialog
  const handleRequestToggleStatus = (row: MemberRowData) => {
    const target = users.find((u) => u._id === row._id);
    if (!target) return;
    setStatusConfirmTarget(target);
  };

  // Execute status toggle with optimistic update & rollback
  const handleConfirmToggleStatus = async () => {
    if (!statusConfirmTarget) return;
    const target = statusConfirmTarget;
    const previousStatus = target.status;
    const nextStatus = !previousStatus;

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u._id === target._id ? { ...u, status: nextStatus } : u))
    );
    setStatusConfirmTarget(null);

    try {
      setStatusUpdating(true);
      await toggleSuperAdminUserStatus(target._id, nextStatus);
      setToastMessage({
        type: "success",
        text: `User "${target.username}" has been ${nextStatus ? "enabled" : "disabled"}.`,
      });
      // Refresh stats in background
      fetchUsers();
    } catch (err: unknown) {
      // Rollback
      setUsers((prev) =>
        prev.map((u) => (u._id === target._id ? { ...u, status: previousStatus } : u))
      );
      const errorObj = err as { response?: { data?: { message?: string } } };
      setToastMessage({
        type: "error",
        text:
          errorObj?.response?.data?.message ||
          `Failed to update status for ${target.username}.`,
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-200 text-sm font-medium ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header and Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Users</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              <UsersIcon className="w-3 h-3 text-indigo-600" />
              Platform
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {stats.totalUsers > 0
              ? `${stats.totalUsers} users · ${stats.ownersCount} owners · ${stats.membersCount} members`
              : "Platform-wide user directory and access management"}
          </p>
        </div>

        {/* Refresh & Reset Controls */}
        <div className="flex items-center gap-2.5">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
              Clear filters
            </button>
          )}
          <button
            type="button"
            onClick={() => fetchUsers()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            aria-label="Refresh users list"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-gray-500 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search input (300ms debounced) */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
              aria-label="Search users by name or email"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label="Clear search input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Organization Filter */}
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-gray-400 hidden sm:inline" />
              <select
                value={orgParam}
                onChange={(e) => updateQueryParam("organizationId", e.target.value)}
                className="text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                aria-label="Filter by organization"
              >
                <option value="all">All Organizations</option>
                {filterOptions.organizations.map((org) => (
                  <option key={org._id} value={org._id}>
                    {org.companyName}
                  </option>
                ))}
              </select>
            </div>

            {/* Workspace Filter */}
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-gray-400 hidden sm:inline" />
              <select
                value={wsParam}
                onChange={(e) => updateQueryParam("workspaceId", e.target.value)}
                className="text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                aria-label="Filter by workspace"
              >
                <option value="all">All Workspaces</option>
                {filterOptions.workspaces.map((ws) => (
                  <option key={ws._id} value={ws._id}>
                    {ws.workspaceName}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-gray-400 hidden sm:inline" />
              <select
                value={roleParam}
                onChange={(e) => updateQueryParam("role", e.target.value)}
                className="text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                aria-label="Filter by role"
              >
                <option value="all">All Roles</option>
                <option value="superadmin">Super Admin</option>
                <option value="organization-owner">Organization Owner</option>
                <option value="workspaceadmin">Workspace Admin</option>
                <option value="member">Member</option>
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusParam}
              onChange={(e) => updateQueryParam("status", e.target.value)}
              className="text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>

            {/* Presence Filter */}
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-gray-400 hidden sm:inline" />
              <select
                value={presenceParam}
                onChange={(e) => updateQueryParam("presence", e.target.value)}
                className="text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                aria-label="Filter by presence"
              >
                <option value="all">All Presence</option>
                <option value="online">Online now ({stats.onlineCount})</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            {/* Sort Select */}
            <select
              value={sortParam}
              onChange={(e) => updateQueryParam("sort", e.target.value)}
              className="text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
              aria-label="Sort users"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="lastActive">Sort: Last active</option>
            </select>

            {/* Page Size selector */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setSearchParams(
                  (prev) => {
                    const next = new URLSearchParams(prev);
                    next.set("page", "1");
                    return next;
                  },
                  { replace: true }
                );
              }}
              className="text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
              aria-label="Items per page"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shared MembersTable */}
      <MembersTable
        users={tableData}
        loading={loading}
        error={error}
        currentUserId={currentUserId || undefined}
        showOrganizationColumn={true}
        showWorkspaceColumn={true}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRowClick={(row) => setSelectedDrawerUserId(row._id)}
        allowedRowActions={{
          viewProfile: true,
          moveWorkspace: false,
          changeRole: false,
          toggleStatus: true,
          remove: false,
        }}
        getRowActionRules={getRowActionRules}
        onViewProfile={(row) => setSelectedDrawerUserId(row._id)}
        onToggleStatus={handleRequestToggleStatus}
        page={pageParam}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        onRetry={fetchUsers}
      />

      {/* Member Details Drawer */}
      <MemberDrawer
        userId={selectedDrawerUserId}
        isOpen={Boolean(selectedDrawerUserId)}
        onClose={() => setSelectedDrawerUserId(null)}
      />

      {/* Confirm Status Toggle Modal */}
      {statusConfirmTarget && (
        <ConfirmDialog
          isOpen={Boolean(statusConfirmTarget)}
          title={
            statusConfirmTarget.status
              ? `Disable ${statusConfirmTarget.username}?`
              : `Enable ${statusConfirmTarget.username}?`
          }
          message={
            <div className="space-y-2 text-xs sm:text-sm text-gray-600">
              <p>
                Are you sure you want to{" "}
                <strong className="text-gray-900">
                  {statusConfirmTarget.status ? "disable" : "enable"}
                </strong>{" "}
                the account for{" "}
                <strong className="text-gray-900">{statusConfirmTarget.email}</strong>?
              </p>
              {statusConfirmTarget.status ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-amber-800 text-xs space-y-1">
                  <p className="font-semibold">Consequences of disabling:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>All active sessions and socket connections will be immediately terminated.</li>
                    <li>The user will be blocked from logging into the platform.</li>
                    <li>Their workspaces and existing data will remain preserved.</li>
                  </ul>
                </div>
              ) : (
                <p className="text-emerald-700 text-xs">
                  The user will be able to log in and regain access to their assigned workspaces immediately.
                </p>
              )}
            </div>
          }
          confirmLabel={
            statusConfirmTarget.status ? "Disable User" : "Enable User"
          }
          cancelLabel="Cancel"
          isDestructive={statusConfirmTarget.status}
          isLoading={statusUpdating}
          onConfirm={handleConfirmToggleStatus}
          onCancel={() => setStatusConfirmTarget(null)}
        />
      )}
    </div>
  );
};

export default Users;
