import React, { useState, useEffect, useMemo } from "react";
import { X, Calendar, Clock, Loader2, AlertCircle, Pencil, Sparkles } from "lucide-react";
import {
  createMeeting,
  updateMeeting,
  type Meeting,
} from "../../services/meetingServices";

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

const addMinutes = (timeStr: string, minutesToAdd: number) => {
  const [h, m] = timeStr.split(":").map(Number);
  const totalM = (h || 0) * 60 + (m || 0) + minutesToAdd;
  const newH = Math.floor(totalM / 60) % 24;
  const newM = totalM % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
};

const getDefaultDateTime = () => {
  const now = new Date();
  now.setHours(now.getHours() + 1, 0, 0, 0);
  const dateStr = formatLocalDate(now);
  const startStr = formatLocalTime(now);
  const endStr = addMinutes(startStr, 30);
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

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
      setFieldErrors({});
      setFormError(null);
    } else if (!initialMeeting && isOpen) {
      const def = getDefaultDateTime();
      setTitle("");
      setDescription("");
      setDate(def.dateStr);
      setStartTime(def.startStr);
      setEndTime(def.endStr);
      setStatus("scheduled");
      setFieldErrors({});
      setFormError(null);
    }
  }, [initialMeeting, isOpen]);

  // Live duration calculation
  const durationInfo = useMemo(() => {
    if (!date || !startTime || !endTime) return null;
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return { isValid: false, text: "Invalid duration" };
    const mins = Math.round(diffMs / 60000);
    const text = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60 ? `${mins % 60}m` : ""}`.trim() : `${mins} min`;
    return { isValid: true, text, minutes: mins };
  }, [date, startTime, endTime]);

  if (!isOpen) return null;

  const handlePresetDuration = (minutes: number) => {
    setEndTime(addMinutes(startTime, minutes));
    if (fieldErrors.time) setFieldErrors((prev) => ({ ...prev, time: "" }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Meeting title is required.";

    const now = new Date();
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    if (!isEditing && startDateTime.getTime() < now.getTime() - 2 * 60000) {
      errors.date = "Start time cannot be in the past.";
    }

    if (endDateTime.getTime() <= startDateTime.getTime()) {
      errors.time = "End time must be after start time.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || submitting) return;

    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    setSubmitting(true);
    setFormError(null);

    try {
      if (isEditing && initialMeeting) {
        await updateMeeting(initialMeeting._id || (initialMeeting as unknown as { id: string }).id, {
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
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to save meeting.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
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
              <p className="text-xs text-gray-500">Plan a session — anyone with the code can join</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: "" }));
              }}
              placeholder="e.g., Weekly Sync, Sprint Planning"
              className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 ${
                fieldErrors.title
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                  : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20"
              }`}
            />
            {fieldErrors.title && (
              <p className="text-[11px] text-red-600 mt-1">{fieldErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Agenda & Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key discussion topics..."
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Date & Times */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" /> Start
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" /> End
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {(fieldErrors.date || fieldErrors.time) && (
            <p className="text-[11px] text-red-600">
              {fieldErrors.date || fieldErrors.time}
            </p>
          )}

          {/* Duration Presets & Live Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 font-medium">Quick duration:</span>
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handlePresetDuration(mins)}
                  className="px-2 py-1 rounded-lg bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-[11px] font-semibold text-gray-700 transition-colors cursor-pointer"
                >
                  {mins}m
                </button>
              ))}
            </div>
            {durationInfo && (
              <span className="font-semibold text-indigo-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {durationInfo.text}
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? "Save Changes" : "Schedule Meeting"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
