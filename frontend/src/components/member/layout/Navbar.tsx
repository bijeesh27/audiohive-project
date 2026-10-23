import { useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { API_ROUTES } from "../../../constants/Api_Routes";

export default function MemberNavbar() {
  const navigate = useNavigate();
  const { workspaceId, workspaceOptions, switchWorkspace } = useAuth();
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

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex-1 max-w-lg">
        {workspaceOptions.length > 1 && (
          <label className="flex items-center gap-3 text-sm">
            <span className="font-medium text-gray-500">Workspace</span>
            <select
              value={workspaceId ?? ""}
              onChange={(event) => void handleWorkspaceChange(event.target.value)}
              disabled={switching}
              className="max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 disabled:opacity-60"
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

      <div className="flex items-center gap-4 pl-4">
        <button className="relative p-2 text-gray-400 hover:text-gray-500 transition-colors">
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          <Bell className="h-5 w-5" />
        </button>
        <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-medium cursor-pointer">
          M
        </div>
      </div>
    </header>
  );
}
