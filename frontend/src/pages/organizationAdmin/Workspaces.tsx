import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Building2,
  Plus,
  Search,
  MoreVertical,
  ExternalLink,
  Eye,
  Edit2,
  UserCheck,
  Archive,
  PauseCircle,
  PlayCircle,
  Trash2,
  AlertTriangle,
  RotateCw,
  Sparkles,
  ArrowUpDown,
  X,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  getMyWorkspaces,
  updateWorkspace,
  deleteWorkspace,
} from "../../services/workspaceServices";
import type { IWorkspaceItem } from "../../services/workspaceServices";
import { API_ROUTES } from "../../constants/Api_Routes";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import { formatRelativeTime, formatAbsoluteTime } from "../../components/common/formatters";
import WorkspaceModal from "../../components/organizationAdmin/workspaces/WorkspaceModal";
import WorkspaceDetailDrawer from "../../components/organizationAdmin/workspaces/WorkspaceDetailDrawer";
import AssignAdminModal from "../../components/organizationAdmin/workspaces/AssignAdminModal";
import WorkspaceConsequenceModal from "../../components/organizationAdmin/workspaces/WorkspaceConsequenceModal";
import type { ConsequenceActionType } from "../../components/organizationAdmin/workspaces/WorkspaceConsequenceModal";

