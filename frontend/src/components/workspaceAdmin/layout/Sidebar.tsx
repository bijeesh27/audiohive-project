import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, LogOut,  } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { logout } from "../../../services/authServices";
import { setToken } from "../../../config/axios";
import { API_ROUTES } from "../../../constants/Api_Routes";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAccessToken, setUserRole } = useAuth();

  const navItems = [
    { name: "Dashboard", path: API_ROUTES.WORKSPACE_ADMIN.NAV.DASHBOARD, icon: LayoutDashboard },
    { name: "Users", path: API_ROUTES.WORKSPACE_ADMIN.NAV.GET_USERS, icon: Users },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      throw new Error
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
                <Icon
                  className={`w-5 h-5 ${isActive ? "text-gray-900" : "text-gray-400"}`}
                />
                {item.name}
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
