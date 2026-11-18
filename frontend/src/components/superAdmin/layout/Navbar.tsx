import { useState, useRef, useEffect } from "react";
import { Bell, LogOut, ChevronDown, ShieldCheck, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { logout } from "../../../services/authServices";
import { setToken } from "../../../config/axios";
import { API_ROUTES } from "../../../constants/Api_Routes";

export default function Navbar() {
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

  const displayName = username || "Super Admin";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "SA";

  return (
    <header className="h-16 bg-white border-b border-gray-200/90 flex items-center justify-between px-6 flex-shrink-0 z-20">
      {/* Left: Platform Super Admin Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-indigo-50/60 border border-indigo-200/60">
          <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span className="text-xs font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-[320px]">
            Platform Overview
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white tracking-wider uppercase">
            Root Admin
          </span>
        </div>
      </div>

      {/* Right: Notification Bell & Profile Dropdown */}
      <div className="flex items-center gap-3 pl-4">
        {/* Notification Bell (No hardcoded fake red dot) */}
        <button
          type="button"
          aria-label="View Notifications"
          className="relative p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="sr-only">Notifications</span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            id="superadmin-user-menu-button"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="Super Admin user menu"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          >
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-700 flex items-center justify-center text-white text-xs font-semibold shadow-xs">
              {initials}
            </div>
            <div className="hidden sm:block text-left text-xs pr-1">
              <span className="font-semibold text-gray-900 block leading-tight truncate max-w-[140px]">
                {displayName}
              </span>
              <span className="text-[10px] text-gray-400 block leading-tight">Super Admin</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-gray-200/90 shadow-lg py-1.5 focus:outline-none z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="superadmin-user-menu-button"
            >
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="font-semibold text-gray-900 truncate">{displayName}</p>
                <p className="text-[11px] text-gray-500 truncate">Platform Administrator</p>
              </div>

              <div className="p-1">
                <div
                  className="flex items-center gap-2.5 w-full px-2.5 py-2 text-gray-700 rounded-lg text-xs font-medium cursor-default"
                  role="menuitem"
                >
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span>Platform Owner Account</span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-2.5 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium text-left"
                  role="menuitem"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