export const Workspaces: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query parameters
  const searchQuery = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "all";
  const sortBy = searchParams.get("sort") || "newest";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  // Search input local state for debouncing
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Workspaces data state
  const [workspaces, setWorkspaces] = useState<IWorkspaceItem[]>([]);
  const [totalWorkspaces, setTotalWorkspaces] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [planUsage, setPlanUsage] = useState<{
    current: number;
    max: number | null;
    isLimitReached: boolean;
  }>({ current: 0, max: null, isLimitReached: false });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Drawer & Modals state
  const [selectedWorkspace, setSelectedWorkspace] = useState<IWorkspaceItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState<boolean>(false);
  const [editingWorkspace, setEditingWorkspace] = useState<IWorkspaceItem | null>(null);

  const [isAssignAdminModalOpen, setIsAssignAdminModalOpen] = useState<boolean>(false);
  const [assignAdminWorkspace, setAssignAdminWorkspace] = useState<IWorkspaceItem | null>(null);

  const [consequenceModal, setConsequenceModal] = useState<{
    isOpen: boolean;
    actionType: ConsequenceActionType | null;
    workspace: IWorkspaceItem | null;
    isLoading: boolean;
  }>({ isOpen: false, actionType: null, workspace: null, isLoading: false });

  // Open action dropdown menu per row
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Update URL params helper
  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (value === null || value === "" || (key === "page" && value === "1") || (key === "status" && value === "all") || (key === "sort" && value === "newest")) {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        });
        return next;
      });
    },
    [setSearchParams]
  );

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        updateQuery({ search: searchInput.trim() || null, page: "1" });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, searchQuery, updateQuery]);

  // Keep search input synced if URL search changes from outside
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Close open dropdown menu on click outside or escape
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-actions-menu]")) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  // Fetch workspaces
  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyWorkspaces(
        currentPage,
        10,
        searchQuery,
        statusFilter,
        sortBy
      );
      if (res && res.data) {
        setWorkspaces(res.data.workspaces || []);
        setTotalWorkspaces(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.planUsage) {
          setPlanUsage(res.data.planUsage);
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load workspaces.");
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, sortBy]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Handlers for Row & Drawer
  const handleRowClick = (ws: IWorkspaceItem) => {
    setSelectedWorkspace(ws);
    setIsDrawerOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingWorkspace(null);
    setIsWorkspaceModalOpen(true);
  };

  const handleOpenEditModal = (ws: IWorkspaceItem) => {
    setEditingWorkspace(ws);
    setIsWorkspaceModalOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenAssignAdminModal = (ws: IWorkspaceItem) => {
    setAssignAdminWorkspace(ws);
    setIsAssignAdminModalOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenConsequenceModal = (
    actionType: ConsequenceActionType,
    ws: IWorkspaceItem
  ) => {
    setActiveMenuId(null);
    setConsequenceModal({
      isOpen: true,
      actionType,
      workspace: ws,
      isLoading: false,
    });
  };

  // Perform status update or delete with optimistic rollback
  const executeConsequenceAction = async () => {
    const { actionType, workspace } = consequenceModal;
    if (!actionType || !workspace) return;

    setConsequenceModal((prev) => ({ ...prev, isLoading: true }));

    // Keep rollback backup
    const prevWorkspaces = [...workspaces];

    try {
      if (actionType === "delete") {
        // Optimistic delete
        setWorkspaces((prev) => prev.filter((w) => w._id !== workspace._id));
        setTotalWorkspaces((prev) => Math.max(0, prev - 1));

        await deleteWorkspace(workspace._id);
        showToast(`Workspace "${workspace.workspaceName}" has been permanently deleted.`);

        if (selectedWorkspace?._id === workspace._id) {
          setIsDrawerOpen(false);
          setSelectedWorkspace(null);
        }
      } else {
        // Status toggle
        let newStatus: "active" | "suspended" | "archived" = "active";
        if (actionType === "archive") newStatus = "archived";
        else if (actionType === "suspend") newStatus = "suspended";
        else if (actionType === "restore" || actionType === "reactivate") newStatus = "active";

        // Optimistic status update
        setWorkspaces((prev) =>
          prev.map((w) => (w._id === workspace._id ? { ...w, status: newStatus } : w))
        );
        if (selectedWorkspace?._id === workspace._id) {
          setSelectedWorkspace((prev) => (prev ? { ...prev, status: newStatus } : null));
        }

        await updateWorkspace(workspace._id, { status: newStatus });
        showToast(
          `Workspace "${workspace.workspaceName}" status changed to ${newStatus}.`
        );
      }

      setConsequenceModal({ isOpen: false, actionType: null, workspace: null, isLoading: false });
      fetchWorkspaces();
    } catch (err: any) {
      // Rollback on error
      setWorkspaces(prevWorkspaces);
      showToast(
        err?.response?.data?.message || err?.message || "Failed to update workspace status.",
        "error"
      );
      setConsequenceModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Clear all filters helper
  const handleClearFilters = () => {
    setSearchInput("");
    updateQuery({ search: null, status: null, sort: null, page: "1" });
  };

  const statusBadgeConfig = {
    active: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Active" },
    suspended: { bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", label: "Suspended" },
    archived: { bg: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400", label: "Archived" },
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast alert */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-xs sm:text-sm font-medium animate-in slide-in-from-bottom-3 duration-200 ${
            toast.type === "success"
              ? "bg-white border-emerald-200 text-emerald-800"
              : "bg-white border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Workspaces
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {planUsage.max !== null
                ? `${planUsage.current} of ${planUsage.max} used`
                : `${totalWorkspaces} ${totalWorkspaces === 1 ? "workspace" : "workspaces"}`}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            Manage your organization's workspaces, assigned teams, rooms, and administrators.
          </p>
        </div>

        {/* Add Workspace CTA */}
        <div className="flex items-center gap-3">
          {planUsage.isLimitReached ? (
            <div className="relative group inline-block">
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-400 text-xs sm:text-sm font-medium cursor-not-allowed border border-gray-200 shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Workspace</span>
              </button>
              {/* Tooltip & Upgrade CTA */}
              <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col w-64 p-3 bg-gray-900 text-white rounded-xl shadow-xl z-20 text-xs animate-in fade-in duration-150">
                <div className="font-semibold text-gray-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Workspace limit reached
                </div>
                <p className="mt-1 text-gray-300 text-[11px] leading-relaxed">
                  You have reached the maximum allowed workspaces for your plan ({planUsage.max}).
                </p>
                <Link
                  to="/organization-owner/subscriptions"
                  className="mt-2 text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 text-[11px]"
                >
                  <span>Upgrade your subscription</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-medium transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Workspace</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and search controls bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search input (debounced 300ms, searches name, slug, adminEmail) */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search workspaces by name, slug, or admin email..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-indigo-100 focus:outline-none focus:ring-3 transition-colors bg-white text-gray-900"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateQuery({ search: null, page: "1" });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters and sorting */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status filter tabs */}
          <div className="inline-flex p-1 bg-gray-100 rounded-xl text-xs font-medium text-gray-600">
            {[
              { id: "all", label: "All" },
              { id: "active", label: "Active" },
              { id: "suspended", label: "Suspended" },
              { id: "archived", label: "Archived" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => updateQuery({ status: tab.id, page: "1" })}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-white text-gray-900 font-semibold shadow-xs"
                    : "hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={sortBy}
              onChange={(e) => updateQuery({ sort: e.target.value, page: "1" })}
              className="pl-3 pr-8 py-1.5 text-xs font-medium rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none shadow-2xs"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A–Z)</option>
              <option value="members">Most Members</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 pointer-events-none" />
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => fetchWorkspaces()}
            disabled={loading}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            title="Refresh table"
            aria-label="Refresh workspaces"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Workspaces Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          /* Skeleton loading rows */
          <div className="p-6 space-y-4">
            <div className="h-6 bg-gray-100 rounded-md w-1/4 animate-pulse mb-6" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-gray-100 rounded w-1/3 animate-pulse" />
                    <div className="h-2.5 bg-gray-50 rounded w-1/4 animate-pulse" />
                  </div>
                </div>
                <div className="h-4 bg-gray-100 rounded w-20 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-28 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-16 animate-pulse" />
                <div className="h-8 bg-gray-100 rounded-xl w-20 animate-pulse" />
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Failed to load workspaces</h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-4">{error}</p>
            <button
              type="button"
              onClick={fetchWorkspaces}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : workspaces.length === 0 ? (
          /* Empty / No Results State */
          searchQuery || statusFilter !== "all" ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">No matching workspaces</h3>
              <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                No workspaces matched your search "{searchQuery}" or status filter.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium cursor-pointer shadow-2xs"
              >
                <span>Clear filters</span>
              </button>
            </div>
          ) : (
            <EmptyState
              icon={Building2}
              title="No workspaces yet"
              description="Create your first workspace to start organizing teams, lounges, and collaborative rooms."
              actionLabel="Add Workspace"
              onAction={handleOpenAddModal}
              actionIcon={Plus}
              className="border-none py-16"
            />
          )
        ) : (
          /* Table Container: card grows with content, horizontal scroll on mobile only */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50/60 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 pl-6 pr-3">Workspace</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">Admin</th>
                  <th className="py-3.5 px-3">Members</th>
                  <th className="py-3.5 px-3">Rooms</th>
                  <th className="py-3.5 px-3">Online</th>
                  <th className="py-3.5 px-3">Last Activity</th>
                  <th className="py-3.5 px-3">Created</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                {workspaces.map((ws) => {
                  const statusConfig = statusBadgeConfig[ws.status] || statusBadgeConfig.active;

                  return (
                    <tr
                      key={ws._id}
                      onClick={() => handleRowClick(ws)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Workspace: Avatar + Name + Slug */}
                      <td className="py-3.5 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            {ws.workspaceName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                              {ws.workspaceName}
                            </div>
                            <div className="font-mono text-[11px] text-gray-400 truncate">
                              /{ws.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusConfig.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                          {statusConfig.label}
                        </span>
                      </td>

                      {/* Admin */}
                      <td className="py-3.5 px-3">
                        {ws.workspaceAdminEmail ? (
                          <div className="min-w-0 max-w-[160px]">
                            <div className="font-medium text-gray-900 truncate">
                              {ws.workspaceAdminName || "Admin"}
                            </div>
                            <div className="text-[11px] text-gray-400 truncate" title={ws.workspaceAdminEmail}>
                              {ws.workspaceAdminEmail}
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAssignAdminModal(ws);
                            }}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                          >
                            Assign admin
                          </button>
                        )}
                      </td>

                      {/* Members */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-gray-900">
                          {ws.membersCount}
                          {ws.membersLimit && (
                            <span className="text-[11px] font-normal text-gray-400 ml-1">
                              / {ws.membersLimit}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Rooms */}
                      <td className="py-3.5 px-3">
                        <span className="font-medium text-gray-800">{ws.roomsCount}</span>
                      </td>

                      {/* Online Now */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              ws.onlineNow > 0 ? "bg-emerald-500 animate-pulse" : "bg-gray-300"
                            }`}
                          />
                          <span className="font-semibold text-gray-900">{ws.onlineNow}</span>
                        </div>
                      </td>

                      {/* Last Activity */}
                      <td className="py-3.5 px-3">
                        <span
                          className="text-gray-500"
                          title={ws.lastActivityAt ? formatAbsoluteTime(ws.lastActivityAt) : "No activity"}
                        >
                          {ws.lastActivityAt ? formatRelativeTime(ws.lastActivityAt) : "Never"}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="py-3.5 px-3 text-gray-400 text-[11px]">
                        {new Date(ws.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-3 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Primary "Open" button */}
                          <Link
                            to={API_ROUTES.ORGANIZATION_ADMIN.NAV.WORKSPACE_DETAIL(ws._id)}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>

                          {/* "..." dropdown menu */}
                          <div className="relative" data-actions-menu>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMenuId((current) => (current === ws._id ? null : ws._id))
                              }
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              aria-label="Workspace actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuId === ws._id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-30 text-xs text-gray-700 divide-y divide-gray-100 animate-in fade-in duration-100">
                                <div className="py-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleRowClick(ws);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2.5 font-medium cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-gray-400" />
                                    <span>View Details</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(ws)}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2.5 font-medium cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAssignAdminModal(ws)}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2.5 font-medium cursor-pointer"
                                  >
                                    <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                                    <span>Assign / Change Admin</span>
                                  </button>
                                </div>

                                <div className="py-1">
                                  {ws.status === "archived" ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenConsequenceModal("restore", ws)}
                                      className="w-full px-3 py-2 text-left hover:bg-emerald-50 text-emerald-700 flex items-center gap-2.5 font-medium cursor-pointer"
                                    >
                                      <Archive className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Restore Workspace</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenConsequenceModal("archive", ws)}
                                      className="w-full px-3 py-2 text-left hover:bg-gray-50 text-gray-700 flex items-center gap-2.5 font-medium cursor-pointer"
                                    >
                                      <Archive className="w-3.5 h-3.5 text-gray-400" />
                                      <span>Archive Workspace</span>
                                    </button>
                                  )}

                                  {ws.status === "suspended" ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenConsequenceModal("reactivate", ws)}
                                      className="w-full px-3 py-2 text-left hover:bg-emerald-50 text-emerald-700 flex items-center gap-2.5 font-medium cursor-pointer"
                                    >
                                      <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Reactivate Workspace</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenConsequenceModal("suspend", ws)}
                                      className="w-full px-3 py-2 text-left hover:bg-amber-50 text-amber-700 flex items-center gap-2.5 font-medium cursor-pointer"
                                    >
                                      <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                                      <span>Suspend Workspace</span>
                                    </button>
                                  )}
                                </div>

                                <div className="py-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenConsequenceModal("delete", ws)}
                                    className="w-full px-3 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2.5 font-medium cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Unified Pagination Footer */}
        {!loading && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalWorkspaces}
            pageSize={10}
            onPageChange={(p) => updateQuery({ page: String(p) })}
          />
        )}
      </div>

      {/* Workspace Detail Drawer */}
      <WorkspaceDetailDrawer
        workspace={selectedWorkspace}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onEdit={(ws) => {
          setIsDrawerOpen(false);
          handleOpenEditModal(ws);
        }}
        onAssignAdmin={(ws) => {
          setIsDrawerOpen(false);
          handleOpenAssignAdminModal(ws);
        }}
      />

      {/* Add / Edit Workspace Modal */}
      <WorkspaceModal
        isOpen={isWorkspaceModalOpen}
        workspace={editingWorkspace}
        onClose={() => setIsWorkspaceModalOpen(false)}
        onSuccess={() => {
          showToast(
            editingWorkspace
              ? "Workspace updated successfully."
              : "Workspace created successfully."
          );
          fetchWorkspaces();
        }}
      />

      {/* Assign / Change Admin Modal */}
      <AssignAdminModal
        isOpen={isAssignAdminModalOpen}
        workspace={assignAdminWorkspace}
        onClose={() => setIsAssignAdminModalOpen(false)}
        onSuccess={(updatedAdminEmail) => {
          showToast(`Admin invitation sent to ${updatedAdminEmail}.`);
          fetchWorkspaces();
        }}
      />

      {/* Consequence Modal (Archive / Suspend / Reactivate / Delete) */}
      <WorkspaceConsequenceModal
        isOpen={consequenceModal.isOpen}
        actionType={consequenceModal.actionType}
        workspace={consequenceModal.workspace}
        isLoading={consequenceModal.isLoading}
        onClose={() =>
          setConsequenceModal({ isOpen: false, actionType: null, workspace: null, isLoading: false })
        }
        onConfirm={executeConsequenceAction}
      />
    </div>
  );
};

export default Workspaces;
