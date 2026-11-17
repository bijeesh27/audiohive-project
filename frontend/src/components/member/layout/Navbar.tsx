import { useState, useRef, useEffect } from "react";
import {
  Bell,
  User,
  DoorOpen,
  Megaphone,
  LogOut,
  ChevronDown,
  Menu,
  Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { logout } from "../../../services/authServices";
import { setToken } from "../../../config/axios";
import { API_ROUTES } from "../../../constants/Api_Routes";
import { useUnreadCount } from "../../../hooks/useUnreadCount";
import ConfirmModal from "../../common/ConfirmModal";

interface MemberNavbarProps {
  onOpenMobileMenu?: () => void;
}

export default function MemberNavbar({ onOpenMobileMenu }: MemberNavbarProps) {
  const navigate = useNavigate();
  const {
    workspaceId,
    workspaceOptions,
    switchWorkspace,
    username,
    setAccessToken,
    setUserRole,
    setWorkspaceId,
    setWorkspaceOptions,
  } = useAuth();
  const { unreadCount: announcementUnread } = useUnreadCount();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
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

  const handleWorkspaceChange = async (nextWorkspaceId: string) => {
    if (!nextWorkspaceId || nextWorkspaceId === workspaceId) return;
    setSwitching(true);
    setSwitchError(null);
    try {
      await switchWorkspace(nextWorkspaceId);
      navigate(API_ROUTES.MEMBER.NAV.DASHBOARD);
    } catch (error) {
      setSwitchError(error instanceof Error ? error.message : "Unable to switch workspace");
    } finally {
      setSwitching(false);
    }
  };

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

  const initials = username
    ? username
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "MB";

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200/90 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-20">
        {/* Left Side: Mobile Menu Button + Workspace Selector */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              aria-label="Open mobile navigation"
              className="md:hidden p-2 -ml-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {workspaceOptions && workspaceOptions.length > 1 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-slate-50/70 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-white transition-colors">
                <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <select
                  value={workspaceId ?? ""}
                  onChange={(event) => void handleWorkspaceChange(event.target.value)}
                  disabled={switching}
                  aria-label="Select workspace"
                  className="bg-transparent text-xs text-gray-800 font-semibold focus:outline-hidden cursor-pointer"
                >
                  {workspaceOptions.map((workspace) => (
                    <option key={workspace._id} value={workspace._id}>
                      {workspace.workspaceName}
                    </option>
                  ))}
                </select>
              </div>
              {switchError && <span className="text-xs text-rose-600">{switchError}</span>}
            </div>
          )}
        </div>

        {/* Right Side: Notifications + Member Profile Dropdown */}
        <div className="flex items-center gap-3 pl-4">
          {/* Notification Bell */}
          <button
            type="button"
            onClick={() => navigate(API_ROUTES.MEMBER.NAV.ANNOUNCEMENTS)}
            aria-label="View Announcements"
            className="relative p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {announcementUnread > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 ring-2 ring-white"></span>
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </button>

          {/* Member Profile Dropdown (identical styling to workspace admin) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              id="member-user-menu-button"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              aria-label="Member user menu"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors cursor-pointer"
            >
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shadow-xs">
                {initials}
              </div>
              <div className="hidden sm:block text-left text-xs pr-1">
                <span className="font-semibold text-gray-900 block leading-tight truncate max-w-[120px]">
                  {username || "Member"}
                </span>
                <span className="text-[10px] text-gray-400 block leading-tight">Member</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {dropdownOpen && (
              <div
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="member-user-menu-button"
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-gray-200 shadow-xl py-1.5 z-50 text-xs focus:outline-none animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="font-semibold text-gray-900 truncate">{username || "Member"}</p>
                  <p className="text-[11px] text-gray-400 truncate">Workspace Member</p>
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate(API_ROUTES.MEMBER.NAV.DASHBOARD);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span>Dashboard Overview</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate(API_ROUTES.MEMBER.NAV.ROOMS);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <DoorOpen className="w-3.5 h-3.5 text-gray-400" />
                  <span>Explore Rooms</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate(API_ROUTES.MEMBER.NAV.ANNOUNCEMENTS);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <Megaphone className="w-3.5 h-3.5 text-gray-400" />
                  <span>Announcements</span>
                </button>

                <div className="my-1 border-t border-gray-100" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setDropdownOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50/70 font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Log Out of AudioHive?"
        message="Are you sure you want to log out of your session? Any active meetings or audio connections will be disconnected."
        confirmLabel="Log Out"
        cancelLabel="Cancel"
        isDanger={true}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}
