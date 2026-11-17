import React, { useState, useEffect, useMemo } from "react";
import { X, Pin, AlertCircle, DoorOpen, Loader2 } from "lucide-react";
import type { MemberAnnouncement } from "../../services/announcementServices";
import { getRooms } from "../../services/roomServices";
import ConfirmModal from "../common/ConfirmModal";

export interface AnnouncementFormData {
  title: string;
  content: string;
  type: "info" | "warning" | "critical" | "event";
  targetAudience: "all" | "room-specific";
  roomId?: string;
  status: "draft" | "published";
  isPinned: boolean;
  expiresAt?: string;
}

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AnnouncementFormData) => Promise<void>;
  editTarget: MemberAnnouncement | null;
  saving: boolean;
}

const DEFAULT_FORM: AnnouncementFormData = {
  title: "",
  content: "",
  type: "info",
  targetAudience: "all",
  roomId: "",
  status: "published",
  isPinned: false,
  expiresAt: "",
};

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editTarget,
  saving,
}) => {
  const [form, setForm] = useState<AnnouncementFormData>(DEFAULT_FORM);
  const [initialForm, setInitialForm] = useState<AnnouncementFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rooms, setRooms] = useState<Array<{ _id: string; name: string }>>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Load rooms when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadingRooms(true);
      getRooms(1, 100)
        .then((res) => {
          const list = res.data?.data?.rooms || res.data?.data || [];
          setRooms(list);
        })
        .catch(() => {
          // silently fallback if rooms fails to load
        })
        .finally(() => {
          setLoadingRooms(false);
        });
    }
  }, [isOpen]);

  // Sync editTarget into form
  useEffect(() => {
    if (isOpen) {
      if (editTarget) {
        const initial: AnnouncementFormData = {
          title: editTarget.title || "",
          content: editTarget.content || "",
          type: (editTarget.type as any) || "info",
          targetAudience: editTarget.targetAudience || "all",
          roomId: editTarget.roomId || "",
          status: editTarget.status === "draft" ? "draft" : "published",
          isPinned: Boolean(editTarget.isPinned),
          expiresAt: editTarget.expiresAt
            ? new Date(editTarget.expiresAt).toISOString().slice(0, 16)
            : "",
        };
        setForm(initial);
        setInitialForm(initial);
      } else {
        setForm(DEFAULT_FORM);
        setInitialForm(DEFAULT_FORM);
      }
      setErrors({});
    }
  }, [isOpen, editTarget]);

  // Check dirty state
  const isDirty = useMemo(() => {
    return (
      form.title !== initialForm.title ||
      form.content !== initialForm.content ||
      form.type !== initialForm.type ||
      form.targetAudience !== initialForm.targetAudience ||
      form.roomId !== initialForm.roomId ||
      form.isPinned !== initialForm.isPinned ||
      form.expiresAt !== initialForm.expiresAt
    );
  }, [form, initialForm]);

  const handleClose = () => {
    if (isDirty && !saving) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleFieldChange = (field: keyof AnnouncementFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) {
      errs.title = "Title is required";
    } else if (form.title.trim().length > 120) {
      errs.title = "Title must be 120 characters or fewer";
    }

    if (!form.content.trim()) {
      errs.content = "Content is required";
    } else if (form.content.trim().length < 10) {
      errs.content = "Content must be at least 10 characters";
    }

    if (form.targetAudience === "room-specific" && !form.roomId) {
      errs.roomId = "Please select a room for this announcement";
    }

    if (form.expiresAt) {
      const expDate = new Date(form.expiresAt);
      if (isNaN(expDate.getTime()) || expDate <= new Date()) {
        errs.expiresAt = "Expiry must be a future date and time";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (targetStatus: "draft" | "published") => {
    if (!validate()) return;
    const submission: AnnouncementFormData = {
      ...form,
      title: form.title.trim(),
      content: form.content.trim(),
      status: targetStatus,
      expiresAt: form.expiresAt ? form.expiresAt : undefined,
    };
    await onSave(submission);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={handleClose}
          />

          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editTarget ? "Edit Announcement" : "Create New Announcement"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editTarget
                    ? "Update announcement content, target audience, or expiration."
                    : "Broadcast an update, notice, or event to your workspace members."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[calc(85vh-130px)] overflow-y-auto">
              {/* Title input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Title <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-medium ${
                      form.title.length > 120 ? "text-rose-500 font-bold" : "text-slate-400"
                    }`}
                  >
                    {form.title.length}/120
                  </span>
                </div>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  maxLength={120}
                  placeholder="e.g. Scheduled System Maintenance on Friday"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all ${
                    errors.title ? "border-rose-400 bg-rose-50/20" : "border-slate-200 bg-white"
                  }`}
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.title}
                  </p>
                )}
              </div>

              {/* Type and Target Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Category / Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => handleFieldChange("type", e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
                  >
                    <option value="info">Info (Blue)</option>
                    <option value="warning">Warning / Important (Amber)</option>
                    <option value="critical">Critical / Urgent (Red)</option>
                    <option value="event">Event (Purple)</option>
                  </select>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Audience
                  </label>
                  <select
                    value={form.targetAudience}
                    onChange={(e) => handleFieldChange("targetAudience", e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
                  >
                    <option value="all">All Workspace Members</option>
                    <option value="room-specific">Room Specific</option>
                  </select>
                </div>
              </div>

              {/* Room Selector (if room-specific) */}
              {form.targetAudience === "room-specific" && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <DoorOpen className="w-4 h-4 text-indigo-600" />
                    Select Target Room <span className="text-rose-500">*</span>
                  </label>
                  {loadingRooms ? (
                    <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Loading rooms...
                    </div>
                  ) : (
                    <select
                      value={form.roomId || ""}
                      onChange={(e) => handleFieldChange("roomId", e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-lg border text-sm text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
                        errors.roomId ? "border-rose-400" : "border-slate-200"
                      }`}
                    >
                      <option value="">-- Choose a room --</option>
                      {rooms.map((room) => (
                        <option key={room._id} value={room._id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.roomId && (
                    <p className="text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.roomId}
                    </p>
                  )}
                </div>
              )}

              {/* Content textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Content <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-medium ${
                      form.content.trim().length < 10 && form.content.length > 0
                        ? "text-amber-600 font-semibold"
                        : "text-slate-400"
                    }`}
                  >
                    {form.content.length} characters (min 10)
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={form.content}
                  onChange={(e) => handleFieldChange("content", e.target.value)}
                  placeholder="Share details, announcements, meeting notes, links..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-y ${
                    errors.content ? "border-rose-400 bg-rose-50/20" : "border-slate-200 bg-white"
                  }`}
                />
                {errors.content && (
                  <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.content}
                  </p>
                )}
              </div>

              {/* Pin Toggle & Expiration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Pin toggle */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-lg ${
                        form.isPinned ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      <Pin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Pin to top</p>
                      <p className="text-[11px] text-slate-500">Highlight at top of feed</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isPinned}
                      onChange={(e) => handleFieldChange("isPinned", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Expiration date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Expiration (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) => handleFieldChange("expiresAt", e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
                      errors.expiresAt ? "border-rose-400 bg-rose-50/20" : "border-slate-200 bg-white"
                    }`}
                  />
                  {errors.expiresAt ? (
                    <p className="mt-1 text-xs text-rose-500">{errors.expiresAt}</p>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-400">
                      Automatically hides after this time.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="px-4 py-2 border border-slate-300 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-100 transition-colors shadow-2xs"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSubmit("draft")}
                  disabled={saving}
                  className="px-4 py-2 border border-slate-300 bg-white text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save as Draft"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit("published")}
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editTarget ? "Save Changes" : "Publish Now"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discard Changes Confirmation */}
      <ConfirmModal
        isOpen={showDiscardConfirm}
        title="Discard Unsaved Changes?"
        message="You have unsaved changes in this announcement. If you leave now, your edits will be lost."
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        isDanger={true}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onClose();
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </>
  );
};
