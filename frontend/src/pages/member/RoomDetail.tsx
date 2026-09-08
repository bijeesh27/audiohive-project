import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getRoom } from "../../services/roomServices";
import { Globe, Lock, ArrowLeft, DoorOpen, ShieldOff } from "lucide-react";
import { API_ROUTES } from "../../constants/Api_Routes";

interface Room {
  _id: string;
  name: string;
  description: string;
  type: "public" | "private";
  status: "active" | "blocked";
  createdAt: string;
}

const RoomDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

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
    // Access denied — private room not allocated to this member
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

    // Generic not found
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-gray-400">
        <DoorOpen className="w-14 h-14 mb-4 text-gray-300" />
        <p className="text-base font-medium text-gray-500">You're inside {room.name}</p>
        <p className="text-sm mt-1">
          {room.type === "public"
            ? "This is a public room — all workspace members can join."
            : "This is a private room — only invited members can join."}
        </p>
      </div>
    </div>
  );
};

export default RoomDetail;
