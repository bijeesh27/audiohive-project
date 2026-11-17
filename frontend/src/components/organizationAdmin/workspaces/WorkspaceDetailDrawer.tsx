import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { API_ROUTES } from "../../../constants/Api_Routes";
import {
  X,
  Users,
  DoorOpen,
  Wifi,
  Video,
  Clock,
  UserCheck,
  Calendar,
  ExternalLink,
  Edit3,
  Activity,
  ArrowRight,
} from "lucide-react";
import type { IWorkspaceItem } from "../../../services/workspaceServices";
import { formatRelativeTime, formatAbsoluteTime } from "../../common/formatters";

interface WorkspaceDetailDrawerProps {
  workspace: IWorkspaceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (workspace: IWorkspaceItem) => void;
  onAssignAdmin: (workspace: IWorkspaceItem) => void;
}

export const WorkspaceDetailDrawer: React.FC<WorkspaceDetailDrawerProps> = ({
  workspace,
  isOpen,
  onClose,
  onEdit,
  onAssignAdmin,
}) => {
  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !workspace) return null;

  const statusStyles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Active" },
    suspended: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Suspended" },
    archived: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400", label: "Archived" },
  };

  const currentStatus = statusStyles[workspace.status] || statusStyles.active;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-drawer-title"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-gray-100 transform transition-transform duration-300 ease-in-out">
          {/* Drawer Header */}
          <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-slate-50/50">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg shrink-0 shadow-xs">
                {workspace.workspaceName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2
                    id="workspace-drawer-title"
                    className="text-base font-bold text-gray-900 tracking-tight truncate"
                  >
                    {workspace.workspaceName}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${currentStatus.bg} ${currentStatus.text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`} />
                    {currentStatus.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs text-gray-500">
                    /{workspace.slug}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Created {new Date(workspace.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Description if present */}
            {workspace.description && (
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 leading-relaxed">
                {workspace.description}
              </div>
            )}

            {/* 30-Day Metrics Stats Grid */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                Workspace Health & 30-Day Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Members */}
                <div className="p-3.5 rounded-xl border border-gray-100 bg-white shadow-xs">
                  <div className="flex items-center justify-between text-gray-400 mb-1">
                    <span className="text-xs font-medium text-gray-500">Members</span>
                    <Users className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {workspace.membersCount}
                    {workspace.membersLimit && (
                      <span className="text-xs font-normal text-gray-400 ml-1">
                        / {workspace.membersLimit}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Assigned team accounts</div>
                </div>

                {/* Active Rooms */}
                <div className="p-3.5 rounded-xl border border-gray-100 bg-white shadow-xs">
                  <div className="flex items-center justify-between text-gray-400 mb-1">
                    <span className="text-xs font-medium text-gray-500">Rooms</span>
                    <DoorOpen className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {workspace.roomsCount}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Active rooms & lounge</div>
                </div>

                {/* Online Now */}
                <div className="p-3.5 rounded-xl border border-gray-100 bg-white shadow-xs">
                  <div className="flex items-center justify-between text-gray-400 mb-1">
                    <span className="text-xs font-medium text-gray-500">Online Now</span>
                    <Wifi className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      {workspace.onlineNow}
                    </span>
                    {workspace.onlineNow > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Active socket presence</div>
                </div>

                {/* Meetings Conducted (30D) */}
                <div className="p-3.5 rounded-xl border border-gray-100 bg-white shadow-xs">
                  <div className="flex items-center justify-between text-gray-400 mb-1">
                    <span className="text-xs font-medium text-gray-500">Meetings</span>
                    <Video className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {workspace.meetingsCount30d}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Conducted in 30d</div>
                </div>

                {/* Meeting Duration */}
                <div className="col-span-2 p-3.5 rounded-xl border border-gray-100 bg-white shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500">Total Meeting Time</div>
                      <div className="text-base font-bold text-gray-900">
                        {workspace.meetingDuration30d || "0m"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-500">Last Activity</div>
                    <div className="text-xs font-semibold text-gray-800" title={workspace.lastActivityAt ? formatAbsoluteTime(workspace.lastActivityAt) : "Never"}>
                      {formatRelativeTime(workspace.lastActivityAt || "")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Workspace Administrator
                </h3>
                <button
                  type="button"
                  onClick={() => onAssignAdmin(workspace)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  {workspace.workspaceAdminEmail ? "Change Admin" : "Assign Admin"}
                </button>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 bg-slate-50/60 flex items-center justify-between">
                {workspace.workspaceAdminEmail ? (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm shrink-0">
                      {(workspace.workspaceAdminName || workspace.workspaceAdminEmail).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-gray-900 truncate">
                        {workspace.workspaceAdminName || "Workspace Admin"}
                      </div>
                      <div className="text-[11px] text-gray-500 truncate">
                        {workspace.workspaceAdminEmail}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 text-xs text-gray-500">
                    <UserCheck className="w-4 h-4 text-gray-400" />
                    <span>No designated admin assigned yet</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onAssignAdmin(workspace)}
                  className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs"
                >
                  {workspace.workspaceAdminEmail ? "Change" : "Assign"}
                </button>
              </div>
            </div>

            {/* Recent Activity (Last 5 events) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Recent Activity (Last 5)
                </h3>
                <Link
                  to={`/organization-owner/activity-logs?workspaceId=${workspace._id}`}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {workspace.recentActivities && workspace.recentActivities.length > 0 ? (
                <div className="space-y-2">
                  {workspace.recentActivities.map((act) => (
                    <div
                      key={act._id}
                      className="p-3 rounded-xl border border-gray-100 bg-white flex items-start gap-3 text-xs"
                    >
                      <div className="p-1.5 rounded-lg bg-gray-50 text-gray-500 shrink-0 mt-0.5">
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {act.action.replace(/_/g, " ")}
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                          <span>{act.actorName}</span>
                          <span>•</span>
                          <span title={formatAbsoluteTime(act.occurredAt)}>
                            {formatRelativeTime(act.occurredAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
                  No activity recorded for this workspace yet.
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onEdit(workspace)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>

            <Link
              to={API_ROUTES.ORGANIZATION_ADMIN.NAV.WORKSPACE_DETAIL(workspace._id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <span>Open Workspace</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceDetailDrawer;
