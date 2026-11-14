import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getRoom, getRoomParticipants } from "../../services/roomServices";
import { Globe, Lock, ArrowLeft, DoorOpen, ShieldOff, Users, Wifi, WifiOff, Video, Layout, FileText } from "lucide-react";
import { API_ROUTES } from "../../constants/Api_Routes";
import { HttpStatus } from "../../constants/httpStatus";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { RoomDocuments } from "../workspaceAdmin/RoomDocuments";
import { VideoCallPanel } from "../../components/room/VideoCallPanel";
import { Whiteboard } from "../../components/whiteboard/Whiteboard";

interface Room {
  _id: string;
  name: string;
  description: string;
  type: "public" | "private";
  status: "active" | "blocked";
  createdAt: string;
}

interface Participant {
  _id: string;
  username: string;
  email: string;
}

const RoomDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { username } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<{ userId: string; username: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"meeting" | "whiteboard" | "documents" | "participants">("meeting");
  const [presenceFilter, setPresenceFilter] = useState<"all" | "online" | "offline">("all");

  const onlineUserIdSet = useMemo(() => new Set(onlineUsers.map((u) => u.userId)), [onlineUsers]);

  const presenceMembers = useMemo(() => {
    const map = new Map<string, { id: string; username: string; email?: string; isOnline: boolean }>();

    participants.forEach((p) => {
      map.set(p._id, {
        id: p._id,
        username: p.username,
        email: p.email,
        isOnline: onlineUserIdSet.has(p._id),
      });
    });

    onlineUsers.forEach((u) => {
      if (!map.has(u.userId)) {
        map.set(u.userId, {
          id: u.userId,
          username: u.username,
          isOnline: true,
        });
      }
    });

    return Array.from(map.values());
  }, [participants, onlineUserIdSet, onlineUsers]);

  const onlineCount = useMemo(() => presenceMembers.filter((m) => m.isOnline).length, [presenceMembers]);
  const offlineCount = useMemo(() => presenceMembers.filter((m) => !m.isOnline).length, [presenceMembers]);

  const filteredPresenceMembers = useMemo(() => {
    if (presenceFilter === "online") return presenceMembers.filter((m) => m.isOnline);
    if (presenceFilter === "offline") return presenceMembers.filter((m) => !m.isOnline);
    return presenceMembers;
  }, [presenceMembers, presenceFilter]);

  useEffect(() => {
    if (!id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    setAccessDenied(false);
    getRoom(id)
      .then((res) => {
        const data = res.data.data || res.data;
        setRoom(data);
      })
      .catch((err) => {
        const status = err?.response?.status;
        const msg = err?.response?.data?.message || "Failed to load room";
        if (status === HttpStatus.FORBIDDEN) {
          setAccessDenied(true);
        }
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticipantsLoading(true);
    getRoomParticipants(id)
      .then((res) => {
        const data = res.data.data;
        setParticipants(data?.participants || data?.users || []);
      })
      .catch(() => {
      })
      .finally(() => setParticipantsLoading(false));
  }, [id]);

 
  useEffect(() => {
    if (!id) return;

    const handlePresence = (users: { userId: string; username: string }[]) => {
      setOnlineUsers(users);
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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div className="h-6 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    if (accessDenied) {
      return (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="bg-red-50 rounded-full p-5 mb-5">
            <ShieldOff className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Access Restricted</h2>
          <p className="text-sm text-gray-500 text-center max-w-sm mb-1">
            This is a <span className="font-medium text-orange-600">private room</span>. You have not been granted access yet.
          </p>
          <p className="text-sm text-gray-400 text-center max-w-sm mb-8">
            Contact your Workspace Admin to request access.
          </p>
          <Link
            to={API_ROUTES.MEMBER.NAV.ROOMS}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Rooms
          </Link>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <DoorOpen className="w-12 h-12 mb-3" />
        <p className="text-base font-medium text-gray-600">Room not found</p>
        <p className="text-sm text-gray-400 mt-1 mb-6">{error}</p>
        <Link
          to={API_ROUTES.MEMBER.NAV.ROOMS}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Rooms
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(API_ROUTES.MEMBER.NAV.ROOMS)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Rooms
        </button>
      </div>

      {/* Room Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl ring-1 ${
                room.type === "public"
                  ? "bg-indigo-50 ring-indigo-100"
                  : "bg-orange-50 ring-orange-100"
              }`}
            >
              {room.type === "public" ? (
                <Globe className="w-7 h-7 text-indigo-600" />
              ) : (
                <Lock className="w-7 h-7 text-orange-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    room.type === "public"
                      ? "bg-indigo-50 text-indigo-700"
                      : "bg-orange-50 text-orange-700"
                  }`}
                >
                  {room.type === "public" ? (
                    <Globe className="w-3 h-3" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}
                  {room.type.charAt(0).toUpperCase() + room.type.slice(1)}
                </span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    room.status === "active"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-400">
            Created{" "}
            {new Date(room.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>

        {room.description && (
          <p className="mt-4 text-sm text-gray-500 leading-relaxed max-w-2xl">
            {room.description}
          </p>
        )}
      </div>

      {/* Room Tabs Navigation - underline style */}
      <div className="flex items-center gap-0 border-b border-gray-200 overflow-x-auto scrollbar-hide">
        {(
          [
            { key: "meeting", icon: Video, label: "Meeting & Video" },
            { key: "whiteboard", icon: Layout, label: "Collaborative Whiteboard" },
            { key: "documents", icon: FileText, label: "Documents" },
          ] as { key: "meeting" | "whiteboard" | "documents" | "participants"; icon: React.ElementType; label: string }[]
        ).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 whitespace-nowrap ${
              activeTab === key
                ? "text-violet-700"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            {activeTab === key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setActiveTab("participants")}
          className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 whitespace-nowrap ${
            activeTab === "participants"
              ? "text-violet-700"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Participants</span>
          <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-gray-100 text-gray-600 text-[10px] font-semibold px-1">
            {participants.length}
          </span>
          {activeTab === "participants" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Prominent Video Conference Hub (Full Screen Experience) — kept mounted to preserve call */}
      <div className={activeTab === "meeting" ? "block" : "hidden"}>
        <VideoCallPanel
          roomId={room._id}
          roomName={room.name}
          roomType={room.type}
          currentUsername={username ?? "You"}
        />
      </div>

      {/* Real-Time Collaborative Whiteboard */}
      <div className={activeTab === "whiteboard" ? "block h-[82vh] rounded-xl overflow-hidden border border-gray-200 shadow-lg" : "hidden"}>
        <Whiteboard roomId={room._id} />
      </div>

      {/* Room Documents */}
      <div className={activeTab === "documents" ? "block space-y-6" : "hidden"}>
        <RoomDocuments roomId={room._id} />
      </div>

      {/* Grid for Presence and Room Participants */}
      <div className={activeTab === "participants" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "hidden"}>
        {/* Room Presence (Online & Offline) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Room Presence</h2>
                <p className="text-xs text-gray-400">
                  <span className="text-emerald-600 font-medium">{onlineCount} online</span>
                  {" • "}
                  <span>{offlineCount} offline</span>
                </p>
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setPresenceFilter("all")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  presenceFilter === "all"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                All ({presenceMembers.length})
              </button>
              <button
                type="button"
                onClick={() => setPresenceFilter("online")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  presenceFilter === "online"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-gray-500 hover:text-emerald-700"
                }`}
              >
                Online ({onlineCount})
              </button>
              <button
                type="button"
                onClick={() => setPresenceFilter("offline")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  presenceFilter === "offline"
                    ? "bg-white text-gray-800 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Offline ({offlineCount})
              </button>
            </div>
          </div>

          {filteredPresenceMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <WifiOff className="w-8 h-8 mb-2 text-gray-300" />
              <p className="text-sm text-gray-500">
                {presenceFilter === "online"
                  ? "No users currently online"
                  : presenceFilter === "offline"
                  ? "All participants are online"
                  : "No presence data"}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {filteredPresenceMembers.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${
                          u.isOnline ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {u.username.slice(0, 2).toUpperCase()}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                          u.isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-300"
                        }`}
                        title={u.isOnline ? "Online" : "Offline"}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.username}</p>
                      {u.email && <p className="text-xs text-gray-400 truncate">{u.email}</p>}
                    </div>
                  </div>

                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                      u.isOnline
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        u.isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                      }`}
                    />
                    {u.isOnline ? "Online" : "Offline"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Participants */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <div className="p-2 rounded-lg bg-indigo-50">
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Participants</h2>
              {!participantsLoading && (
                <p className="text-xs text-gray-400">
                  {participants.length} member{participants.length !== 1 ? "s" : ""} in this room
                </p>
              )}
            </div>
          </div>

          {participantsLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-200 rounded w-32" />
                    <div className="h-3 bg-gray-100 rounded w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Users className="w-8 h-8 mb-2 text-gray-300" />
              <p className="text-sm text-gray-500">No participants yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {participants.map((p) => {
                const isOnline = onlineUserIdSet.has(p._id);
                return (
                  <li key={p._id} className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-gray-50/60 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-semibold text-xs">
                          {p.username.slice(0, 2).toUpperCase()}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                            isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-300"
                          }`}
                          title={isOnline ? "Online" : "Offline"}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.username}</p>
                        <p className="text-xs text-gray-500 truncate">{p.email}</p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                        isOnline
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-50 text-gray-500 border-gray-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                        }`}
                      />
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
