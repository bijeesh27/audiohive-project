import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getRoom,
  deleteRoom,
  updateRoom,
} from "../../services/roomServices";

import RoomModal from "../../components/workspaceAdmin/RoomModal";
import RoomAccessModal from "../../components/workspaceAdmin/RoomAccessModal";
import RoomParticipantsModal from "../../components/workspaceAdmin/RoomParticipantsModal";
import ConfirmModal from "../../components/common/ConfirmModal";

import { API_ROUTES } from "../../constants/Api_Routes";
import ActionButton from "../../components/common/ActionButton";

import {
  Globe,
  Lock,
  ArrowLeft,
  Pencil,
  ShieldBan,
  ShieldCheck,
  Trash2,
  UsersIcon,
  UserCog,
  type LucideIcon,
} from "lucide-react";

interface Room {
  _id: string;
  name: string;
  description: string;
  type: "public" | "private";
  status: "active" | "blocked";
  allowedUsers?: string[];
  createdAt: string;
}

type ActionType = "delete" | "block" | "unblock";

type ConfirmState =
  | { isOpen: false }
  | { isOpen: true; actionType: ActionType };

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    err.response &&
    typeof err.response === "object" &&
    "data" in err.response &&
    err.response.data &&
    typeof err.response.data === "object" &&
    "message" in err.response.data &&
    typeof (err.response.data as { message?: unknown }).message === "string"
  ) {
    return (err.response.data as { message: string }).message;
  }
  return fallback;
};



const AdminRoomDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] =
    useState(false);

  const [confirmModal, setConfirmModal] = useState<ConfirmState>({
    isOpen: false,
  });

  const [actionLoading, setActionLoading] = useState(false);

  // Prevents state updates from a fetch that's no longer relevant
  // (id changed again, or component unmounted before it resolved).
  const requestIdRef = useRef(0);

  const fetchRoom = useCallback(() => {
    if (!id) return;

    const thisRequestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    getRoom(id)
      .then((res) => {
        if (thisRequestId !== requestIdRef.current) return;
        const data = res.data.data || res.data;
        setRoom(data);
      })
      .catch((err: unknown) => {
        if (thisRequestId !== requestIdRef.current) return;
        setError(getErrorMessage(err, "Failed to load room"));
      })
      .finally(() => {
        if (thisRequestId !== requestIdRef.current) return;
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  const closeConfirmModal = () => setConfirmModal({ isOpen: false });

  const handleActionConfirm = async () => {
    if (!id || !confirmModal.isOpen) return;

    const { actionType } = confirmModal;
    setActionLoading(true);
    setError(null);

    try {
      if (actionType === "delete") {
        await deleteRoom(id);
        navigate(API_ROUTES.WORKSPACE_ADMIN.NAV.ROOMS);
        return; // navigating away; skip further state updates
      }

      const newStatus = actionType === "block" ? "blocked" : "active";
      await updateRoom(id, { status: newStatus });
      fetchRoom();
      closeConfirmModal();
    } catch (err: unknown) {
      setError(getErrorMessage(err, `Failed to ${actionType} room`));
      closeConfirmModal();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-5 w-36 bg-gray-200 rounded" />

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_348px] gap-10">
            <div className="h-52 bg-white border border-gray-200 rounded-xl" />
            <div className="h-52 bg-white border border-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="w-full max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-base font-medium text-gray-700">Room not found</p>

          <p className="text-sm text-gray-400 mt-1 mb-6">{error}</p>

          <button
            type="button"
            onClick={() => navigate(API_ROUTES.WORKSPACE_ADMIN.NAV.ROOMS)}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8">
      {/* BACK */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(API_ROUTES.WORKSPACE_ADMIN.NAV.ROOMS)}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Rooms
        </button>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_348px] gap-10 items-start">
        {/* ROOM CARD */}
        <div className="w-full min-w-0 bg-white border border-gray-200 rounded-xl shadow-sm px-8 py-7">
          <div className="flex items-start justify-between gap-8">
            {/* LEFT SIDE */}
            <div className="flex items-start gap-4 min-w-0 flex-1">
              {/* ROOM ICON */}
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                  room.type === "public" ? "bg-indigo-50" : "bg-orange-50"
                }`}
              >
                {room.type === "public" ? (
                  <Globe className="w-7 h-7 text-indigo-600" />
                ) : (
                  <Lock className="w-7 h-7 text-orange-600" />
                )}
              </div>

              {/* NAME + BADGES */}
              <div className="min-w-0 pt-1">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {room.name}
                </h1>

                <div className="flex items-center flex-wrap gap-2 mt-4">
                  {/* TYPE */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
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

                  {/* STATUS */}
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
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

            {/* RIGHT SIDE INFO */}
            <div className="shrink-0 text-right pt-1 max-w-[190px]">
              <p className="text-sm text-gray-400 whitespace-nowrap">
                Created{" "}
                {new Date(room.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>

              {room.description && (
                <p className="mt-1 text-sm text-gray-600 truncate">
                  {room.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ACTIONS CARD */}
        <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm px-7 py-5">
          <h2 className="text-sm font-semibold text-gray-700 text-center mb-5">
            Room Actions
          </h2>

          <div className="grid grid-cols-3 gap-3 justify-items-center">
            <ActionButton
              icon={UsersIcon}
              label="View Participants"
              onClick={() => setIsParticipantsModalOpen(true)}
              colorClasses="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 focus:ring-indigo-300"
            />

            {room.type === "private" ? (
              <ActionButton
                icon={UserCog}
                label="Manage Access"
                onClick={() => setIsAccessModalOpen(true)}
                colorClasses="bg-blue-50 text-blue-600 hover:bg-blue-100 focus:ring-blue-300"
              />
            ) : (
              <div />
            )}

            <ActionButton
              icon={Pencil}
              label="Edit Room"
              onClick={() => setIsRoomModalOpen(true)}
              colorClasses="bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300"
            />

            <ActionButton
              icon={room.status === "active" ? ShieldBan : ShieldCheck}
              label={room.status === "active" ? "Block Room" : "Unblock Room"}
              onClick={() =>
                setConfirmModal({
                  isOpen: true,
                  actionType: room.status === "active" ? "block" : "unblock",
                })
              }
              colorClasses={
                room.status === "active"
                  ? "bg-amber-50 text-amber-700 hover:bg-amber-100 focus:ring-amber-300"
                  : "bg-green-50 text-green-700 hover:bg-green-100 focus:ring-green-300"
              }
              disabled={actionLoading}
            />

            <ActionButton
              icon={Trash2}
              label="Delete Room"
              onClick={() => setConfirmModal({ isOpen: true, actionType: "delete" })}
              colorClasses="bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-300"
              disabled={actionLoading}
            />
          </div>
        </div>
      </div>

      {/* ROOM MODAL */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        onSuccess={() => {
          setIsRoomModalOpen(false);
          fetchRoom();
        }}
        room={room}
      />

      {/* ACCESS MODAL */}
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

      {/* PARTICIPANTS MODAL */}
      <RoomParticipantsModal
        isOpen={isParticipantsModalOpen}
        onClose={() => setIsParticipantsModalOpen(false)}
        roomId={room._id}
        roomName={room.name}
      />

      {/* CONFIRM MODAL */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={
          !confirmModal.isOpen
            ? ""
            : confirmModal.actionType === "delete"
            ? "Delete Room?"
            : confirmModal.actionType === "block"
            ? "Block Room?"
            : "Unblock Room?"
        }
        message={
          !confirmModal.isOpen
            ? ""
            : confirmModal.actionType === "delete"
            ? `Are you sure you want to permanently delete "${room.name}"? This action cannot be undone.`
            : confirmModal.actionType === "block"
            ? `"${room.name}" will be blocked and users won't be able to join it.`
            : `"${room.name}" will be unblocked and active again.`
        }
        confirmLabel={
          !confirmModal.isOpen
            ? ""
            : confirmModal.actionType === "delete"
            ? "Delete"
            : confirmModal.actionType === "block"
            ? "Block"
            : "Unblock"
        }
        onConfirm={handleActionConfirm}
        onCancel={closeConfirmModal}
        isLoading={actionLoading}
        isDanger={
          confirmModal.isOpen &&
          (confirmModal.actionType === "delete" ||
            confirmModal.actionType === "block")
        }
      />
    </div>
  );
};

export default AdminRoomDetail;