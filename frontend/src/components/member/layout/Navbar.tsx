import { useState } from "react";
import { Bell, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { API_ROUTES } from "../../../constants/Api_Routes";
import { useUnreadCount } from "../../../hooks/useUnreadCount";

interface MemberNavbarProps {
  onOpenMobileMenu?: () => void;
}

export default function MemberNavbar({ onOpenMobileMenu }: MemberNavbarProps) {
  const navigate = useNavigate();
  const { workspaceId, workspaceOptions, switchWorkspace, username } = useAuth();
  const { unreadCount: announcementUnread } = useUnreadCount();
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

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

  const userInitial = (username || "M").charAt(0).toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-10">
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open mobile navigation"
            className="md:hidden p-2 -ml-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {workspaceOptions.length > 1 && (
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-500 hidden sm:inline">Workspace:</span>
            <select
              value={workspaceId ?? ""}
              onChange={(event) => void handleWorkspaceChange(event.target.value)}
              disabled={switching}
              aria-label="Select workspace"
              className="max-w-[180px] sm:max-w-xs rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs sm:text-sm text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60"
            >
              {workspaceOptions.map((workspace) => (
                <option key={workspace._id} value={workspace._id}>
                  {workspace.workspaceName}
                </option>
              ))}
            </select>
          </label>
        )}
        {switchError && <span className="text-xs text-red-600">{switchError}</span>}
      </div>

      <div className="flex items-center gap-3 sm:gap-4 pl-4">
        <button
          type="button"
          onClick={() => navigate(API_ROUTES.MEMBER.NAV.ANNOUNCEMENTS)}
          aria-label="Announcements notifications"
          className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        >
          {announcementUnread > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 ring-2 ring-white"></span>
            </span>
          )}
          <Bell className="h-5 w-5" />
        </button>

        <div
          title={username || "Member"}
          className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-xs"
        >
          {userInitial}
        </div>
      </div>
    </header>
  );
}
