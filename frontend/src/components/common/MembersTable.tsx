import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Eye,
  Shield,
  UserCheck,
  UserX,
  UserMinus,
  Layers,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  RotateCcw,
  Users as UsersIcon,
  Building2,
} from "lucide-react";
import { API_ROUTES } from "../../constants/Api_Routes";

export interface WorkspaceRef {
  _id: string;
  workspaceName: string;
}

export interface MemberRowData {
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
  workspaces?: WorkspaceRef[];
  workspaceIds?: Array<string | WorkspaceRef>;
  workspaceId?: string | WorkspaceRef;
  isSoleAdmin?: boolean;
  soleAdminWorkspaceNames?: string[];
  isOwner?: boolean;
  organization?: {
    _id: string;
    companyName: string;
    slug: string;
  } | null;
  organizationId?: string;
  organizationName?: string;
}

export type SortField = "name" | "role" | "status" | "rooms" | "lastActive" | "joined";
export type SortOrder = "asc" | "desc";

export interface RowActionRules {
  canViewProfile?: boolean;
  canMoveWorkspace?: boolean;
  moveWorkspaceDisabledReason?: string;
  canChangeRole?: boolean;
  changeRoleDisabledReason?: string;
  canToggleStatus?: boolean;
  toggleStatusDisabledReason?: string;
  canRemove?: boolean;
  removeDisabledReason?: string;
}

export interface MembersTableProps {
  users: MemberRowData[];
  loading?: boolean;
  error?: string | null;
  currentUserId?: string;
  currentUserEmail?: string;
  showWorkspaceColumn?: boolean;
  showOrganizationColumn?: boolean;
  workspaceLinkBase?: string;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onRowClick?: (user: MemberRowData) => void;
  // Row actions
  allowedRowActions?: {
    viewProfile?: boolean;
    moveWorkspace?: boolean;
    changeRole?: boolean;
    toggleStatus?: boolean;
    remove?: boolean;
  };
  getRowActionRules?: (user: MemberRowData) => RowActionRules;
  onViewProfile?: (user: MemberRowData) => void;
  onMoveWorkspace?: (user: MemberRowData) => void;
  onChangeRole?: (user: MemberRowData) => void;
  onToggleStatus?: (user: MemberRowData) => void;
  onRemove?: (user: MemberRowData) => void;
  // Footer / Pagination
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize?: number;
  onPageChange: (newPage: number) => void;
  // State props
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  onRetry?: () => void;
  removeActionLabel?: string; // e.g. "Remove from Organization" or "Remove from Workspace"
}

export const formatRoleBadge = (role: string): string => {
  const normalized = role?.toLowerCase() || "";
  if (normalized === "superadmin" || normalized === "super-admin") {
    return "Super Admin";
  }
  if (normalized === "workspaceadmin" || normalized === "workspace-admin" || normalized === "admin") {
    return "Workspace Admin";
  }
  if (normalized === "organization-owner" || normalized === "owner") {
    return "Organization Owner";
  }
  if (normalized === "member") {
    return "Member";
  }
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Member";
};

