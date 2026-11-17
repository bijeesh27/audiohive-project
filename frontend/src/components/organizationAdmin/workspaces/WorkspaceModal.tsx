import React, { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { createWorkspace, updateWorkspace } from "../../../services/workspaceServices";
import type { IWorkspaceItem } from "../../../services/workspaceServices";

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ws?: IWorkspaceItem) => void;
  workspace?: IWorkspaceItem | null;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  workspace,
}) => {
  const isEdit = Boolean(workspace);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditedManually, setSlugEditedManually] = useState(false);
  const [description, setDescription] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when opening
  useEffect(() => {
    if (isOpen) {
      if (workspace) {
        setName(workspace.workspaceName || "");
        setSlug(workspace.slug || "");
        setSlugEditedManually(true);
        setDescription(workspace.description || "");
        setAdminEmail(workspace.workspaceAdminEmail || "");
      } else {
        setName("");
        setSlug("");
        setSlugEditedManually(false);
        setDescription("");
        setAdminEmail("");
      }
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

  if (!isOpen) return null;

  // Auto-generate slug from name on create if user hasn't manually edited slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));

    if (!isEdit && !slugEditedManually) {
      const generatedSlug = newName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generatedSlug);
      if (errors.slug) setErrors((prev) => ({ ...prev, slug: "" }));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(val);
    setSlugEditedManually(true);
    if (errors.slug) setErrors((prev) => ({ ...prev, slug: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Workspace display name is required.";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    } else if (name.trim().length > 100) {
      newErrors.name = "Name cannot exceed 100 characters.";
    }

    if (!isEdit) {
      if (!slug.trim()) {
        newErrors.slug = "Slug is required.";
      } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
        newErrors.slug = "Slug must contain only lowercase letters, numbers, and hyphens (cannot start or end with a hyphen).";
      } else if (slug.trim().length < 3) {
        newErrors.slug = "Slug must be at least 3 characters.";
      } else if (slug.trim().length > 63) {
        newErrors.slug = "Slug cannot exceed 63 characters.";
      }
    }

    if (adminEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())) {
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
      if (isEdit && workspace) {
        await updateWorkspace(workspace._id, {
          workspaceName: name.trim(),
          description: description.trim(),
          workspaceAdminEmail: adminEmail.trim() || undefined,
        });
        onSuccess();
        onClose();
      } else {
        await createWorkspace({
          workspaceName: name.trim(),
          slug: slug.trim().toLowerCase(),
          description: description.trim(),
          workspaceAdminEmail: adminEmail.trim() || undefined,
        });
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to save workspace.";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 overflow-hidden scale-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 id="workspace-modal-title" className="text-base font-semibold text-gray-900 tracking-tight">
              {isEdit ? "Edit Workspace" : "Create New Workspace"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEdit
                ? "Update display name, description, and workspace administrator."
                : "Create an isolated workspace environment for your team."}
            </p>
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
          {/* Workspace Name */}
          <div>
            <label htmlFor="ws-name" className="block text-xs font-semibold text-gray-700 mb-1">
              Workspace Name <span className="text-red-500">*</span>
            </label>
            <input
              id="ws-name"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Engineering & Design"
              disabled={isSubmitting}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                errors.name
                  ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-100"
              } focus:outline-none focus:ring-3 transition-colors bg-white text-gray-900`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Slug */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="ws-slug" className="block text-xs font-semibold text-gray-700">
                Workspace Slug {!isEdit && <span className="text-red-500">*</span>}
              </label>
              {!isEdit && (
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" /> Auto-generated
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-400 select-none">
                /
              </span>
              <input
                id="ws-slug"
                type="text"
                value={slug}
                onChange={handleSlugChange}
                disabled={isEdit || isSubmitting}
                placeholder="engineering-design"
                className={`w-full pl-7 pr-3.5 py-2.5 text-sm font-mono rounded-xl border ${
                  errors.slug
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : isEdit
                    ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                    : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-100 bg-white text-gray-900"
                } focus:outline-none focus:ring-3 transition-colors`}
              />
            </div>
            {errors.slug ? (
              <p className="mt-1 text-xs text-red-500">{errors.slug}</p>
            ) : isEdit ? (
              <p className="mt-1 text-[11px] text-gray-400">
                Slugs are permanent identifiers used in URLs and cannot be altered.
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-gray-400">
                URL-safe identifier: lowercase letters, numbers, and hyphens only.
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="ws-desc" className="block text-xs font-semibold text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="ws-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              placeholder="A brief summary of this workspace's purpose or team..."
              maxLength={500}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-indigo-100 focus:outline-none focus:ring-3 transition-colors bg-white text-gray-900 resize-none"
            />
            <div className="text-right text-[10px] text-gray-400 mt-0.5">
              {description.length}/500
            </div>
          </div>

          {/* Admin Email (optional assignment) */}
          <div>
            <label htmlFor="ws-admin-email" className="block text-xs font-semibold text-gray-700 mb-1">
              Workspace Administrator Email <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              id="ws-admin-email"
              type="email"
              value={adminEmail}
              onChange={(e) => {
                setAdminEmail(e.target.value);
                if (errors.adminEmail) setErrors((prev) => ({ ...prev, adminEmail: "" }));
              }}
              disabled={isSubmitting}
              placeholder="lead@technova.com"
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
                The designated administrator manages members, rooms, and permissions for this space.
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
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEdit ? "Save Changes" : "Create Workspace"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkspaceModal;
