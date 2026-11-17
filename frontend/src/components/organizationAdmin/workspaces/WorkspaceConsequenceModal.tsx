import React, { useState, useEffect } from "react";
import { AlertTriangle, Loader2, Archive, PauseCircle, Trash2 } from "lucide-react";
import type { IWorkspaceItem } from "../../../services/workspaceServices";

export type ConsequenceActionType = "archive" | "restore" | "suspend" | "reactivate" | "delete";

interface WorkspaceConsequenceModalProps {
  isOpen: boolean;
  actionType: ConsequenceActionType | null;
  workspace: IWorkspaceItem | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export const WorkspaceConsequenceModal: React.FC<WorkspaceConsequenceModalProps> = ({
  isOpen,
  actionType,
  workspace,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [typedName, setTypedName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTypedName("");
      setError(null);
    }
  }, [isOpen, workspace, actionType]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !actionType || !workspace) return null;

  const isDelete = actionType === "delete";
  const isDeleteNameMatched = isDelete ? typedName.trim() === workspace.workspaceName.trim() : true;

  const config = {
    archive: {
      title: `Archive Workspace "${workspace.workspaceName}"?`,
      icon: Archive,
      iconBg: "bg-amber-50 text-amber-600",
      confirmBtn: "Archive Workspace",
      confirmStyle: "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white",
      description: (
        <div className="space-y-2 text-xs text-gray-600">
          <p>
            Archiving puts this workspace into a read-only state.
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-500">
            <li>Members will immediately lose access to rooms and lounges.</li>
            <li>No new meetings, recordings, or rooms can be created.</li>
            <li>All existing rooms, history, and announcements remain preserved.</li>
            <li>You can restore this workspace at any time to resume normal operations.</li>
          </ul>
        </div>
      ),
    },
    restore: {
      title: `Restore Workspace "${workspace.workspaceName}"?`,
      icon: Archive,
      iconBg: "bg-emerald-50 text-emerald-600",
      confirmBtn: "Restore Workspace",
      confirmStyle: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white",
      description: (
        <p className="text-xs text-gray-600">
          Restoring this workspace will return it to active status. Members will regain access to their rooms and collaborate normally.
        </p>
      ),
    },
    suspend: {
      title: `Suspend Workspace "${workspace.workspaceName}"?`,
      icon: PauseCircle,
      iconBg: "bg-yellow-50 text-yellow-600",
      confirmBtn: "Suspend Workspace",
      confirmStyle: "bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white",
      description: (
        <div className="space-y-2 text-xs text-gray-600">
          <p>
            Suspending temporarily locks all operations for this workspace:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-500">
            <li>Members will be locked out and cannot log in or participate.</li>
            <li>All ongoing active rooms, calls, and sessions will be disconnected.</li>
            <li>Administrative access can be restored at any time by the owner.</li>
          </ul>
        </div>
      ),
    },
    reactivate: {
      title: `Reactivate Workspace "${workspace.workspaceName}"?`,
      icon: PauseCircle,
      iconBg: "bg-emerald-50 text-emerald-600",
      confirmBtn: "Reactivate Workspace",
      confirmStyle: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white",
      description: (
        <p className="text-xs text-gray-600">
          Reactivating will unfreeze the workspace. Members can resume joining rooms, participating in meetings, and chatting.
        </p>
      ),
    },
    delete: {
      title: `Permanently Delete "${workspace.workspaceName}"?`,
      icon: Trash2,
      iconBg: "bg-red-50 text-red-600",
      confirmBtn: "Delete Permanently",
      confirmStyle: "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white",
      description: (
        <div className="space-y-3 text-xs text-gray-600">
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium">
            Warning: This is a destructive action and cannot be undone.
          </div>
          <p>
            Deleting this workspace will permanently eliminate:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-500">
            <li>The workspace, lounge, and all {workspace.roomsCount} room(s).</li>
            <li>Meeting history, call logs, and recorded sessions.</li>
            <li>Disassociate {workspace.membersCount} member(s) from this space.</li>
          </ul>
        </div>
      ),
    },
  }[actionType];

  const Icon = config.icon;

  const handleConfirm = async () => {
    if (isDelete && !isDeleteNameMatched) {
      setError(`Please type "${workspace.workspaceName}" exactly to confirm.`);
      return;
    }
    setError(null);
    try {
      await onConfirm();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Action failed.");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consequence-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => !isLoading && onClose()}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 overflow-hidden scale-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${config.iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="consequence-modal-title" className="text-base font-semibold text-gray-900 tracking-tight">
              {config.title}
            </h3>
            <div className="mt-2.5">{config.description}</div>
          </div>
        </div>

        {/* Delete confirmation input */}
        {isDelete && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <label htmlFor="confirm-typed-name" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Type <span className="font-mono font-bold text-red-600 select-all">{workspace.workspaceName}</span> to confirm:
            </label>
            <input
              id="confirm-typed-name"
              type="text"
              value={typedName}
              onChange={(e) => {
                setTypedName(e.target.value);
                if (error) setError(null);
              }}
              disabled={isLoading}
              placeholder={workspace.workspaceName}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:border-red-500 focus:ring-red-100 focus:outline-none focus:ring-3 font-mono text-gray-900 transition-colors"
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || (isDelete && !isDeleteNameMatched)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${config.confirmStyle}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{config.confirmBtn}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceConsequenceModal;
