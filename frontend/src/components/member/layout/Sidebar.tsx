import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  DoorOpen,
  Calendar,
  LogOut,
  Megaphone,
  MessageSquare,
  Building2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { logout } from "../../../services/authServices";
import { setToken } from "../../../config/axios";
import { API_ROUTES } from "../../../constants/Api_Routes";
import { useUnreadCount } from "../../../hooks/useUnreadCount";
import { useDirectChat } from "../../../context/useDirectChat";
import ConfirmModal from "../../common/ConfirmModal";

interface MemberSidebarProps {
  mobile?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function MemberSidebar({
  mobile = false,
  onClose,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}: MemberSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    workspaceOptions,
    workspaceId,
    setAccessToken,
    setUserRole,
    setWorkspaceId,
    setWorkspaceOptions,
  } = useAuth();
  const { unreadCount: announcementUnread } = useUnreadCount();
  const { unreadCount: dmUnread } = useDirectChat();

  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    try {
      return localStorage.getItem("audiohive_member_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isCollapsed = mobile
    ? false
    : controlledCollapsed !== undefined
    ? controlledCollapsed
    : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      const next = !internalCollapsed;
      setInternalCollapsed(next);
      try {
        localStorage.setItem("audiohive_member_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
    }
  };

  const currentWorkspace = workspaceOptions?.find((w) => w._id === workspaceId);
  const workspaceDisplayName = currentWorkspace?.workspaceName || "Member Workspace";

  const navItems = [
    { name: "Dashboard", path: API_ROUTES.MEMBER.NAV.DASHBOARD, icon: LayoutDashboard },
    { name: "Rooms", path: API_ROUTES.MEMBER.NAV.ROOMS, icon: DoorOpen },
    { name: "Meetings", path: API_ROUTES.MEMBER.NAV.MEETINGS, icon: Calendar },
    { name: "Chat", path: API_ROUTES.MEMBER.NAV.CHAT, icon: MessageSquare, badge: dmUnread },
    { name: "Announcements", path: API_ROUTES.MEMBER.NAV.ANNOUNCEMENTS, icon: Megaphone, badge: announcementUnread },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    } finally {
      setToken(null);
      setAccessToken(null);
      setUserRole(null);
      setWorkspaceId(null);
      setWorkspaceOptions([]);
      try {
        localStorage.setItem("logout", Date.now().toString());
      } catch {
        // ignore
      }
      navigate(API_ROUTES.PUBLIC.NAV.LOGIN);
    }
  };

  const handleNavClick = () => {
    if (mobile && onClose) {
      onClose();
    }
  };

  return (
    <>
      <aside
        aria-label="Member Navigation Sidebar"
        className={`${
          isCollapsed ? "w-20" : "w-64"
        } bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-full transition-all duration-200 select-none ${
          mobile ? "flex" : "hidden md:flex"
        }`}
      >
        {/* Brand & Workspace Header (matching Workspace Admin) */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-xs">
              <span className="text-white font-bold text-sm tracking-wider">AH</span>
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <span className="text-sm font-bold text-gray-900 block truncate">AudioHive</span>
                <div
                  className="flex items-center gap-1 text-[11px] font-medium text-gray-500 truncate"
                  title={workspaceDisplayName}
                >
                  <Building2 className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                  <span className="truncate">{workspaceDisplayName}</span>
                </div>
              </div>
            )}
          </div>

          {mobile && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sidebar"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-3 space-y-1.5" aria-label="Main member navigation">
            {navItems.map((item) => {
              const isActive = location.pathname.includes(item.path);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={handleNavClick}
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
                        isCollapsed ? "absolute -top-1 -right-1" : "relative"
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

        {/* Footer Section: Logout + Collapse Toggle Button */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          {/* Quick Logout Button */}
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            title={isCollapsed ? "Log out" : undefined}
            className={`flex items-center ${
              isCollapsed ? "justify-center w-full" : "gap-3 w-full px-3"
            } py-2 text-xs font-medium text-gray-500 hover:text-rose-600 hover:bg-rose-50/70 rounded-xl transition-colors group cursor-pointer`}
          >
            <LogOut className="w-4 h-4 text-gray-400 group-hover:text-rose-500 transition-colors" />
            {!isCollapsed && <span className="font-semibold">Log out</span>}
          </button>

          {/* Desktop Collapse / Expand Toggle */}
          {!mobile && (
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={`flex items-center ${
                isCollapsed ? "justify-center w-full" : "justify-between w-full px-3"
              } py-2 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer`}
            >
              {!isCollapsed && <span className="text-[11px] text-gray-400">Collapse menu</span>}
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              )}
            </button>
          )}
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Log Out of AudioHive?"
        message="Are you sure you want to log out of your session? Any active room meetings or audio calls will be disconnected."
        confirmLabel="Log Out"
        cancelLabel="Cancel"
        isDanger={true}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
}
