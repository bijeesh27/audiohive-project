import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  DoorOpen,
  Calendar,
  Clock,
  MoreVertical,
  Edit2,
  UserCheck,
  PauseCircle,
  PlayCircle,
  Archive,
  RotateCw,
  Trash2,
  Copy,
  Check,
  Search,
  UserMinus,
  ShieldCheck,
  Radio,
  ExternalLink,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  UserX,
  Sparkles,
} from "lucide-react";
import {
  getWorkspace,
  getWorkspaceOverview,
  getWorkspaceRooms,
  getWorkspaceActivities,
  getWorkspaceUsers,
  updateWorkspace,
  deleteWorkspace,
  updateWorkspaceUserRole,
  updateWorkspaceUserStatus,
  removeWorkspaceUser,
} from "../../services/workspaceServices";
import type {
  IWorkspaceItem,
  IWorkspaceOverview,
  IWorkspaceRoom,
  IWorkspaceActivityItem,
} from "../../services/workspaceServices";
import { API_ROUTES } from "../../constants/Api_Routes";
import { formatRelativeTime, formatAbsoluteTime } from "../../components/common/formatters";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import ConfirmModal from "../../components/common/ConfirmModal";
import WorkspaceModal from "../../components/organizationAdmin/workspaces/WorkspaceModal";
import AssignAdminModal from "../../components/organizationAdmin/workspaces/AssignAdminModal";
import WorkspaceConsequenceModal from "../../components/organizationAdmin/workspaces/WorkspaceConsequenceModal";
import type { ConsequenceActionType } from "../../components/organizationAdmin/workspaces/WorkspaceConsequenceModal";
import { MemberDrawer } from "../../components/workspaceAdmin/dashboard/MemberDrawer";

interface WorkspaceMemberRecord {
  _id: string;
  userId: string;
  username: string;
  email: string;
  role: string;
  status: boolean;
  isOnline: boolean;
  roomsCount: number;
  lastActiveAt: string | null;
  joinedAt: string;
}

type TabType = "overview" | "members" | "rooms" | "activity";

