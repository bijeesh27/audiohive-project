import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  Calendar,
  Megaphone,
  Activity,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { API_ROUTES } from "../../../constants/Api_Routes";
import { useDirectChat } from "../../../context/useDirectChat";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const location = useLocation();
  const { workspaceOptions, workspaceId } = useAuth();
  const { unreadCount: dmUnread } = useDirectChat();

  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    try {
      return localStorage.getItem("audiohive_admin_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      const next = !internalCollapsed;
      setInternalCollapsed(next);
      try {
        localStorage.setItem("audiohive_admin_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
    }
  };

  const currentWorkspace = workspaceOptions?.find((w) => w._id === workspaceId);
  const workspaceDisplayName = currentWorkspace?.workspaceName || "Workspace Admin";

  const navItems = [
    { name: "Dashboard", path: API_ROUTES.WORKSPACE_ADMIN.NAV.DASHBOARD, icon: LayoutDashboard },
    { name: "Users", path: API_ROUTES.WORKSPACE_ADMIN.NAV.GET_USERS, icon: Users },
    { name: "Rooms", path: API_ROUTES.WORKSPACE_ADMIN.NAV.ROOMS, icon: DoorOpen },
    { name: "Meetings", path: API_ROUTES.WORKSPACE_ADMIN.NAV.MEETINGS, icon: Calendar },
    { name: "Chat", path: API_ROUTES.WORKSPACE_ADMIN.NAV.CHAT, icon: MessageSquare, badge: dmUnread },
    { name: "Announcements", path: API_ROUTES.WORKSPACE_ADMIN.NAV.ANNOUNCEMENTS, icon: Megaphone },
    { name: "Activity Logs", path: API_ROUTES.WORKSPACE_ADMIN.NAV.ACTIVITY_LOGS, icon: Activity },
  ];

  return (
    <aside
      aria-label="Admin Navigation Sidebar"
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } bg-white border-r border-gray-200 flex-shrink-0 hidden md:flex flex-col h-full transition-all duration-200 select-none`}
    >
      {/* Brand & Workspace Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-xs">
            <span className="text-white font-bold text-sm tracking-wider">AH</span>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <span className="text-sm font-bold text-gray-900 block truncate">AudioHive</span>
              <div className="flex items-center gap-1 text-[11px] font-medium text-gray-500 truncate" title={workspaceDisplayName}>
                <Building2 className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                <span className="truncate">{workspaceDisplayName}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav list */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-1.5" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.path}
                title={isCollapsed ? item.name : undefined}
                className={`relative flex items-center ${
                  isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
                } rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? "bg-indigo-50/80 text-indigo-900 font-semibold shadow-xs"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {/* Active Indigo Accent Bar */}
                {isActive && (
                  <span
                    className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-600 rounded-r-full"
                    aria-hidden="true"
                  />
                )}

                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                  }`}
                  aria-hidden="true"
                />

                {!isCollapsed && <span className="flex-1 truncate">{item.name}</span>}

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`${
                      isCollapsed
                        ? "absolute -top-1 -right-1"
                        : "relative"
                    } bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-xs`}
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-gray-100 flex items-center justify-between">
        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`flex items-center ${
            isCollapsed ? "justify-center w-full" : "justify-between w-full px-2"
          } py-2 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors`}
        >
          {!isCollapsed && <span className="text-[11px] text-gray-400">Collapse menu</span>}
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>
    </aside>
  );
}
