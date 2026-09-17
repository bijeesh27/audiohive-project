import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getRoom, getRoomParticipants } from "../../services/roomServices";
import { Globe, Lock, ArrowLeft, DoorOpen, ShieldOff, Users, Wifi } from "lucide-react";
import { API_ROUTES } from "../../constants/Api_Routes";
import { useSocket } from "../../context/SocketContext";

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
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<{ userId: string; username: string }[]>([]);

  useEffect(() => {
    if (!id) return;
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
        if (status === 403) {
          setAccessDenied(true);
        }
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setParticipantsLoading(true);
    getRoomParticipants(id)
      .then((res) => {
        setParticipants(res.data.data || []);
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
              className={`p-3 rounded-xl ${
                room.type === "public" ? "bg-indigo-50" : "bg-orange-50"
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

          <div className="text-sm text-gray-400">
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

      {/* Room Content Area — placeholder for future features (chat, audio, etc.) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-h-[200px] flex flex-col items-center justify-center text-gray-400">
        <DoorOpen className="w-14 h-14 mb-4 text-gray-300" />
        <p className="text-base font-medium text-gray-500">You're inside {room.name}</p>
        <p className="text-sm mt-1">
          {room.type === "public"
            ? "This is a public room — all workspace members can join."
            : "This is a private room — only invited members can join."}
        </p>
      </div>

      {/* Online Now — real-time presence */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="p-2 rounded-lg bg-green-50">
            <Wifi className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Online Now</h2>
            <p className="text-xs text-gray-400">
              {onlineUsers.length} user{onlineUsers.length !== 1 ? "s" : ""} currently in this room
            </p>
          </div>
        </div>

        {onlineUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Wifi className="w-7 h-7 mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">No one else is here right now</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {onlineUsers.map((u) => (
              <li key={u.userId} className="flex items-center gap-3 px-6 py-3">
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-green-700">
                      {u.username.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  {/* Online dot */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                </div>
                <p className="text-sm font-medium text-gray-900">{u.username}</p>
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
          <ul className="divide-y divide-gray-100">
            {participants.map((p) => (
              <li key={p._id} className="flex items-center gap-3 px-6 py-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-xs font-semibold text-indigo-700">
                    {p.username.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.username}</p>
                  <p className="text-xs text-gray-500 truncate">{p.email}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RoomDetail;