export const WorkspaceDetailsPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab state (synced with URL query: ?tab=overview|members|rooms|activity)
  const currentTab = (searchParams.get("tab") as TabType) || "overview";
  const setTab = useCallback(
    (tab: TabType) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("tab", tab);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Core workspace & overview state
  const [workspace, setWorkspace] = useState<IWorkspaceItem | null>(null);
  const [overview, setOverview] = useState<IWorkspaceOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Derived metrics and plan usage with fallback to avoid undefined access
  const overviewStats = useMemo(() => {
    const s = overview?.metrics || overview?.stats;
    return {
      membersCount: s?.membersCount ?? workspace?.membersCount ?? 0,
      membersLimit: s?.membersLimit ?? workspace?.membersLimit ?? null,
      onlineNow: s?.onlineNow ?? workspace?.onlineNow ?? 0,
      roomsCount: s?.roomsCount ?? workspace?.roomsCount ?? 0,
      roomsLimit: s?.roomsLimit ?? null,
      meetingsCount:
        (s as unknown as { meetingsCount?: number; meetingsCount30d?: number })?.meetingsCount ??
        (s as unknown as { meetingsCount?: number; meetingsCount30d?: number })?.meetingsCount30d ??
        workspace?.meetingsCount30d ??
        0,
      meetingDuration:
        (s as unknown as { meetingDurationFormatted?: string; meetingDuration30d?: string })
          ?.meetingDurationFormatted ??
        (s as unknown as { meetingDurationFormatted?: string; meetingDuration30d?: string })
          ?.meetingDuration30d ??
        workspace?.meetingDuration30d ??
        "0m",
    };
  }, [overview, workspace]);

  const planUsageData = useMemo(() => {
    const pu = overview?.planUsage;
    const pl = overview?.planLimits;
    const membersCurrent = pu?.members?.current ?? overviewStats.membersCount;
    const membersMax = pu?.members?.max ?? pl?.maxUsers ?? null;
    const membersPct =
      pu?.members?.percentage ?? (membersMax ? Math.round((membersCurrent / membersMax) * 100) : 0);

    const roomsCurrent = pu?.rooms?.current ?? overviewStats.roomsCount;
    const roomsMax = pu?.rooms?.max ?? pl?.maxRooms ?? null;
    const roomsPct =
      pu?.rooms?.percentage ?? (roomsMax ? Math.round((roomsCurrent / roomsMax) * 100) : 0);

    return {
      planName: pu?.planName || pl?.planName || "Active Plan",
      membersCurrent,
      membersMax,
      membersPct,
      roomsCurrent,
      roomsMax,
      roomsPct,
    };
  }, [overview, overviewStats]);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Copied IDs feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyToClipboard = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  // Header Dropdown menu state
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState<boolean>(false);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isAssignAdminModalOpen, setIsAssignAdminModalOpen] = useState<boolean>(false);
  const [consequenceAction, setConsequenceAction] = useState<ConsequenceActionType | null>(null);
  const [isConsequenceLoading, setIsConsequenceLoading] = useState<boolean>(false);

  // Drawer state for inspecting member
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isMemberDrawerOpen, setIsMemberDrawerOpen] = useState<boolean>(false);

  // Tab 2: Members state
  const [members, setMembers] = useState<WorkspaceMemberRecord[]>([]);
  const [membersLoading, setMembersLoading] = useState<boolean>(false);
  const [membersTotal, setMembersTotal] = useState<number>(0);
  const [membersTotalPages, setMembersTotalPages] = useState<number>(1);
  const [memberPage, setMemberPage] = useState<number>(1);
  const [memberSearch, setMemberSearch] = useState<string>("");
  const [memberRoleFilter, setMemberRoleFilter] = useState<string>("all");
  const [memberStatusFilter, setMemberStatusFilter] = useState<string>("all");
  const [memberSort, setMemberSort] = useState<string>("newest");
  const [activeUserMenuId, setActiveUserMenuId] = useState<string | null>(null);

  // Member Action Confirm Modals
  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    isDanger?: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    isDanger: false,
    onConfirm: async () => {},
  });
  const [isConfirmActionLoading, setIsConfirmActionLoading] = useState<boolean>(false);

  // Tab 3: Rooms state
  const [rooms, setRooms] = useState<IWorkspaceRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState<boolean>(false);

  // Tab 4: Activities state
  const [activities, setActivities] = useState<IWorkspaceActivityItem[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState<boolean>(false);
  const [activityPage, setActivityPage] = useState<number>(1);
  const [activityTotal, setActivityTotal] = useState<number>(0);
  const [activityTotalPages, setActivityTotalPages] = useState<number>(1);
  const [activitySearch, setActivitySearch] = useState<string>("");

  // 1. Fetch Workspace & Overview
  const fetchOverviewData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      setError(null);

      const [wsRes, overviewRes] = await Promise.all([
        getWorkspace(workspaceId),
        getWorkspaceOverview(workspaceId, 30),
      ]);

      if (wsRes?.data) {
        setWorkspace(wsRes.data);
      }
      if (overviewRes?.data) {
        const ov = overviewRes.data;
        setOverview(ov);
        if (ov.workspace) {
          const s = ov.metrics || ov.stats;
          setWorkspace((prev) => ({
            ...(prev || ({} as IWorkspaceItem)),
            ...ov.workspace,
            membersCount: s?.membersCount ?? prev?.membersCount ?? 0,
            membersLimit: s?.membersLimit ?? prev?.membersLimit ?? null,
            roomsCount: s?.roomsCount ?? prev?.roomsCount ?? 0,
            onlineNow: s?.onlineNow ?? prev?.onlineNow ?? 0,
            lastActivityAt: prev?.lastActivityAt || null,
            meetingsCount30d:
              (s as unknown as { meetingsCount?: number; meetingsCount30d?: number })?.meetingsCount ??
              (s as unknown as { meetingsCount?: number; meetingsCount30d?: number })?.meetingsCount30d ??
              prev?.meetingsCount30d ??
              0,
            meetingDuration30d:
              (s as unknown as { meetingDurationFormatted?: string; meetingDuration30d?: string })
                ?.meetingDurationFormatted ??
              (s as unknown as { meetingDurationFormatted?: string; meetingDuration30d?: string })
                ?.meetingDuration30d ??
              prev?.meetingDuration30d ??
              "0m",
          }));
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e?.message || "Failed to load workspace details.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  // 2. Fetch Members when Members tab is active or filters change
  const fetchMembersList = useCallback(async () => {
    if (!workspaceId || currentTab !== "members") return;
    try {
      setMembersLoading(true);
      const res = await getWorkspaceUsers(
        workspaceId,
        memberPage,
        10,
        memberSearch,
        memberRoleFilter,
        memberStatusFilter,
        memberSort === "name" ? "username" : memberSort === "joined" ? "createdAt" : "createdAt",
        memberSort === "oldest" ? "asc" : "desc"
      );

      const data = res.data || {};
      setMembers(data.users || []);
      setMembersTotal(data.total || 0);
      setMembersTotalPages(data.totalPages || 1);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(e?.response?.data?.message || "Failed to load workspace members.", "error");
    } finally {
      setMembersLoading(false);
    }
  }, [workspaceId, currentTab, memberPage, memberSearch, memberRoleFilter, memberStatusFilter, memberSort, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembersList();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchMembersList]);

  // 3. Fetch Rooms when Rooms tab is active
  const fetchRoomsList = useCallback(async () => {
    if (!workspaceId || currentTab !== "rooms") return;
    try {
      setRoomsLoading(true);
      const res = await getWorkspaceRooms(workspaceId);
      const roomsData = (res as { data?: IWorkspaceRoom[] | { rooms?: IWorkspaceRoom[] } })?.data;
      if (Array.isArray(roomsData)) {
        setRooms(roomsData);
      } else if (roomsData && Array.isArray(roomsData.rooms)) {
        setRooms(roomsData.rooms);
      } else {
        setRooms([]);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(e?.response?.data?.message || "Failed to load workspace rooms.", "error");
    } finally {
      setRoomsLoading(false);
    }
  }, [workspaceId, currentTab, showToast]);

  useEffect(() => {
    fetchRoomsList();
  }, [fetchRoomsList]);

  // 4. Fetch Activities when Activity tab is active
  const fetchActivitiesList = useCallback(async () => {
    if (!workspaceId || currentTab !== "activity") return;
    try {
      setActivitiesLoading(true);
      const res = await getWorkspaceActivities(workspaceId, activityPage, 10, activitySearch);
      if (res.data) {
        setActivities(res.data.activities || []);
        setActivityTotal(res.data.total || 0);
        setActivityTotalPages(res.data.totalPages || 1);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(e?.response?.data?.message || "Failed to load workspace activities.", "error");
    } finally {
      setActivitiesLoading(false);
    }
  }, [workspaceId, currentTab, activityPage, activitySearch, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActivitiesList();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchActivitiesList]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-menu-container]")) {
        setIsHeaderMenuOpen(false);
        setActiveUserMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Handlers for Workspace Lifecycle (Suspend/Archive/Delete) ---
  const handleConsequenceConfirm = async () => {
    if (!workspace || !consequenceAction) return;

    try {
      setIsConsequenceLoading(true);
      if (consequenceAction === "delete") {
        await deleteWorkspace(workspace._id);
        showToast(`Workspace "${workspace.workspaceName}" was permanently deleted.`);
        navigate(API_ROUTES.ORGANIZATION_ADMIN.NAV.WORKSPACES);
        return;
      }

      let newStatus: "active" | "suspended" | "archived" = "active";
      if (consequenceAction === "suspend") newStatus = "suspended";
      else if (consequenceAction === "archive") newStatus = "archived";
      else if (consequenceAction === "reactivate" || consequenceAction === "restore") newStatus = "active";

      await updateWorkspace(workspace._id, { status: newStatus });
      setWorkspace((prev) => (prev ? { ...prev, status: newStatus } : null));
      showToast(`Workspace "${workspace.workspaceName}" status changed to ${newStatus}.`);
      setConsequenceAction(null);
      fetchOverviewData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(e?.response?.data?.message || "Action failed.", "error");
    } finally {
      setIsConsequenceLoading(false);
    }
  };

  // --- Handlers for Member Actions ---
  const isCurrentAdmin = useCallback(
    (memberEmail: string) => {
      if (!workspace?.workspaceAdminEmail) return false;
      return memberEmail.toLowerCase() === workspace.workspaceAdminEmail.toLowerCase();
    },
    [workspace?.workspaceAdminEmail]
  );

  const handleToggleMemberRole = (member: WorkspaceMemberRecord) => {
    setActiveUserMenuId(null);
    const targetRole = member.role.toLowerCase() === "member" ? "workspaceadmin" : "member";
    const actionLabel = targetRole === "workspaceadmin" ? "Make Admin" : "Make Member";

    if (targetRole === "member" && isCurrentAdmin(member.email)) {
      showToast("Cannot demote the designated workspace administrator. Please assign another admin first.", "error");
      return;
    }

    setConfirmModalData({
      isOpen: true,
      title: `${actionLabel} - ${member.username}`,
      message: `Are you sure you want to change ${member.username}'s role to ${
        targetRole === "workspaceadmin" ? "Workspace Administrator" : "Workspace Member"
      }?`,
      confirmLabel: actionLabel,
      isDanger: false,
      onConfirm: async () => {
        try {
          setIsConfirmActionLoading(true);
          await updateWorkspaceUserRole(workspace!._id, member._id, targetRole);
          showToast(`Updated ${member.username}'s role to ${targetRole}.`);
          setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
          fetchMembersList();
        } catch (err: unknown) {
          const e = err as { response?: { data?: { message?: string } }; message?: string };
          showToast(e?.response?.data?.message || "Failed to update member role.", "error");
        } finally {
          setIsConfirmActionLoading(false);
        }
      },
    });
  };

  const handleToggleMemberStatus = (member: WorkspaceMemberRecord) => {
    setActiveUserMenuId(null);
    const nextStatus = !member.status;
    const actionLabel = nextStatus ? "Enable User" : "Disable User";

    if (!nextStatus && isCurrentAdmin(member.email)) {
      showToast("Cannot disable the designated workspace administrator. Please assign another admin first.", "error");
      return;
    }

    setConfirmModalData({
      isOpen: true,
      title: `${actionLabel} - ${member.username}`,
      message: nextStatus
        ? `Are you sure you want to re-enable ${member.username}? They will regain access to this workspace.`
        : `Are you sure you want to disable ${member.username}? They will lose access to meetings, chat, and files until re-enabled.`,
      confirmLabel: actionLabel,
      isDanger: !nextStatus,
      onConfirm: async () => {
        try {
          setIsConfirmActionLoading(true);
          await updateWorkspaceUserStatus(workspace!._id, member._id, nextStatus);
          showToast(`${member.username} has been ${nextStatus ? "enabled" : "disabled"}.`);
          setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
          fetchMembersList();
        } catch (err: unknown) {
          const e = err as { response?: { data?: { message?: string } }; message?: string };
          showToast(e?.response?.data?.message || "Failed to update member status.", "error");
        } finally {
          setIsConfirmActionLoading(false);
        }
      },
    });
  };

  const handleRemoveMember = (member: WorkspaceMemberRecord) => {
    setActiveUserMenuId(null);

    if (isCurrentAdmin(member.email)) {
      showToast("Cannot remove the designated workspace administrator. Please assign another admin first.", "error");
      return;
    }

    setConfirmModalData({
      isOpen: true,
      title: `Remove ${member.username} from Workspace`,
      message: `Are you sure you want to remove ${member.username} (${member.email}) from ${workspace?.workspaceName}? They will immediately lose access to all rooms, chats, and data in this workspace.`,
      confirmLabel: "Remove Member",
      isDanger: true,
      onConfirm: async () => {
        try {
          setIsConfirmActionLoading(true);
          await removeWorkspaceUser(workspace!._id, member._id);
          showToast(`${member.username} was removed from this workspace.`);
          setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
          fetchMembersList();
          fetchOverviewData();
        } catch (err: unknown) {
          const e = err as { response?: { data?: { message?: string } }; message?: string };
          showToast(e?.response?.data?.message || "Failed to remove member.", "error");
        } finally {
          setIsConfirmActionLoading(false);
        }
      },
    });
  };

  // Helper for Status Badge
  const renderStatusBadge = (status?: string) => {
    const s = status?.toLowerCase() || "active";
    if (s === "active") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Active
        </span>
      );
    }
    if (s === "suspended") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Suspended
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        Archived
      </span>
    );
  };

  // Clean Role formatter
  const formatRoleBadge = (role: string) => {
    const r = role.toLowerCase().replace(/[-_]/g, "");
    const isAdmin = r.includes("admin");
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isAdmin
            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
            : "bg-slate-100 text-slate-700 border border-slate-200"
        }`}
      >
        {isAdmin ? "Admin" : "Member"}
      </span>
    );
  };

  // Plan usage bar color
  const getUsageBarColor = (pct: number) => {
    if (pct >= 100) return "bg-red-500";
    if (pct >= 80) return "bg-amber-500";
    return "bg-indigo-600";
  };

  if (loading && !workspace) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-gray-500">Loading workspace details...</p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Failed to Load Workspace</h3>
          <p className="text-sm text-gray-500 max-w-sm">{error || "Workspace not found."}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchOverviewData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            <RotateCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
          <Link
            to={API_ROUTES.ORGANIZATION_ADMIN.NAV.WORKSPACES}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Workspaces</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Toast Alert */}
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
            ✕
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link
              to={API_ROUTES.ORGANIZATION_ADMIN.NAV.WORKSPACES}
              aria-label="Back to workspaces"
              className="mt-1 p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            {/* Workspace Avatar */}
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              {workspace.workspaceName.charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  {workspace.workspaceName}
                </h1>
                {renderStatusBadge(workspace.status)}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm text-gray-500">
                <span className="font-mono text-gray-400">slug:</span>
                <span className="font-mono text-gray-700 font-medium">{workspace.slug}</span>
                <span className="text-gray-300">•</span>
                <span title={formatAbsoluteTime(workspace.createdAt)}>
                  Created {formatRelativeTime(workspace.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-2xs"
            >
              <Edit2 className="w-4 h-4 text-gray-500" />
              <span>Edit</span>
            </button>

            {/* Dropdown Menu */}
            <div className="relative" data-menu-container>
              <button
                type="button"
                onClick={() => setIsHeaderMenuOpen((prev) => !prev)}
                aria-expanded={isHeaderMenuOpen}
                aria-label="Workspace actions"
                className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer shadow-2xs"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isHeaderMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-gray-100 shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsHeaderMenuOpen(false);
                      setIsAssignAdminModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-indigo-500" />
                    <span>Change Admin</span>
                  </button>

                  <div className="my-1 border-t border-gray-100" />

                  {workspace.status === "suspended" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setConsequenceAction("reactivate");
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-emerald-700 hover:bg-emerald-50 transition-colors text-left cursor-pointer"
                    >
                      <PlayCircle className="w-4 h-4 text-emerald-600" />
                      <span>Reactivate Workspace</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setConsequenceAction("suspend");
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-amber-700 hover:bg-amber-50 transition-colors text-left cursor-pointer"
                    >
                      <PauseCircle className="w-4 h-4 text-amber-600" />
                      <span>Suspend Workspace</span>
                    </button>
                  )}

                  {workspace.status === "archived" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setConsequenceAction("restore");
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                    >
                      <RotateCw className="w-4 h-4 text-gray-500" />
                      <span>Restore Workspace</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setConsequenceAction("archive");
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                    >
                      <Archive className="w-4 h-4 text-gray-500" />
                      <span>Archive Workspace</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-gray-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsHeaderMenuOpen(false);
                      setConsequenceAction("delete");
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span>Delete Workspace</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 mt-6 pt-4 border-t border-gray-100 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setTab("overview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0 ${
              currentTab === "overview"
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("members")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0 ${
              currentTab === "members"
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Members</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                currentTab === "members"
                  ? "bg-indigo-200/70 text-indigo-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {overviewStats.membersCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab("rooms")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0 ${
              currentTab === "rooms"
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <DoorOpen className="w-4 h-4" />
            <span>Rooms</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                currentTab === "rooms"
                  ? "bg-indigo-200/70 text-indigo-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {overviewStats.roomsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab("activity")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0 ${
              currentTab === "activity"
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Activity</span>
          </button>
        </div>
      </div>

      {/* ──────────────── TAB 1: OVERVIEW ──────────────── */}
      {currentTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* 5 KPI Chips */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Members */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-medium">Members</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {overviewStats.membersCount}
                {overviewStats.membersLimit ? (
                  <span className="text-xs font-normal text-gray-400 ml-1">
                    / {overviewStats.membersLimit} limit
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Assigned workspace users</p>
            </div>

            {/* Online Now */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-medium">Online Now</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-gray-900">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>{overviewStats.onlineNow}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Active participants in rooms</p>
            </div>

            {/* Rooms */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-medium">Rooms</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <DoorOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {overviewStats.roomsCount}
                {overviewStats.roomsLimit ? (
                  <span className="text-xs font-normal text-gray-400 ml-1">
                    / {overviewStats.roomsLimit} limit
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Configured collaborative rooms</p>
            </div>

            {/* Meetings (30d) */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-medium">Meetings (30d)</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {overviewStats.meetingsCount}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Sessions conducted in last 30d</p>
            </div>

            {/* Meeting Time (30d) */}
            <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-medium">Total Meeting Time</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {overviewStats.meetingDuration}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Cumulative duration in 30d</p>
            </div>
          </div>

          {/* Details Card & Plan Usage */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Details Card (2 columns) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Workspace Details</h3>
                <span className="text-xs text-gray-400">Scoped to organization</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100">
                  <span className="text-xs text-gray-400 block mb-1">Workspace Slug</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs sm:text-sm font-medium text-gray-800">
                      {workspace.slug}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(workspace.slug, "slug")}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                      title="Copy slug"
                    >
                      {copiedKey === "slug" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100">
                  <span className="text-xs text-gray-400 block mb-1">Designated Admin</span>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-800">
                        {workspace.workspaceAdminName || workspace.workspaceAdminEmail || "Unassigned"}
                      </p>
                      {workspace.workspaceAdminEmail && (
                        <p className="text-[11px] text-gray-500">{workspace.workspaceAdminEmail}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAssignAdminModalOpen(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100">
                  <span className="text-xs text-gray-400 block mb-1">Created At</span>
                  <p
                    className="text-xs sm:text-sm font-medium text-gray-800"
                    title={formatAbsoluteTime(workspace.createdAt)}
                  >
                    {formatAbsoluteTime(workspace.createdAt)}
                    <span className="text-gray-400 text-xs ml-1.5 font-normal">
                      ({formatRelativeTime(workspace.createdAt)})
                    </span>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100">
                  <span className="text-xs text-gray-400 block mb-1">Last Updated</span>
                  <p
                    className="text-xs sm:text-sm font-medium text-gray-800"
                    title={formatAbsoluteTime(workspace.updatedAt)}
                  >
                    {formatAbsoluteTime(workspace.updatedAt)}
                    <span className="text-gray-400 text-xs ml-1.5 font-normal">
                      ({formatRelativeTime(workspace.updatedAt)})
                    </span>
                  </p>
                </div>
              </div>

              {/* Compact De-emphasized IDs row with copy buttons */}
              <div className="mt-4 pt-3.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Org ID:</span>
                  <span className="font-mono text-gray-600 text-[11px]">
                    {workspace.organizationId || overview?.workspace.organizationId || ""}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        workspace.organizationId || overview?.workspace.organizationId || "",
                        "orgId"
                      )
                    }
                    className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                    title="Copy Organization ID"
                  >
                    {copiedKey === "orgId" ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Workspace ID:</span>
                  <span className="font-mono text-gray-600 text-[11px]">{workspace._id}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(workspace._id, "wsId")}
                    className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                    title="Copy Workspace ID"
                  >
                    {copiedKey === "wsId" ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Plan Usage Section */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Plan Quota & Usage</h3>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
                    {planUsageData.planName}
                  </span>
                </div>

                {/* Members bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-medium">Members Limit</span>
                    <span className="font-semibold text-gray-900">
                      {planUsageData.membersCurrent}
                      {planUsageData.membersMax ? ` / ${planUsageData.membersMax}` : " (Unlimited)"}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getUsageBarColor(
                        planUsageData.membersPct
                      )}`}
                      style={{
                        width: `${Math.min(planUsageData.membersPct, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span>{planUsageData.membersPct}% utilized</span>
                    {planUsageData.membersPct >= 80 && (
                      <span className="text-amber-600 font-medium">Approaching plan limit</span>
                    )}
                  </div>
                </div>

                {/* Rooms bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-medium">Rooms Limit</span>
                    <span className="font-semibold text-gray-900">
                      {planUsageData.roomsCurrent}
                      {planUsageData.roomsMax ? ` / ${planUsageData.roomsMax}` : " (Unlimited)"}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getUsageBarColor(
                        planUsageData.roomsPct
                      )}`}
                      style={{
                        width: `${Math.min(planUsageData.roomsPct, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span>{planUsageData.roomsPct}% utilized</span>
                    {planUsageData.roomsPct >= 80 && (
                      <span className="text-amber-600 font-medium">Approaching plan limit</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100">
                <Link
                  to={API_ROUTES.ORGANIZATION_ADMIN.NAV.SUBSCRIPTION}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200/50 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Manage Subscription</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Mini Activity Chart */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Activity & Meeting Trends (30 Days)</h3>
                <p className="text-xs text-gray-500 mt-0.5">Daily breakdown of user operations and video sessions</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                  <span className="text-gray-600 font-medium">Actions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                  <span className="text-gray-600 font-medium">Meetings</span>
                </div>
              </div>
            </div>

            {overview?.activityChart && overview.activityChart.length > 0 ? (
              <div className="h-44 flex items-end gap-1 sm:gap-2 pt-4">
                {overview.activityChart.map((point, idx) => {
                  const maxVal = Math.max(
                    ...overview.activityChart.map((p) => Math.max(p.actions, p.meetings)),
                    1
                  );
                  const actionsHeight = Math.max((point.actions / maxVal) * 100, 4);
                  const meetingsHeight = Math.max((point.meetings / maxVal) * 100, 4);

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative"
                    >
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute bottom-full mb-2 z-20 flex flex-col items-center bg-gray-900 text-white rounded-lg p-2 text-[10px] whitespace-nowrap shadow-lg transition-opacity">
                        <span className="font-semibold">{point.date}</span>
                        <span>{point.actions} actions</span>
                        <span>{point.meetings} meetings</span>
                      </div>

                      <div className="w-full flex items-end justify-center gap-0.5 h-full">
                        <div
                          className="w-1.5 sm:w-2 bg-indigo-400 group-hover:bg-indigo-600 rounded-t-xs transition-colors"
                          style={{ height: `${actionsHeight}%` }}
                        />
                        <div
                          className="w-1.5 sm:w-2 bg-purple-400 group-hover:bg-purple-600 rounded-t-xs transition-colors"
                          style={{ height: `${meetingsHeight}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-gray-400 mt-2 truncate w-full text-center">
                        {idx % 5 === 0 ? point.label : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-gray-400">
                No activity data recorded in the last 30 days.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: MEMBERS ──────────────── */}
      {currentTab === "members" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search member by name or email..."
                value={memberSearch}
                onChange={(e) => {
                  setMemberSearch(e.target.value);
                  setMemberPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Role filter */}
              <select
                value={memberRoleFilter}
                onChange={(e) => {
                  setMemberRoleFilter(e.target.value);
                  setMemberPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="workspaceadmin">Admins</option>
                <option value="member">Members</option>
              </select>

              {/* Status filter */}
              <select
                value={memberStatusFilter}
                onChange={(e) => {
                  setMemberStatusFilter(e.target.value);
                  setMemberPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>

              {/* Sort filter */}
              <select
                value={memberSort}
                onChange={(e) => setMemberSort(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
              </select>

              <button
                type="button"
                onClick={fetchMembersList}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                title="Refresh members"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 font-medium">
                    <th className="py-3.5 px-4 font-semibold text-gray-700">Member</th>
                    <th className="py-3.5 px-4 font-semibold text-gray-700">Role</th>
                    <th className="py-3.5 px-4 font-semibold text-gray-700">Presence</th>
                    <th className="py-3.5 px-4 font-semibold text-gray-700">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-gray-700">Last Active</th>
                    <th className="py-3.5 px-4 font-semibold text-gray-700">Joined</th>
                    <th className="py-3.5 px-4 text-right font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {membersLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200" />
                            <div className="space-y-1.5">
                              <div className="w-24 h-3 rounded bg-gray-200" />
                              <div className="w-32 h-2.5 rounded bg-gray-100" />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4"><div className="w-16 h-5 rounded-full bg-gray-200" /></td>
                        <td className="py-3.5 px-4"><div className="w-14 h-4 rounded bg-gray-200" /></td>
                        <td className="py-3.5 px-4"><div className="w-14 h-5 rounded-full bg-gray-200" /></td>
                        <td className="py-3.5 px-4"><div className="w-20 h-3 rounded bg-gray-200" /></td>
                        <td className="py-3.5 px-4"><div className="w-20 h-3 rounded bg-gray-200" /></td>
                        <td className="py-3.5 px-4 text-right"><div className="w-6 h-6 rounded bg-gray-200 inline-block" /></td>
                      </tr>
                    ))
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12">
                        <EmptyState
                          icon={Users}
                          title="No Members Found"
                          description={
                            memberSearch
                              ? "No workspace members matched your search query."
                              : "This workspace does not currently have any assigned members."
                          }
                        />
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr
                        key={member._id}
                        onClick={() => {
                          setSelectedMemberId(member._id);
                          setIsMemberDrawerOpen(true);
                        }}
                        className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                      >
                        {/* Member avatar & names */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-100 to-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {member.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-gray-900 truncate">
                                  {member.username}
                                </span>
                                {isCurrentAdmin(member.email) && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-sm bg-indigo-100 text-indigo-800">
                                    Primary Admin
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 truncate block">
                                {member.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role badge */}
                        <td className="py-3.5 px-4">
                          {formatRoleBadge(member.role)}
                        </td>

                        {/* Presence */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                member.isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-300"
                              }`}
                            />
                            <span className="text-xs text-gray-600">
                              {member.isOnline ? "Online" : "Offline"}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              member.status
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {member.status ? "Active" : "Disabled"}
                          </span>
                        </td>

                        {/* Last Active */}
                        <td
                          className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap"
                          title={formatAbsoluteTime(member.lastActiveAt || undefined)}
                        >
                          {formatRelativeTime(member.lastActiveAt || undefined)}
                        </td>

                        {/* Joined Date */}
                        <td
                          className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap"
                          title={formatAbsoluteTime(member.joinedAt)}
                        >
                          {formatRelativeTime(member.joinedAt)}
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3.5 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative inline-block" data-menu-container>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveUserMenuId((prev) => (prev === member._id ? null : member._id))
                              }
                              aria-label={`Actions for ${member.username}`}
                              className="p-1.5 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeUserMenuId === member._id && (
                              <div className="absolute right-0 mt-1 w-48 rounded-2xl bg-white border border-gray-100 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 text-left">
                                <button
                                  type="button"
                                  onClick={() => handleToggleMemberRole(member)}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>
                                    {member.role.toLowerCase() === "member"
                                      ? "Make Workspace Admin"
                                      : "Make Member"}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleMemberStatus(member)}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer"
                                >
                                  {member.status ? (
                                    <>
                                      <UserX className="w-3.5 h-3.5 text-amber-500" />
                                      <span>Disable Account</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                      <span>Enable Account</span>
                                    </>
                                  )}
                                </button>

                                <div className="my-1 border-t border-gray-100" />

                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(member)}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                >
                                  <UserMinus className="w-3.5 h-3.5 text-red-500" />
                                  <span>Remove from Workspace</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer: hidden if single page */}
            <Pagination
              currentPage={memberPage}
              totalPages={membersTotalPages}
              onPageChange={setMemberPage}
              totalItems={membersTotal}
              pageSize={10}
            />
          </div>
        </div>
      )}

      {/* ──────────────── TAB 3: ROOMS ──────────────── */}
      {currentTab === "rooms" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Workspace Rooms</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Read-only overview of rooms established for team collaboration
              </p>
            </div>
            <button
              type="button"
              onClick={fetchRoomsList}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              title="Refresh rooms"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 font-medium">
                    <th className="py-3.5 px-4 font-semibold text-gray-700">Room Name</th>
                    <th className="py-3.5 px-4 font-semibold text-gray-700">Type</th>
                    <th className="py-3.5 px-4 font-semibold text-gray-700">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-gray-700">Members</th>
                    <th className="py-3.5 px-4 font-semibold text-gray-700">Online Now</th>
                    <th className="py-3.5 px-4 font-semibold text-gray-700">Last Activity</th>
                    <th className="py-3.5 px-4 font-semibold text-gray-700">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {roomsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3.5 px-4"><div className="w-32 h-4 rounded bg-gray-200" /></td>
                        <td className="py-3.5 px-4"><div className="w-16 h-5 rounded-full bg-gray-200" /></td>
                        <td className="py-3.5 px-4"><div className="w-14 h-5 rounded-full bg-gray-200" /></td>
                        <td className="py-3.5 px-4"><div className="w-10 h-4 rounded bg-gray-200" /></td>
                        <td className="py-3.5 px-4"><div className="w-10 h-4 rounded bg-gray-200" /></td>
                        <td className="py-3.5 px-4"><div className="w-20 h-3 rounded bg-gray-200" /></td>
                        <td className="py-3.5 px-4"><div className="w-20 h-3 rounded bg-gray-200" /></td>
                      </tr>
                    ))
                  ) : rooms.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12">
                        <EmptyState
                          icon={DoorOpen}
                          title="No Rooms Configured"
                          description="This workspace currently does not have any rooms."
                        />
                      </td>
                    </tr>
                  ) : (
                    rooms.map((room) => (
                      <tr key={room._id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            <DoorOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                            <span>{room.name}</span>
                            {room.isDefault && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                                Default
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-slate-100 text-slate-700 border border-slate-200">
                            {room.type}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              room.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {room.status === "active" ? "Active" : "Blocked"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-gray-700">
                          {room.membersCount}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            {room.onlineNow > 0 ? (
                              <>
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="font-semibold text-emerald-700">{room.onlineNow}</span>
                              </>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </div>
                        </td>

                        <td
                          className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap"
                          title={formatAbsoluteTime(room.lastActivityAt || undefined)}
                        >
                          {formatRelativeTime(room.lastActivityAt || undefined)}
                        </td>

                        <td
                          className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap"
                          title={formatAbsoluteTime(room.createdAt)}
                        >
                          {formatRelativeTime(room.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 4: ACTIVITY ──────────────── */}
      {currentTab === "activity" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Workspace Activity Feed</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Audit trail of changes, meetings, and member operations in this workspace
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter activities..."
                  value={activitySearch}
                  onChange={(e) => {
                    setActivitySearch(e.target.value);
                    setActivityPage(1);
                  }}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-44 sm:w-56"
                />
              </div>
              <Link
                to={`/organization-owner/activity-logs?workspaceId=${workspace._id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/60 text-indigo-700 text-xs font-semibold transition-colors"
              >
                <span>View all in Activity Logs</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={fetchActivitiesList}
                className="p-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                title="Refresh activities"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs divide-y divide-gray-100">
            {activitiesLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-500">Loading activity feed...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={Radio}
                  title="No Recent Activity"
                  description="No audit events have been logged for this workspace yet."
                />
              </div>
            ) : (
              activities.map((act) => (
                <div key={act._id} className="p-4 sm:p-5 flex items-start gap-3.5 hover:bg-gray-50/60 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {act.actorName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <p className="text-xs sm:text-sm text-gray-900 font-medium">
                        <span className="font-semibold">{act.actorName}</span>{" "}
                        <span className="text-gray-600">{act.action}</span>
                      </p>
                      <span
                        className="text-[11px] text-gray-400 shrink-0"
                        title={formatAbsoluteTime(act.occurredAt)}
                      >
                        {formatRelativeTime(act.occurredAt)}
                      </span>
                    </div>

                    {act.targetType && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                          {act.targetType}
                        </span>
                        {act.targetId && (
                          <span className="text-[10px] font-mono text-gray-400 truncate max-w-xs">
                            ID: {act.targetId}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Pagination for activities */}
            <Pagination
              currentPage={activityPage}
              totalPages={activityTotalPages}
              onPageChange={setActivityPage}
              totalItems={activityTotal}
              pageSize={10}
            />
          </div>
        </div>
      )}

      {/* ──────────────── MODALS & DRAWERS ──────────────── */}
      {/* 1. Edit Workspace Modal */}
      <WorkspaceModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        workspace={workspace}
        onSuccess={() => {
          setIsEditModalOpen(false);
          showToast("Workspace details updated successfully.");
          fetchOverviewData();
        }}
      />

      {/* 2. Assign / Change Admin Modal */}
      <AssignAdminModal
        isOpen={isAssignAdminModalOpen}
        onClose={() => setIsAssignAdminModalOpen(false)}
        workspace={workspace}
        onSuccess={(updatedAdminEmail) => {
          setIsAssignAdminModalOpen(false);
          showToast(`Admin assigned / invitation sent to ${updatedAdminEmail}.`);
          fetchOverviewData();
        }}
      />

      {/* 3. Consequence Action Modal (Suspend/Archive/Delete) */}
      <WorkspaceConsequenceModal
        isOpen={consequenceAction !== null}
        actionType={consequenceAction}
        workspace={workspace}
        onClose={() => setConsequenceAction(null)}
        onConfirm={handleConsequenceConfirm}
        isLoading={isConsequenceLoading}
      />

      {/* 4. Confirm Modal for User Actions (Role toggle, disable/enable, remove) */}
      <ConfirmModal
        isOpen={confirmModalData.isOpen}
        title={confirmModalData.title}
        message={confirmModalData.message}
        confirmLabel={confirmModalData.confirmLabel}
        isDanger={confirmModalData.isDanger}
        isLoading={isConfirmActionLoading}
        onCancel={() => setConfirmModalData((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalData.onConfirm}
      />

      {/* 5. Shared Member Drawer for inspecting user activity */}
      <MemberDrawer
        userId={selectedMemberId}
        isOpen={isMemberDrawerOpen}
        onClose={() => {
          setIsMemberDrawerOpen(false);
          setSelectedMemberId(null);
        }}
      />
    </div>
  );
};

export default WorkspaceDetailsPage;
