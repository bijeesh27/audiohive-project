import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRooms } from "../../services/roomServices";
import { DoorOpen, Lock, Globe, ArrowRight } from "lucide-react";
import { API_ROUTES } from "../../constants/Api_Routes";

interface Room {
  _id: string;
  name: string;
  description: string;
  type: "public" | "private";
  status: "active" | "blocked";
}

const Rooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      getRooms(page, limit, search)
        .then((res) => {
          const responseData = res.data.data || res.data;
          setRooms(responseData.rooms || []);
          setTotalPages(Math.ceil((responseData.total || 0) / limit));
        })
        .catch((err) => {
          setError(err?.response?.data?.message || "Failed to load rooms");
        })
        .finally(() => {
          setLoading(false);
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [page, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Rooms</h1>
          <p className="mt-1 text-sm text-gray-500">
            {loading ? "Loading..." : `Page ${page} of ${totalPages || 1}`}
          </p>
        </div>
        <input
          type="text"
          placeholder="Search rooms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <DoorOpen className="w-12 h-12 mb-3" />
          <p className="text-base font-medium">No rooms available</p>
          <p className="text-sm mt-1">You don't have access to any rooms yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room._id}
              onClick={() => navigate(API_ROUTES.MEMBER.NAV.ROOM_DETAIL(room._id))}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      room.type === "public" ? "bg-indigo-50" : "bg-orange-50"
                    }`}
                  >
                    {room.type === "public" ? (
                      <Globe className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Lock className="w-5 h-5 text-orange-600" />
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">{room.name}</h3>
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    room.status === "active"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                </span>
              </div>

              <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                {room.description || "No description provided."}
              </p>

              <div className="flex items-center justify-between">
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
                <span className="flex items-center gap-1 text-xs text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Enter <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md px-3 py-1.5 text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-md px-3 py-1.5 text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Rooms;
