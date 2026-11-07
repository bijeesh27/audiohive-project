import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, Loader2, AlertCircle, Hash, Pencil } from "lucide-react";
import {
  createMeeting,
  updateMeeting,
  type Meeting,
} from "../../services/meetingServices";
import ConfirmModal from "../common/ConfirmModal";

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMeeting?: Meeting | null;
}

const formatLocalDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatLocalTime = (d: Date) => {
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const getDefaultDateTime = () => {
  const now = new Date();
  now.setHours(now.getHours() + 1, 0, 0, 0);
  const dateStr = formatLocalDate(now);
  const startStr = formatLocalTime(now);

  const end = new Date(now.getTime() + 30 * 60000);
  const endStr = formatLocalTime(end);

  return { dateStr, startStr, endStr };
};

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMeeting,
}) => {
  const isEditing = Boolean(initialMeeting);
  const initial = getDefaultDateTime();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(initial.dateStr);
  const [startTime, setStartTime] = useState(initial.startStr);
  const [endTime, setEndTime] = useState(initial.endStr);
  const [status, setStatus] = useState<"scheduled" | "live" | "completed" | "cancelled">("scheduled");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Pre-fill form when editing an existing meeting
  useEffect(() => {
    if (initialMeeting && isOpen) {
      setTitle(initialMeeting.title || "");
      setDescription(initialMeeting.description || "");
      setStatus(initialMeeting.status || "scheduled");

      if (initialMeeting.startTime) {
        const s = new Date(initialMeeting.startTime);
        setDate(formatLocalDate(s));
        setStartTime(formatLocalTime(s));
      }
      if (initialMeeting.endTime) {
        const e = new Date(initialMeeting.endTime);
        setEndTime(formatLocalTime(e));
      }
      setError(null);
    } else if (!initialMeeting && isOpen) {
      const def = getDefaultDateTime();
      setTitle("");
      setDescription("");
      setDate(def.dateStr);
      setStartTime(def.startStr);
      setEndTime(def.endStr);
      setStatus("scheduled");
      setError(null);
    }
  }, [initialMeeting, isOpen]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setError(null);
  };

  const handleAttemptClose = () => {
    if (title.trim() || description.trim()) {
      setShowDiscardConfirm(true);
    } else {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a meeting title.");
      return;
    }

    if (!date || !startTime || !endTime) {
      setError("Please select date, start time, and end time.");
      return;
    }

    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    if (startDateTime >= endDateTime) {
      setError("Start time must be before end time.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (isEditing && initialMeeting) {
        await updateMeeting(initialMeeting._id, {
          title: title.trim(),
          description: description.trim(),
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          status,
        });
      } else {
        await createMeeting({
          title: title.trim(),
          description: description.trim(),
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          participants: [],
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(msg || (isEditing ? "Failed to update meeting." : "Failed to schedule meeting."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isEditing ? "bg-violet-50 text-violet-600" : "bg-indigo-50 text-indigo-600"}`}>
              {isEditing ? <Pencil className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {isEditing ? "Edit Scheduled Meeting" : "Schedule Meeting"}
              </h2>
              <p className="text-xs text-gray-500">
                {isEditing
                  ? `Editing ${initialMeeting?.meetingCode ? `code: ${initialMeeting.meetingCode}` : "meeting session"}`
                  : "Plan a session — anyone with the code can join"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAttemptClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Meeting Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Weekly Sync, Sprint Planning, Client Review"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Agenda & Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key discussion topics or agenda items..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Date and Times */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                Start Time
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                End Time
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Status Selector (When Editing) */}
          {isEditing && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Meeting Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "scheduled" | "live" | "completed" | "cancelled")}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="scheduled">Scheduled</option>
                <option value="live">Live Now</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {/* Meeting Code Badge Notice */}
          <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-start gap-3 text-xs text-indigo-900">
            <div className="p-1 rounded-lg bg-indigo-100 text-indigo-600 mt-0.5">
              <Hash className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-indigo-950">
                {isEditing ? `Meeting Code: ${initialMeeting?.meetingCode}` : "Join with Meeting Code"}
              </p>
              <p className="text-[11px] text-indigo-700 mt-0.5 leading-relaxed">
                {isEditing
                  ? "Participants can continue to join using this existing meeting code."
                  : "No individual invites required. A unique meeting code will be generated and workspace members can join directly."}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleAttemptClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {isEditing ? "Saving Changes..." : "Scheduling..."}
                </>
              ) : (
                <>
                  {isEditing ? <Pencil className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                  {isEditing ? "Save Changes" : "Schedule Meeting"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Discard Confirmation Modal */}
      <ConfirmModal
        isOpen={showDiscardConfirm}
        title="Discard Changes?"
        message="You have unsaved changes in this form. Are you sure you want to cancel and discard them?"
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        onConfirm={() => {
          setShowDiscardConfirm(false);
          resetForm();
          onClose();
        }}
        onCancel={() => setShowDiscardConfirm(false)}
        isDanger={true}
      />
    </div>
  );
};
