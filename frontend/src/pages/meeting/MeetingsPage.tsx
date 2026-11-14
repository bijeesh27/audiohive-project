import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Video, X, CheckCircle, AlertCircle } from "lucide-react";
import {
  getMeetings,
  cancelMeeting,
  deleteMeeting,
} from "../../services/meetingServices";
import { useAuth } from "../../context/AuthContext";
import { JoinByCode } from "../../components/meeting/JoinByCode";
import { MeetingTabs } from "../../components/meeting/MeetingTabs";
import { MeetingSearch } from "../../components/meeting/MeetingSearch";
import { MeetingGroup } from "../../components/meeting/MeetingGroup";
import { MeetingCardSkeleton } from "../../components/meeting/MeetingCardSkeleton";
import { MeetingEmptyState } from "../../components/meeting/MeetingEmptyState";
import { ConfirmDialog } from "../../components/meeting/ConfirmDialog";
import { ScheduleMeetingModal } from "../../components/meeting/ScheduleMeetingModal";
import { VideoCallPanel } from "../../components/room/VideoCallPanel";
import type {
  MeetingItem,
  MeetingTab,
  MeetingTabCounts,
} from "../../types/meetings";

const DEFAULT_COUNTS: MeetingTabCounts = { upcoming: 0, past: 0, cancelled: 0 };

