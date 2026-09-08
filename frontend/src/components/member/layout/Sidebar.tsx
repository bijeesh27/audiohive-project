import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, DoorOpen, LogOut, Megaphone } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { logout } from "../../../services/authServices";
import { setToken } from "../../../config/axios";
import { API_ROUTES } from "../../../constants/Api_Routes";
import { useUnreadCount } from "../../../hooks/useUnreadCount";

export default function MemberSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAccessToken, setUserRole } = useAuth();
  const { unreadCount } = useUnreadCount();

  const navItems = [
    { name: "Dashboard", path: API_ROUTES.MEMBER.NAV.DASHBOARD, icon: LayoutDashboard },
    { name: "Rooms", path: API_ROUTES.MEMBER.NAV.ROOMS, icon: DoorOpen },
    { name: "Announcements", path: API_ROUTES.MEMBER.NAV.ANNOUNCEMENTS, icon: Megaphone, badge: unreadCount },
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
      localStorage.setItem("logout", Date.now().toString());
      navigate(API_ROUTES.PUBLIC.NAV.LOGIN);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden md:flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gray-900 flex items-center justify-center">
            <span className="text-white font-bold text-sm">AH</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">AudioHive</span>
        </div>
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
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-gray-900" : "text-gray-400"}`} />
                <span className="flex-1">{item.name}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
        >
          <LogOut className="w-5 h-5 text-gray-400" />
          Logout
        </button>
      </div>
    </aside>
  );
}

