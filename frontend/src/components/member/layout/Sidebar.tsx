import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, DoorOpen, Calendar, LogOut, Megaphone, MessageSquare, X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { logout } from "../../../services/authServices";
import { setToken } from "../../../config/axios";
import { API_ROUTES } from "../../../constants/Api_Routes";
import { useUnreadCount } from "../../../hooks/useUnreadCount";
import { useDirectChat } from "../../../context/useDirectChat";

interface MemberSidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export default function MemberSidebar({ mobile = false, onClose }: MemberSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAccessToken, setUserRole, setWorkspaceId, setWorkspaceOptions } = useAuth();
  const { unreadCount: announcementUnread } = useUnreadCount();
  const { unreadCount: dmUnread } = useDirectChat();

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
      localStorage.setItem("logout", Date.now().toString());
      navigate(API_ROUTES.PUBLIC.NAV.LOGIN);
    }
  };

  const handleNavClick = () => {
    if (mobile && onClose) {
      onClose();
    }
  };

  return (
    <aside
      className={`w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-full ${
        mobile ? "flex" : "hidden md:flex"
      }`}
    >
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs tracking-wider">AH</span>
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">AudioHive</span>
        </div>

        {mobile && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? "text-indigo-600" : "text-gray-400"
                  }`}
                />
                <span className="flex-1">{item.name}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50/50 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer"
        >
          <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
          Logout
        </button>
      </div>
    </aside>
  );
}
