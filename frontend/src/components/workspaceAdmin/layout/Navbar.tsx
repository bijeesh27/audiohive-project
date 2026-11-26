import { useState, useRef, useEffect } from "react";
import { Bell, User, Settings, LogOut, ChevronDown, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { logout } from "../../../services/authServices";
import { setToken } from "../../../config/axios";
import { API_ROUTES } from "../../../constants/Api_Routes";

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export default function Navbar({ onOpenMobileMenu }: NavbarProps) {
  const navigate = useNavigate();
  const { username, setAccessToken, setUserRole } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    } finally {
      setToken(null);
      setAccessToken(null);
      setUserRole(null);
      try {
        localStorage.setItem("logout", Date.now().toString());
      } catch {
        // ignore
      }
      navigate(API_ROUTES.PUBLIC.NAV.LOGIN);
    }
  };

  const initials = username
    ? username
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "WA";

  return (
    <header className="h-16 bg-white border-b border-gray-200/90 flex items-center justify-between px-3 sm:px-6 flex-shrink-0 z-20">
      <div className="flex items-center gap-2 flex-1 max-w-lg">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="md:hidden p-2 rounded-xl text-gray-600 hover:text-indigo-600 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 pl-4">
        {/* Notification Bell */}
        <button
          type="button"
          aria-label="View Notifications"
          className="relative p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="sr-only">Notifications</span>
        </button>

        {/* Admin Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            id="admin-user-menu-button"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="Admin user menu"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          >
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shadow-xs">
              {initials}
            </div>
            <div className="hidden sm:block text-left text-xs pr-1">
              <span className="font-semibold text-gray-900 block leading-tight truncate max-w-[120px]">
                {username || "Workspace Admin"}
              </span>
              <span className="text-[10px] text-gray-400 block leading-tight">Admin</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {dropdownOpen && (
            <div
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="admin-user-menu-button"
              className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-gray-200 shadow-lg py-1.5 z-50 text-xs focus:outline-none animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="font-semibold text-gray-900 truncate">{username || "Administrator"}</p>
                <p className="text-[11px] text-gray-400 truncate">Workspace Manager</p>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate(API_ROUTES.WORKSPACE_ADMIN.NAV.GET_USERS);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>Profile & Users</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate(API_ROUTES.WORKSPACE_ADMIN.NAV.ROOMS);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-gray-400" />
                <span>Workspace Settings</span>
              </button>

              <div className="my-1 border-t border-gray-100" />

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50/70 font-medium transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
