import React, { useEffect, useState, useMemo } from "react";
import {
  Calendar,
  Plus,
  Search,
  Video,
  X,
} from "lucide-react";
import {
  getMeetings,
  getMeeting,
  cancelMeeting,
  deleteMeeting,
  type Meeting,
} from "../../services/meetingServices";
import { useAuth } from "../../context/AuthContext";
import { MeetingCard } from "../../components/meeting/MeetingCard";
import { ScheduleMeetingModal } from "../../components/meeting/ScheduleMeetingModal";
import { VideoCallPanel } from "../../components/room/VideoCallPanel";
import ConfirmModal from "../../components/common/ConfirmModal";

export const MeetingsPage: React.FC = () => {
  const { accessToken, username, userRole } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [search, setSearch] = useState("");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedMeetingForEdit, setSelectedMeetingForEdit] = useState<Meeting | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState("");

  // Active in-meeting call session
  const [activeMeetingCall, setActiveMeetingCall] = useState<Meeting | null>(null);

  // Extract current user ID from JWT token
  const currentUserId = useMemo(() => {
    if (!accessToken) return null;
    try {
      const payload = accessToken.split(".")[1];
      if (!payload) return null;
      const decoded = JSON.parse(atob(payload));
      return decoded?.id ?? null;
    } catch {
      return null;
    }
  }, [accessToken]);

  // Confirmation modal state for cancel and delete
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "cancel" | "delete" | null;
    meeting: Meeting | null;
  }>({
    isOpen: false,
    type: null,
    meeting: null,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchMeetings = () => {
    setLoading(true);
    setError(null);
    getMeetings({ page: 1, limit: 50 })
      .then((res) => {
        const data = res.data.data;
        setMeetings(data?.meetings || []);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Failed to load meetings.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMeetings();
  }, []);

  const handleOpenCancelModal = (meeting: Meeting) => {
    setActionError(null);
    setConfirmModal({
      isOpen: true,
      type: "cancel",
      meeting,
    });
  };

  const handleOpenDeleteModal = (meeting: Meeting) => {
    setActionError(null);
    setConfirmModal({
      isOpen: true,
      type: "delete",
      meeting,
    });
  };

  const handleCloseConfirmModal = () => {
    if (actionLoading) return;
    setConfirmModal({
      isOpen: false,
      type: null,
      meeting: null,
    });
    setActionError(null);
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.meeting || !confirmModal.type) return;

    setActionLoading(true);
    setActionError(null);

    try {
      if (confirmModal.type === "cancel") {
        await cancelMeeting(confirmModal.meeting._id);
      } else {
        await deleteMeeting(confirmModal.meeting._id);
      }
      setConfirmModal({
        isOpen: false,
        type: null,
        meeting: null,
      });
      fetchMeetings();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setActionError(msg || `Failed to ${confirmModal.type} meeting. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCodeInput.trim();
    if (!code) return;

    // Check local list first
    const matched = meetings.find(
      (m) =>
        m.meetingCode.toLowerCase() === code.toLowerCase() ||
        m._id === code
    );
    if (matched) {
      setActiveMeetingCall(matched);
      setJoinCodeInput("");
      return;
    }

    // Fetch from backend by code/id
    try {
      const res = await getMeeting(code);
      const meetingData = res.data.data;
      if (meetingData) {
        setActiveMeetingCall(meetingData);
        setJoinCodeInput("");
        return;
      }
    } catch {
      alert("Meeting not found or you do not have permission to join.");
    }
  };

  // Filter meetings by tab and search
  const filteredMeetings = useMemo(() => {
    const now = new Date();
    return meetings.filter((m) => {
      // Search filter
      const matchesSearch =
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.meetingCode.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      const endTime = new Date(m.endTime);

      if (activeTab === "cancelled") {
        return m.status === "cancelled";
      }

      if (activeTab === "past") {
        return m.status === "completed" || (endTime < now && m.status !== "cancelled");
      }

      // Upcoming
      return m.status !== "cancelled" && m.status !== "completed" && endTime >= now;
    });
  }, [meetings, activeTab, search]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Title & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Schedule, manage, and join video conferences with your team.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Join Code Form */}
          <form onSubmit={handleJoinByCode} className="flex items-center gap-1.5">
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              placeholder="Enter code (meet-...)"
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-36 sm:w-44"
            />
            <button
              type="submit"
              disabled={!joinCodeInput.trim()}
              className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium disabled:opacity-40 transition-colors"
            >
              Join
            </button>
          </form>

          {/* Schedule Meeting Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedMeetingForEdit(null);
              setIsScheduleOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* Active Live Call Session (if joined a meeting) */}
      {activeMeetingCall && (
        <div className="relative">
          <div className="flex items-center justify-between pb-2 mb-2">
            <div className="flex items-center gap-2 text-gray-900 text-sm font-semibold">
              <Video className="w-4 h-4 text-violet-600" />
              <span>{activeMeetingCall.title}</span>
              <span className="text-xs text-gray-500 font-normal">({activeMeetingCall.meetingCode})</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveMeetingCall(null)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Close meeting view"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <VideoCallPanel
            roomId={activeMeetingCall._id}
            roomName={activeMeetingCall.title}
            roomType="public"
            currentUsername={username || "User"}
          />
        </div>
      )}

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "upcoming"
                ? "bg-indigo-50 text-indigo-700 shadow-xs"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            Upcoming
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("past")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "past"
                ? "bg-indigo-50 text-indigo-700 shadow-xs"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            Past Meetings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cancelled")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "cancelled"
                ? "bg-indigo-50 text-indigo-700 shadow-xs"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            Cancelled
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings by title or code..."
            className="w-full sm:w-64 pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Meeting Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-48 bg-white border border-gray-200 rounded-2xl p-5 space-y-4"
            >
              <div className="h-5 bg-gray-200 rounded w-28" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-sm text-red-500">
          {error}
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200/80 text-center p-6">
          <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800">No {activeTab} meetings found</h3>
          <p className="text-xs text-gray-400 max-w-sm mt-1 mb-5">
            {activeTab === "upcoming"
              ? "You have no upcoming sessions scheduled. Coordinate with your team and create a new meeting."
              : "No meeting records match your search or filter."}
          </p>
          {activeTab === "upcoming" && (
            <button
              type="button"
              onClick={() => {
                setSelectedMeetingForEdit(null);
                setIsScheduleOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Schedule First Meeting
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMeetings.map((meeting) => (
            <MeetingCard
              key={meeting._id}
              meeting={meeting}
              currentUserId={currentUserId}
              userRole={userRole}
              onEdit={(m) => {
                setSelectedMeetingForEdit(m);
                setIsScheduleOpen(true);
              }}
              onCancel={handleOpenCancelModal}
              onDelete={handleOpenDeleteModal}
              onJoin={(m) => setActiveMeetingCall(m)}
            />
          ))}
        </div>
      )}

      {/* Schedule / Edit Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={isScheduleOpen}
        onClose={() => {
          setIsScheduleOpen(false);
          setSelectedMeetingForEdit(null);
        }}
        onSuccess={() => fetchMeetings()}
        initialMeeting={selectedMeetingForEdit}
      />

      {/* Confirm Cancel / Delete Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.type === "cancel" ? "Cancel Meeting" : "Delete Meeting"}
        message={
          confirmModal.type === "cancel"
            ? `Are you sure you want to cancel "${confirmModal.meeting?.title || "this meeting"}"? Participants will no longer be able to join.`
            : `Are you sure you want to permanently delete "${confirmModal.meeting?.title || "this meeting"}"? This action cannot be undone.`
        }
        confirmLabel={confirmModal.type === "cancel" ? "Cancel Meeting" : "Delete Meeting"}
        cancelLabel="Keep Meeting"
        onConfirm={handleConfirmAction}
        onCancel={handleCloseConfirmModal}
        isLoading={actionLoading}
        isDanger={true}
        error={actionError}
      />
    </div>
  );
};

export default MeetingsPage;