export const MeetingsPage: React.FC = () => {
  const { username } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL params
  const tabParam = (searchParams.get("tab") as MeetingTab) || "upcoming";
  const qParam = searchParams.get("q") || "";

  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [counts, setCounts] = useState<MeetingTabCounts>(DEFAULT_COUNTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Time-aware tick refreshed every 30 seconds
  const [currentTime, setCurrentTime] = useState(new Date());

  // Modal and Active Meeting Call states
  const [activeMeetingCall, setActiveMeetingCall] = useState<MeetingItem | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingItem | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Confirmation dialog
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: "cancel" | "delete" | null;
    meeting: MeetingItem | null;
    isLoading: boolean;
    error: string | null;
  }>({
    isOpen: false,
    type: null,
    meeting: null,
    isLoading: false,
    error: null,
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync URL parameters
  const updateParams = useCallback(
    (newParams: Record<string, string | null>) => {
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          Object.entries(newParams).forEach(([k, v]) => {
            if (v === null || v === "" || (k === "tab" && v === "upcoming")) {
              updated.delete(k);
            } else {
              updated.set(k, v);
            }
          });
          return updated;
        },
        { replace: false }
      );
    },
    [setSearchParams]
  );

  // Fetch meetings with server-side filters
  const fetchMeetings = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      setError(null);

      try {
        const res = await getMeetings({
          tab: tabParam,
          q: qParam || undefined,
          limit: 50,
        });

        const data = res.data?.data || res.data;
        setMeetings(data.meetings || []);
        if (data.counts) setCounts(data.counts);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to load meetings.";
        setError(msg);
      } finally {
        if (!isBackground) setLoading(false);
      }
    },
    [tabParam, qParam]
  );

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  // Refresh current time every 30s
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Background refetch every 30s when tab is visible
  const fetchRef = useRef(fetchMeetings);
  fetchRef.current = fetchMeetings;
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchRef.current(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Optimistic UI for Cancel and Delete
  const handleConfirmAction = async () => {
    const { meeting, type } = confirmState;
    if (!meeting || !type) return;

    const previousMeetings = [...meetings];
    const previousCounts = { ...counts };

    // Optimistically update local state
    if (type === "cancel") {
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === meeting.id || m._id === meeting._id ? { ...m, status: "cancelled" } : m
        )
      );
      setCounts((prev) => ({
        ...prev,
        upcoming: Math.max(0, prev.upcoming - 1),
        cancelled: prev.cancelled + 1,
      }));
    } else {
      setMeetings((prev) => prev.filter((m) => m.id !== meeting.id && m._id !== meeting._id));
      setCounts((prev) => ({
        ...prev,
        [tabParam]: Math.max(0, prev[tabParam] - 1),
      }));
    }

    setConfirmState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      if (type === "cancel") {
        await cancelMeeting(meeting.id || meeting._id);
        showToast(`Meeting "${meeting.title}" cancelled.`);
      } else {
        await deleteMeeting(meeting.id || meeting._id);
        showToast(`Meeting "${meeting.title}" deleted.`);
      }
      setConfirmState({ isOpen: false, type: null, meeting: null, isLoading: false, error: null });
      fetchMeetings(true);
    } catch (err: unknown) {
      // Rollback on failure
      setMeetings(previousMeetings);
      setCounts(previousCounts);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || `Failed to ${type} meeting.`;
      setConfirmState((prev) => ({ ...prev, isLoading: false, error: msg }));
      showToast(msg, "error");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Alert */}
      {toast && (
        <div
          role="status"
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold shadow-lg transition-all animate-fade-in ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">Meetings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Schedule, manage, and join video conferences with your team.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <JoinByCode onJoinMeeting={(m) => setActiveMeetingCall(m)} />
          <button
            type="button"
            onClick={() => {
              setEditingMeeting(null);
              setIsScheduleOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* Active Video Call Session */}
      {activeMeetingCall && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Video className="w-4 h-4 text-indigo-600" />
              <span>{activeMeetingCall.title}</span>
              <span className="text-xs text-gray-400 font-normal">({activeMeetingCall.meetingCode})</span>
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
            roomId={activeMeetingCall.id || activeMeetingCall._id}
            roomName={activeMeetingCall.title}
            roomType="public"
            currentUsername={username || "User"}
          />
        </div>
      )}

      {/* 2. Toolbar: Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-gray-100 shadow-xs">
        <MeetingTabs
          currentTab={tabParam}
          counts={counts}
          onTabChange={(tab) => updateParams({ tab })}
        />
        <MeetingSearch
          initialValue={qParam}
          onSearchChange={(q) => updateParams({ q })}
        />
      </div>

      {/* 3. Meetings Content States */}
      {error ? (
        <MeetingEmptyState
          type="error"
          errorMessage={error}
          onRetry={() => fetchMeetings()}
        />
      ) : loading ? (
        <MeetingCardSkeleton count={6} />
      ) : meetings.length === 0 ? (
        <MeetingEmptyState
          type={qParam ? "no-results" : "tab-empty"}
          tab={tabParam}
          searchQuery={qParam}
          onClearSearch={() => updateParams({ q: "" })}
          onSchedule={() => {
            setEditingMeeting(null);
            setIsScheduleOpen(true);
          }}
        />
      ) : (
        <MeetingGroup
          tab={tabParam}
          meetings={meetings}
          currentTime={currentTime}
          onEdit={(m) => {
            setEditingMeeting(m);
            setIsScheduleOpen(true);
          }}
          onCancel={(m) =>
            setConfirmState({
              isOpen: true,
              type: "cancel",
              meeting: m,
              isLoading: false,
              error: null,
            })
          }
          onDelete={(m) =>
            setConfirmState({
              isOpen: true,
              type: "delete",
              meeting: m,
              isLoading: false,
              error: null,
            })
          }
          onJoin={(m) => setActiveMeetingCall(m)}
        />
      )}

      {/* Schedule / Edit Modal */}
      <ScheduleMeetingModal
        isOpen={isScheduleOpen}
        initialMeeting={editingMeeting as unknown as import("../../services/meetingServices").Meeting}
        onClose={() => {
          setIsScheduleOpen(false);
          setEditingMeeting(null);
        }}
        onSuccess={() => {
          showToast(editingMeeting ? "Meeting updated successfully!" : "Meeting scheduled successfully!");
          fetchMeetings();
        }}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        type={confirmState.type}
        meetingTitle={confirmState.meeting?.title || "this meeting"}
        isLoading={confirmState.isLoading}
        error={confirmState.error}
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmState((p) => ({ ...p, isOpen: false }))}
      />
    </div>
  );
};

export default MeetingsPage;