export const formatRelativeTime = (iso: string | null | undefined): string => {
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

export const formatFullDate = (iso: string | null | undefined): string => {
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

export const formatJoinedDate = (iso: string | null | undefined): string => {
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

export const MembersTable: React.FC<MembersTableProps> = ({
  users,
  loading = false,
  error = null,
  currentUserId,
  currentUserEmail,
  showWorkspaceColumn = false,
  showOrganizationColumn = false,
  sortField,
  sortOrder,
  onSort,
  onRowClick,
  allowedRowActions = {
    viewProfile: true,
    moveWorkspace: true,
    changeRole: true,
    toggleStatus: true,
    remove: true,
  },
  getRowActionRules,
  onViewProfile,
  onMoveWorkspace,
  onChangeRole,
  onToggleStatus,
  onRemove,
  page,
  totalPages,
  totalCount,
  pageSize = 10,
  onPageChange,
  hasActiveFilters = false,
  onClearFilters,
  onRetry,
  removeActionLabel = "Remove from Organization",
}) => {
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close open action menu on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-row-menu]")) {
        setOpenMenuUserId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenuUserId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const startRecord = (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

  const renderSortIndicator = (field: SortField) => {
    if (sortField === field) {
      return sortOrder === "asc" ? (
        <ArrowUp className="w-3.5 h-3.5 text-indigo-600 inline" />
      ) : (
        <ArrowDown className="w-3.5 h-3.5 text-indigo-600 inline" />
      );
    }
    return <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-gray-400 inline" />;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
      {/* Horizontal scroll container on mobile only; no nested vertical scrollbar */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200/80 bg-gray-50/75 text-gray-600 font-medium">
              {/* Member */}
              <th scope="col" className="py-3.5 pl-6 pr-4 font-semibold text-gray-700">
                <button
                  type="button"
                  onClick={() => onSort("name")}
                  className="inline-flex items-center gap-1.5 hover:text-gray-900 focus:outline-none group cursor-pointer"
                  title="Sort by Member Name"
                >
                  <span>Member</span>
                  {renderSortIndicator("name")}
                </button>
              </th>

              {/* Organization column */}
              {showOrganizationColumn && (
                <th scope="col" className="py-3.5 px-4 font-semibold text-gray-700">
                  <span>Organization</span>
                </th>
              )}

              {/* Workspace column */}
              {showWorkspaceColumn && (
                <th scope="col" className="py-3.5 px-4 font-semibold text-gray-700">
                  <span>Workspace</span>
                </th>
              )}

              {/* Role */}
              <th scope="col" className="py-3.5 px-4 font-semibold text-gray-700">
                <button
                  type="button"
                  onClick={() => onSort("role")}
                  className="inline-flex items-center gap-1.5 hover:text-gray-900 focus:outline-none group cursor-pointer"
                  title="Sort by Role"
                >
                  <span>Role</span>
                  {renderSortIndicator("role")}
                </button>
              </th>

              {/* Status */}
              <th scope="col" className="py-3.5 px-4 font-semibold text-gray-700">
                <button
                  type="button"
                  onClick={() => onSort("status")}
                  className="inline-flex items-center gap-1.5 hover:text-gray-900 focus:outline-none group cursor-pointer"
                  title="Sort by Status"
                >
                  <span>Status</span>
                  {renderSortIndicator("status")}
                </button>
              </th>

              {/* Last Active */}
              <th scope="col" className="py-3.5 px-4 font-semibold text-gray-700">
                <button
                  type="button"
                  onClick={() => onSort("lastActive")}
                  className="inline-flex items-center gap-1.5 hover:text-gray-900 focus:outline-none group cursor-pointer"
                  title="Sort by Last Active Time"
                >
                  <span>Last Active</span>
                  {renderSortIndicator("lastActive")}
                </button>
              </th>

              {/* Joined */}
              <th scope="col" className="py-3.5 px-4 font-semibold text-gray-700">
                <button
                  type="button"
                  onClick={() => onSort("joined")}
                  className="inline-flex items-center gap-1.5 hover:text-gray-900 focus:outline-none group cursor-pointer"
                  title="Sort by Joined Date"
                >
                  <span>Joined</span>
                  {renderSortIndicator("joined")}
                </button>
              </th>

              {/* Actions */}
              <th scope="col" className="py-3.5 pl-4 pr-6 text-right font-semibold text-gray-700">
                <span>Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {/* Loading Skeleton */}
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  <td className="py-4 pl-6 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                      <div className="space-y-1.5">
                        <div className="w-28 h-4 bg-gray-200 rounded" />
                        <div className="w-36 h-3 bg-gray-100 rounded" />
                      </div>
                    </div>
                  </td>
                  {showOrganizationColumn && (
                    <td className="py-4 px-4">
                      <div className="w-24 h-5 bg-gray-200 rounded-md" />
                    </td>
                  )}
                  {showWorkspaceColumn && (
                    <td className="py-4 px-4">
                      <div className="w-24 h-5 bg-gray-200 rounded-md" />
                    </td>
                  )}
                  <td className="py-4 px-4">
                    <div className="w-16 h-6 bg-gray-200 rounded-full" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="w-16 h-6 bg-gray-200 rounded-full" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="w-20 h-4 bg-gray-200 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="w-20 h-4 bg-gray-200 rounded" />
                  </td>
                  <td className="py-4 pl-4 pr-6 text-right">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg ml-auto" />
                  </td>
                </tr>
              ))
            ) : error ? (
              /* Error State */
              <tr>
                <td
                  colSpan={6 + (showWorkspaceColumn ? 1 : 0) + (showOrganizationColumn ? 1 : 0)}
                  className="py-12 text-center"
                >
                  <div className="max-w-sm mx-auto space-y-3">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                    <h3 className="text-base font-semibold text-gray-900">Failed to load users</h3>
                    <p className="text-xs sm:text-sm text-gray-500">{error}</p>
                    {onRetry && (
                      <button
                        type="button"
                        onClick={onRetry}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Retry
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              /* Empty / No-Results State */
              <tr>
                <td
                  colSpan={6 + (showWorkspaceColumn ? 1 : 0) + (showOrganizationColumn ? 1 : 0)}
                  className="py-16 text-center"
                >
                  <div className="max-w-sm mx-auto space-y-3">
                    <UsersIcon className="w-12 h-12 text-gray-300 mx-auto" />
                    <h3 className="text-base font-semibold text-gray-900">
                      {hasActiveFilters ? "No matching members found" : "No users yet"}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {hasActiveFilters
                        ? "Try clearing your search query or adjusting the filters."
                        : "There are currently no members in your organization."}
                    </p>
                    {hasActiveFilters && onClearFilters && (
                      <button
                        type="button"
                        onClick={onClearFilters}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              /* User Rows */
              users.map((user) => {
                const isCurrentUser =
                  user._id === currentUserId ||
                  (currentUserEmail && user.email?.toLowerCase() === currentUserEmail.toLowerCase());
                const roleText = formatRoleBadge(user.role);
                const isAdmin = roleText === "Admin";
                const isOwner = user.isOwner || roleText === "Owner";

                // Resolve default action rules or custom rules
                const defaultRules: RowActionRules = {
                  canViewProfile: true,
                  canMoveWorkspace: !isOwner,
                  moveWorkspaceDisabledReason: isOwner ? "Cannot modify workspaces for the owner account" : undefined,
                  canChangeRole: !isOwner && !user.isSoleAdmin && !isCurrentUser,
                  changeRoleDisabledReason: isOwner
                    ? "Cannot change the owner's role"
                    : isCurrentUser
                    ? "You cannot change your own role"
                    : user.isSoleAdmin
                    ? `Sole administrator of ${user.soleAdminWorkspaceNames?.join(", ") || "workspace"}`
                    : undefined,
                  canToggleStatus: !isOwner && !user.isSoleAdmin && !isCurrentUser,
                  toggleStatusDisabledReason: isOwner
                    ? "Cannot disable the owner account"
                    : isCurrentUser
                    ? "You cannot disable your own account"
                    : user.isSoleAdmin
                    ? `Sole administrator of ${user.soleAdminWorkspaceNames?.join(", ") || "workspace"}`
                    : undefined,
                  canRemove: !isOwner && !user.isSoleAdmin && !isCurrentUser,
                  removeDisabledReason: isOwner
                    ? "Cannot remove the owner account"
                    : isCurrentUser
                    ? "You cannot remove your own account"
                    : user.isSoleAdmin
                    ? `Sole administrator of ${user.soleAdminWorkspaceNames?.join(", ") || "workspace"}`
                    : undefined,
                };

                const actionRules: RowActionRules = getRowActionRules
                  ? { ...defaultRules, ...getRowActionRules(user) }
                  : defaultRules;

                // Resolve workspaces for badge display
                const resolvedWorkspaces: WorkspaceRef[] = user.workspaces?.length
                  ? user.workspaces
                  : Array.isArray(user.workspaceIds)
                  ? (user.workspaceIds.filter((w) => typeof w !== "string") as WorkspaceRef[])
                  : [];

                return (
                  <tr
                    key={user._id}
                    onClick={() => onRowClick && onRowClick(user)}
                    className="group hover:bg-indigo-50/20 transition-colors cursor-pointer"
                  >
                    {/* Member Cell: Avatar, Name, Email, Presence Dot */}
                    <td className="py-3.5 pl-6 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-indigo-100 to-indigo-200 text-indigo-800 font-bold text-xs border border-indigo-200/60 shadow-2xs">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                              user.isOnline ? "bg-emerald-500" : "bg-gray-300"
                            }`}
                            title={user.isOnline ? "Online" : "Offline"}
                            aria-label={user.isOnline ? "User is online" : "User is offline"}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {user.username}
                            </span>
                            {isCurrentUser && (
                              <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded">
                                You
                              </span>
                            )}
                            {user.isSoleAdmin && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 rounded"
                                title={`Sole administrator of: ${user.soleAdminWorkspaceNames?.join(", ")}`}
                              >
                                Primary Admin
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Organization Column */}
                    {showOrganizationColumn && (
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        {user.organization ? (
                          <Link
                            to={`/superadmin/organizations/${user.organization._id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50/80 text-purple-700 hover:bg-purple-100 hover:text-purple-800 border border-purple-200/60 transition-colors"
                            title={`View organization: ${user.organization.companyName}`}
                          >
                            <Building2 className="w-3 h-3 text-purple-500 shrink-0" />
                            <span className="truncate max-w-[130px] font-medium">
                              {user.organization.companyName}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-xs font-medium text-gray-400 italic">
                            Platform
                          </span>
                        )}
                      </td>
                    )}

                    {/* Workspace Column */}
                    {showWorkspaceColumn && (
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {resolvedWorkspaces.length > 0 ? (
                            resolvedWorkspaces.map((ws) => (
                              <Link
                                key={ws._id}
                                to={API_ROUTES.ORGANIZATION_ADMIN.NAV.WORKSPACE_DETAIL(ws._id)}
                                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 border border-indigo-200/60 transition-colors"
                                title={`View workspace: ${ws.workspaceName}`}
                              >
                                {ws.workspaceName}
                              </Link>
                            ))
                          ) : isOwner ? (
                            <span className="text-xs font-semibold text-gray-400">
                              –
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-gray-400 italic">
                              Unassigned
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Role Cell: Badge */}
                    <td className="py-3.5 px-4">
                      {(() => {
                        const isSuperAdmin =
                          user.role?.toLowerCase() === "superadmin" ||
                          user.role?.toLowerCase() === "super-admin";
                        let badgeClass = "bg-gray-100 text-gray-700 border-gray-200";
                        let iconColor = "text-gray-500";
                        if (isSuperAdmin) {
                          badgeClass = "bg-purple-50 text-purple-700 border-purple-200/80";
                          iconColor = "text-purple-600";
                        } else if (isOwner) {
                          badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200/80";
                          iconColor = "text-indigo-600";
                        } else if (isAdmin) {
                          badgeClass = "bg-blue-50 text-blue-700 border-blue-200/80";
                          iconColor = "text-blue-600";
                        }
                        return (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}
                          >
                            {(isAdmin || isOwner || isSuperAdmin) && (
                              <Shield className={`w-3 h-3 ${iconColor}`} />
                            )}
                            <span>{roleText}</span>
                          </span>
                        );
                      })()}
                    </td>

                    {/* Status Cell: Badge with Dot */}
                    <td className="py-3.5 px-4">
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

                    {/* Last Active: Relative time, Full date on hover */}
                    <td className="py-3.5 px-4">
                      <span
                        className="text-xs sm:text-sm text-gray-600 cursor-default hover:text-gray-900 transition-colors"
                        title={formatFullDate(user.lastActiveAt)}
                      >
                        {formatRelativeTime(user.lastActiveAt)}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 px-4">
                      <span
                        className="text-xs sm:text-sm text-gray-600 cursor-default"
                        title={user.joinedAt ? new Date(user.joinedAt).toLocaleString() : ""}
                      >
                        {formatJoinedDate(user.joinedAt)}
                      </span>
                    </td>

                    {/* Actions Cell: "..." dropdown menu */}
                    <td
                      className="py-3.5 pl-4 pr-6 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative inline-block text-left" data-row-menu>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuUserId(openMenuUserId === user._id ? null : user._id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                          aria-label={`Open actions for ${user.username}`}
                          aria-haspopup="true"
                          aria-expanded={openMenuUserId === user._id}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {openMenuUserId === user._id && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 mt-1.5 w-56 rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-black/5 z-30 divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100 text-left"
                            role="menu"
                            aria-orientation="vertical"
                          >
                            <div className="py-1">
                              {/* 1. View Profile */}
                              {allowedRowActions.viewProfile && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuUserId(null);
                                    if (onViewProfile) onViewProfile(user);
                                    else if (onRowClick) onRowClick(user);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                  role="menuitem"
                                >
                                  <Eye className="w-4 h-4 text-gray-500" />
                                  <span>View Profile</span>
                                </button>
                              )}

                              {/* 2. Move to Workspace / Manage Workspaces */}
                              {allowedRowActions.moveWorkspace && (
                                actionRules.canMoveWorkspace ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuUserId(null);
                                      if (onMoveWorkspace) onMoveWorkspace(user);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                    role="menuitem"
                                  >
                                    <Layers className="w-4 h-4 text-indigo-600" />
                                    <span>Move to Workspace</span>
                                  </button>
                                ) : (
                                  <div
                                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-400 flex items-center gap-2.5 cursor-not-allowed opacity-60"
                                    title={actionRules.moveWorkspaceDisabledReason || "Action not allowed"}
                                    role="menuitem"
                                    aria-disabled="true"
                                  >
                                    <Layers className="w-4 h-4 text-gray-400" />
                                    <span>Move to Workspace</span>
                                  </div>
                                )
                              )}

                              {/* 3. Change Role */}
                              {allowedRowActions.changeRole && (
                                actionRules.canChangeRole ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuUserId(null);
                                      if (onChangeRole) onChangeRole(user);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                    role="menuitem"
                                  >
                                    <Shield className="w-4 h-4 text-indigo-600" />
                                    <span>
                                      {isAdmin ? "Change Role (Make Member)" : "Change Role (Make Admin)"}
                                    </span>
                                  </button>
                                ) : (
                                  <div
                                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-400 flex items-center gap-2.5 cursor-not-allowed opacity-60"
                                    title={actionRules.changeRoleDisabledReason || "Action not allowed"}
                                    role="menuitem"
                                    aria-disabled="true"
                                  >
                                    <Shield className="w-4 h-4 text-gray-400" />
                                    <span>Change Role</span>
                                  </div>
                                )
                              )}
                            </div>

                            <div className="py-1">
                              {/* 4. Disable / Enable User */}
                              {allowedRowActions.toggleStatus && (
                                actionRules.canToggleStatus ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuUserId(null);
                                      if (onToggleStatus) onToggleStatus(user);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-xs sm:text-sm flex items-center gap-2.5 transition-colors cursor-pointer ${
                                      user.status
                                        ? "text-amber-700 hover:bg-amber-50"
                                        : "text-emerald-700 hover:bg-emerald-50"
                                    }`}
                                    role="menuitem"
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
                                ) : (
                                  <div
                                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-400 flex items-center gap-2.5 cursor-not-allowed opacity-60"
                                    title={actionRules.toggleStatusDisabledReason || "Action not allowed"}
                                    role="menuitem"
                                    aria-disabled="true"
                                  >
                                    <UserX className="w-4 h-4 text-gray-400" />
                                    <span>{user.status ? "Disable User" : "Enable User"}</span>
                                  </div>
                                )
                              )}

                              {/* 5. Remove User */}
                              {allowedRowActions.remove && (
                                actionRules.canRemove ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuUserId(null);
                                      if (onRemove) onRemove(user);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                    role="menuitem"
                                  >
                                    <UserMinus className="w-4 h-4 text-red-500" />
                                    <span>{removeActionLabel}</span>
                                  </button>
                                ) : (
                                  <div
                                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-400 flex items-center gap-2.5 cursor-not-allowed opacity-60"
                                    title={actionRules.removeDisabledReason || "Action not allowed"}
                                    role="menuitem"
                                    aria-disabled="true"
                                  >
                                    <UserMinus className="w-4 h-4 text-gray-400" />
                                    <span>{removeActionLabel}</span>
                                  </div>
                                )
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

      {/* ── Single Footer & Pagination: Hidden if only 1 page ── */}
      {!error && totalPages > 1 && (
        <div className="border-t border-gray-200/80 px-6 py-4 flex items-center justify-between bg-white">
          <p className="text-xs sm:text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{startRecord}</span>-
            <span className="font-semibold text-gray-900">{endRecord}</span> of{" "}
            <span className="font-semibold text-gray-900">{totalCount}</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Next page"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersTable;
