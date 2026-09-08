import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRoom, deleteRoom, updateRoom } from "../../services/roomServices";
import RoomModal from "../../components/workspaceAdmin/RoomModal";
import RoomAccessModal from "../../components/workspaceAdmin/RoomAccessModal";
import RoomParticipantsModal from "../../components/workspaceAdmin/RoomParticipantsModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import { API_ROUTES } from "../../constants/Api_Routes";
import { Globe, Lock, ArrowLeft } from "lucide-react";

interface Room {
  _id: string;
  name: string;
  description: string;
  type: "public" | "private";
  status: "active" | "blocked";
  allowedUsers?: string[];
  createdAt: string;
}

const AdminRoomDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    actionType: "delete" | "block" | "unblock";
  }>({ isOpen: false, actionType: "delete" });

  const [actionLoading, setActionLoading] = useState(false);

  const fetchRoom = () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getRoom(id)
      .then((res) => {
        const data = res.data.data || res.data;
        setRoom(data);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Failed to load room");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRoom();
  }, [id]);

  const handleActionConfirm = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      if (confirmModal.actionType === "delete") {
        await deleteRoom(id);
        navigate(API_ROUTES.WORKSPACE_ADMIN.NAV.ROOMS);
      } else {
        const newStatus = confirmModal.actionType === "block" ? "blocked" : "active";
        await updateRoom(id, { status: newStatus });
        fetchRoom();
      }
      setConfirmModal({ isOpen: false, actionType: "delete" });
    } catch (err: any) {
      setError(err?.response?.data?.message || `Failed to ${confirmModal.actionType} room`);
      setConfirmModal({ isOpen: false, actionType: "delete" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-40" />
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div className="h-6 bg-gray-200 rounded w-64 mb-4" />
          <div className="h-4 bg-gray-100 rounded w-full mb-2" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <p className="text-base font-medium text-gray-600">Room not found</p>
        <p className="text-sm text-gray-400 mt-1 mb-6">{error}</p>
        <button
          onClick={() => navigate(API_ROUTES.WORKSPACE_ADMIN.NAV.ROOMS)}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Rooms
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <div>
        <button
          onClick={() => navigate(API_ROUTES.WORKSPACE_ADMIN.NAV.ROOMS)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Rooms
        </button>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4">
          {/* Room name + badges */}
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

      {/* Action Buttons */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Room Actions</h2>
        <div className="flex flex-wrap items-center gap-3">
          {/* Participants */}
          <button
            type="button"
            onClick={() => setIsParticipantsModalOpen(true)}
            className="rounded-md bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            Participants
          </button>

          {/* Manage Access — private only */}
          {room.type === "private" && (
            <button
              type="button"
              onClick={() => setIsAccessModalOpen(true)}
              className="rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              Manage Access
            </button>
          )}

          {/* Edit */}
          <button
            type="button"
            onClick={() => setIsRoomModalOpen(true)}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Edit Room
          </button>

          {/* Block / Unblock */}
          <button
            type="button"
            onClick={() =>
              setConfirmModal({
                isOpen: true,
                actionType: room.status === "active" ? "block" : "unblock",
              })
            }
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              room.status === "active"
                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            {room.status === "active" ? "Block Room" : "Unblock Room"}
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() =>
              setConfirmModal({ isOpen: true, actionType: "delete" })
            }
            className="rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
          >
            Delete Room
          </button>
        </div>
      </div>

      {/* Modals */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        onSuccess={() => {
          setIsRoomModalOpen(false);
          fetchRoom();
        }}
        room={room}
      />

      <RoomAccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        onSuccess={() => {
          setIsAccessModalOpen(false);
          fetchRoom();
        }}
        roomId={room._id}
        roomName={room.name}
        initialAllowedUsers={room.allowedUsers || []}
      />

      <RoomParticipantsModal
        isOpen={isParticipantsModalOpen}
        onClose={() => setIsParticipantsModalOpen(false)}
        roomId={room._id}
        roomName={room.name}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.actionType === "delete"
            ? "Delete Room?"
            : confirmModal.actionType === "block"
            ? "Block Room?"
            : "Unblock Room?"
        }
        message={
          confirmModal.actionType === "delete"
            ? `Are you sure you want to permanently delete "${room.name}"? This action cannot be undone.`
            : confirmModal.actionType === "block"
            ? `"${room.name}" will be blocked and users won't be able to join it.`
            : `"${room.name}" will be unblocked and active again.`
        }
        confirmLabel={
          confirmModal.actionType === "delete"
            ? "Delete"
            : confirmModal.actionType === "block"
            ? "Block"
            : "Unblock"
        }
        onConfirm={handleActionConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, actionType: "delete" })}
        isLoading={actionLoading}
        isDanger={confirmModal.actionType === "delete" || confirmModal.actionType === "block"}
      />
    </div>
  );
};

export default AdminRoomDetail;
