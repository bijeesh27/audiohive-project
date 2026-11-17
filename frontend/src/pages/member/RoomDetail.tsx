import React, { useEffect, useState, useMemo, useRef, lazy, Suspense } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  DoorOpen,
  ShieldOff,
  ArrowLeft,
  AlertCircle,
  WifiOff,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { API_ROUTES } from "../../constants/Api_Routes";
import { HttpStatus } from "../../constants/httpStatus";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { getRoom, getRoomParticipants, updateRoom } from "../../services/roomServices";
import type { RoomDetailData, ParticipantItem } from "../../types/rooms";
import { RoomHeader } from "../../components/room/workspace/RoomHeader";
import { RoomTabs } from "../../components/room/workspace/RoomTabs";
import type { RoomTabKey } from "../../components/room/workspace/RoomTabs";
import { CardSkeleton, Skeleton } from "../../components/common/Skeleton";
import { LoungeView } from "../../components/room/lounge/LoungeView";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";

// Lazy-load heavier tab components so sockets & media resources are cleaned up when unmounted
const VoiceAndChatSection = lazy(() =>
  import("../../components/room/workspace/VoiceAndChatSection").then((m) => ({ default: m.VoiceAndChatSection }))
);
const VideoCallPanel = lazy(() =>
  import("../../components/room/VideoCallPanel").then((m) => ({ default: m.VideoCallPanel }))
);
const WhiteboardCanvas = lazy(() =>
  import("../../components/room/workspace/WhiteboardCanvas").then((m) => ({ default: m.WhiteboardCanvas }))
);
const DocumentList = lazy(() =>
  import("../../components/room/workspace/DocumentList").then((m) => ({ default: m.DocumentList }))
);
const ParticipantList = lazy(() =>
  import("../../components/room/workspace/ParticipantList").then((m) => ({ default: m.ParticipantList }))
);

const RoomDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { socket, isConnected } = useSocket();
  const { username } = useAuth();

  // Tab State synced with URL query (?tab=voice|video|whiteboard|documents|participants)
  const tabParam = searchParams.get("tab") as RoomTabKey | null;
  const activeTab: RoomTabKey =
    tabParam && ["voice", "video", "whiteboard", "documents", "participants"].includes(tabParam)
      ? tabParam
      : "voice";

  const handleTabChange = (newTab: RoomTabKey) => {
    setSearchParams({ tab: newTab }, { replace: true });
  };

  // Room Core State
  const [room, setRoom] = useState<RoomDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Leave Confirmation State (for Browser Back Button & Leave Actions)
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);
  const isLeavingConfirmedRef = useRef(false);

  // Trap browser back button (popstate) while inside the room
  useEffect(() => {
    if (loading || !room || error || accessDenied) return;

    // Buffer current room state in history so popping it triggers popstate without unmounting
    window.history.pushState({ inRoom: true }, "", window.location.href);

    const handlePopState = () => {
      if (isLeavingConfirmedRef.current) return;
      // Re-push buffer so React Router does not navigate away
      window.history.pushState({ inRoom: true }, "", window.location.href);
      setShowLeaveConfirmModal(true);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [loading, Boolean(room), Boolean(error), accessDenied]);

  const handleConfirmLeave = () => {
    isLeavingConfirmedRef.current = true;
    setShowLeaveConfirmModal(false);
    navigate(API_ROUTES.MEMBER.NAV.ROOMS);
  };

  const handleCancelLeave = () => {
    setShowLeaveConfirmModal(false);
  };

  // Participants & Shared Presence State
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<{ userId: string; username: string }[]>([]);

  // Document Count for Tab Badge
  const [documentCount, setDocumentCount] = useState<number | undefined>(undefined);

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [settingsDesc, setSettingsDesc] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // 1. Fetch Room Data
  const loadRoom = () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setAccessDenied(false);

    getRoom(id)
      .then((res) => {
        const data = res.data.data || res.data;
        setRoom(data);
        setSettingsName(data.name || "");
        setSettingsDesc(data.description || "");
      })
      .catch((err) => {
        const status = err?.response?.status;
        const msg = err?.response?.data?.message || "Failed to load room workspace";
        if (status === HttpStatus.FORBIDDEN) {
          setAccessDenied(true);
        }
        setError(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRoom();
  }, [id]);

  // 2. Fetch Room Participants
  const loadParticipants = () => {
    if (!id) return;
    setParticipantsLoading(true);
    setParticipantsError(null);

    getRoomParticipants(id, { page: 1, limit: 100 })
      .then((res) => {
        const data = res.data?.data;
        const list = data?.participants || data?.users || [];
        setParticipants(list);
      })
      .catch(() => {
        setParticipantsError("Failed to load participants");
      })
      .finally(() => setParticipantsLoading(false));
  };

  useEffect(() => {
    loadParticipants();
  }, [id]);

  // 3. Single Shared Realtime Presence Store
  useEffect(() => {
    if (!id || !socket) return;

    const handlePresence = (users: { userId: string; username: string }[]) => {
      if (Array.isArray(users)) {
        setOnlineUsers(users);
      }
    };

    socket.on("room:presence-update", handlePresence);

    const emitJoin = () => {
      socket.emit("room:join", id);
      socket.emit("room:get-presence", id);
    };

    if (socket.connected) {
      emitJoin();
    } else {
      socket.once("connect", emitJoin);
    }

    return () => {
      if (socket.connected) socket.emit("room:leave", id);
      socket.off("room:presence-update", handlePresence);
      socket.off("connect", emitJoin);
    };
  }, [id, socket]);

  const onlineUserIdSet = useMemo(() => new Set(onlineUsers.map((u) => u.userId)), [onlineUsers]);

  // Enriched Room data with real-time online count
  const enrichedRoom: RoomDetailData | null = useMemo(() => {
    if (!room) return null;
    return {
      ...room,
      onlineCount: onlineUsers.length,
    };
  }, [room, onlineUsers]);

  // Room Settings update handler
  const handleSaveSettings = async () => {
    if (!room || !settingsName.trim()) return;
    try {
      setIsSavingSettings(true);
      await updateRoom(room._id, {
        name: settingsName.trim(),
        description: settingsDesc.trim(),
      });
      setRoom((prev) => (prev ? { ...prev, name: settingsName.trim(), description: settingsDesc.trim() } : null));
      setShowSettingsModal(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update room settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Loading State Skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-28 rounded-md" />
        <CardSkeleton />
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="h-[460px] bg-white rounded-2xl border border-gray-200 p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  // 403 Access Denied State
  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 shadow-xs">
          <ShieldOff className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-1">Access Restricted</h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-sm mb-2 leading-relaxed">
          This is a <strong className="text-purple-600 font-semibold">private room</strong>. You don't have access to this room yet.
        </p>
        <p className="text-xs text-gray-400 max-w-sm mb-6">
          Please ask a Workspace Admin or the room owner to grant you access.
        </p>
        <Link
          to={API_ROUTES.MEMBER.NAV.ROOMS}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Rooms</span>
        </Link>
      </div>
    );
  }

  // 404 Room Not Found or General Error
  if (error || !enrichedRoom) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-gray-100 text-gray-400 flex items-center justify-center mb-4">
          <DoorOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-1">Room not found</h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
          {error || "The requested room does not exist or has been removed from this workspace."}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadRoom}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
          <Link
            to={API_ROUTES.MEMBER.NAV.ROOMS}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Rooms</span>
          </Link>
        </div>
      </div>
    );
  }

  const isRoomAdminOrOwner = enrichedRoom.myRole === "owner" || enrichedRoom.myRole === "admin";
  const isOwner = enrichedRoom.myRole === "owner";

  return (
    <div className="space-y-4">
      {/* Socket Disconnected Alert Banner */}
      {!isConnected && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs animate-pulse">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Reconnecting...</strong> Real-time edits, whiteboard synchronization, and live presence are temporarily paused.
            </span>
          </div>
          <span className="font-semibold text-[11px] uppercase tracking-wider text-amber-600">Offline</span>
        </div>
      )}

      {/* Dedicated Lounge View for Default Workspace Lounge */}
      {enrichedRoom.isDefault || enrichedRoom.type === "lounge" ? (
        <LoungeView
          room={enrichedRoom}
          participants={participants}
          onlineUsers={onlineUsers}
          onLeaveRoom={() => setShowLeaveConfirmModal(true)}
        />
      ) : (
        <>
          {/* Page Header (~88px compact, with badges, counts, and actions) */}
          <RoomHeader
            room={enrichedRoom}
            onOpenSettings={() => setShowSettingsModal(true)}
            onOpenInvite={() => handleTabChange("participants")}
            onRoomLeft={() => navigate(API_ROUTES.MEMBER.NAV.ROOMS)}
            onRequestLeave={() => setShowLeaveConfirmModal(true)}
          />

          {/* Tabs Navigation (Underline indigo, keyboard accessible, synced with URL) */}
          <RoomTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            documentCount={documentCount}
            participantCount={participants.length}
          />

          {/* Tab Panels: Viewport-fitting for Voice, Video & Whiteboard, unmounted when inactive */}
          <div className="relative">
        {/* Tab 1: Voice & Group Chat (audio-first virtual office initial view) */}
        {activeTab === "voice" && (
          <Suspense
            fallback={
              <div className="h-[460px] bg-white rounded-2xl flex items-center justify-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            }
          >
            <VoiceAndChatSection
              roomId={enrichedRoom._id}
              roomName={enrichedRoom.name}
            />
          </Suspense>
        )}

        {/* Tab 2: Meeting & Video (Lobby pre-join with camera/mic OFF by default + Full-screen call experience) */}
        {activeTab === "video" && (
          <Suspense
            fallback={
              <div className="h-[460px] bg-slate-950 rounded-2xl flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            }
          >
            <VideoCallPanel
              roomId={enrichedRoom._id}
              roomName={enrichedRoom.name}
              roomType={enrichedRoom.type === "private" ? "private" : "public"}
              currentUsername={username ?? "You"}
            />
          </Suspense>
        )}

        {/* Tab 2: Collaborative Whiteboard (dark canvas filling height, zero page scrollbar) */}
        {activeTab === "whiteboard" && (
          <Suspense
            fallback={
              <div className="h-[520px] bg-[#070B14] rounded-2xl flex items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            }
          >
            <WhiteboardCanvas
              roomId={enrichedRoom._id}
              onlinePresenceUsers={onlineUsers}
            />
          </Suspense>
        )}

        {/* Tab 3: Documents (Room Resources, filters, sort, drag & drop, pagination) */}
        {activeTab === "documents" && (
          <Suspense
            fallback={
              <div className="p-12 text-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
                <span className="text-xs">Loading resources...</span>
              </div>
            }
          >
            <DocumentList
              roomId={enrichedRoom._id}
              isRoomAdminOrOwner={isRoomAdminOrOwner}
              onTotalCountChange={setDocumentCount}
            />
          </Suspense>
        )}

        {/* Tab 4: Participants (ONE unified list, search, presence dots, role actions, invite modal) */}
        {activeTab === "participants" && (
          <Suspense
            fallback={
              <div className="p-12 text-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
                <span className="text-xs">Loading participants...</span>
              </div>
            }
          >
            {participantsError ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                <p className="text-sm font-semibold text-gray-800">{participantsError}</p>
                <button
                  type="button"
                  onClick={loadParticipants}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
                >
                  Retry loading participants
                </button>
              </div>
            ) : (
              <ParticipantList
                roomId={enrichedRoom._id}
                roomName={enrichedRoom.name}
                roomType={enrichedRoom.type === "private" ? "private" : "public"}
                participants={participants}
                onlineUserIdSet={onlineUserIdSet}
                canManage={isRoomAdminOrOwner}
                isOwner={isOwner}
                isLoading={participantsLoading}
                onRefresh={loadParticipants}
              />
            )}
          </Suspense>
        )}
      </div>
      </>
      )}

      {/* Room Settings Modal (For Owner & Admin) */}
      {showSettingsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-900">Room Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Room Name</label>
                <input
                  type="text"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={settingsDesc}
                  onChange={(e) => setSettingsDesc(e.target.value)}
                  placeholder="What is this room used for?"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSavingSettings || !settingsName.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isSavingSettings ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Room / Lounge Confirmation Dialog (Browser Back & Leave Actions) */}
      <ConfirmDialog
        isOpen={showLeaveConfirmModal}
        title={enrichedRoom?.isDefault || enrichedRoom?.type === "lounge" ? "Leave Lounge" : "Leave Room"}
        message={
          <div>
            <p>
              Are you sure you want to leave{" "}
              <strong className="text-gray-900">{enrichedRoom?.name || "this room"}</strong> and return to the rooms list?
            </p>
            {enrichedRoom?.type === "private" && (
              <p className="mt-2 text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                This is a private room. You may need an invite to rejoin later.
              </p>
            )}
          </div>
        }
        confirmLabel={enrichedRoom?.isDefault || enrichedRoom?.type === "lounge" ? "Leave Lounge" : "Leave Room"}
        cancelLabel={enrichedRoom?.isDefault || enrichedRoom?.type === "lounge" ? "Stay in Lounge" : "Stay in Room"}
        isDestructive
        onConfirm={handleConfirmLeave}
        onCancel={handleCancelLeave}
      />
    </div>
  );
};

export default RoomDetail;
