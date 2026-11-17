import React, { useState, useEffect } from "react";
import { X, UserCheck, AlertCircle, Loader2 } from "lucide-react";
import { inviteWorkspaceAdmin, updateWorkspace } from "../../../services/workspaceServices";
import type { IWorkspaceItem } from "../../../services/workspaceServices";

interface AssignAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedAdminEmail: string, updatedAdminName: string) => void;
  workspace: IWorkspaceItem | null;
}

export const AssignAdminModal: React.FC<AssignAdminModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  workspace,
}) => {
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && workspace) {
      setAdminName(workspace.workspaceAdminName || "");
      setAdminEmail(workspace.workspaceAdminEmail || "");
      setErrors({});
      setServerError(null);
    }
  }, [isOpen, workspace]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !workspace) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!adminName.trim()) {
      newErrors.adminName = "Admin name is required.";
    }

    if (!adminEmail.trim()) {
      newErrors.adminEmail = "Admin email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())) {
      newErrors.adminEmail = "Please enter a valid email address.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      // 1. Send invitation / set admin
      await inviteWorkspaceAdmin(workspace._id, {
        email: adminEmail.trim(),
        workspaceAdminName: adminName.trim(),
      });

      // 2. Also ensure workspace document records the admin email
      await updateWorkspace(workspace._id, {
        workspaceAdminEmail: adminEmail.trim(),
      });

      onSuccess(adminEmail.trim(), adminName.trim());
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to assign workspace admin.";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-admin-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 overflow-hidden scale-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="assign-admin-modal-title" className="text-base font-semibold text-gray-900 tracking-tight">
                {workspace.workspaceAdminEmail ? "Change Workspace Admin" : "Assign Workspace Admin"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Workspace: <span className="font-semibold text-gray-700">{workspace.workspaceName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server error alert */}
        {serverError && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{serverError}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="admin-name" className="block text-xs font-semibold text-gray-700 mb-1">
              Admin Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="admin-name"
              type="text"
              value={adminName}
              onChange={(e) => {
                setAdminName(e.target.value);
                if (errors.adminName) setErrors((prev) => ({ ...prev, adminName: "" }));
              }}
              placeholder="e.g. Alex Morgan"
              disabled={isSubmitting}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                errors.adminName
                  ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-100"
              } focus:outline-none focus:ring-3 transition-colors bg-white text-gray-900`}
            />
            {errors.adminName && <p className="mt-1 text-xs text-red-500">{errors.adminName}</p>}
          </div>

          <div>
            <label htmlFor="admin-email" className="block text-xs font-semibold text-gray-700 mb-1">
              Admin Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="admin-email"
              type="email"
              value={adminEmail}
              onChange={(e) => {
                setAdminEmail(e.target.value);
                if (errors.adminEmail) setErrors((prev) => ({ ...prev, adminEmail: "" }));
              }}
              placeholder="alex@technova.com"
              disabled={isSubmitting}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                errors.adminEmail
                  ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-100"
              } focus:outline-none focus:ring-3 transition-colors bg-white text-gray-900`}
            />
            {errors.adminEmail ? (
              <p className="mt-1 text-xs text-red-500">{errors.adminEmail}</p>
            ) : (
              <p className="mt-1 text-[11px] text-gray-400">
                An invitation link with workspace administration privileges will be dispatched.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Assigning...</span>
                </>
              ) : (
                <span>Confirm Assignment</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignAdminModal;
