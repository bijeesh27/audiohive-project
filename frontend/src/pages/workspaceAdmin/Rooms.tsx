import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRooms, deleteRoom, updateRoom } from "../../services/roomServices";
import RoomModal from "../../components/workspaceAdmin/RoomModal";
import RoomAccessModal from "../../components/workspaceAdmin/RoomAccessModal";
import RoomParticipantsModal from "../../components/workspaceAdmin/RoomParticipantsModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import Table from "../../components/common/Table";
import type { Column } from "../../components/common/Table";
import { API_ROUTES } from "../../constants/Api_Routes";

interface Room {
  _id: string;
  name: string;
  description: string;
  type: "public" | "private";
  status: "active" | "blocked";
  allowedUsers?: string[];
  createdAt: string;
}

const Rooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | undefined>(undefined);
  
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [accessRoom, setAccessRoom] = useState<Room | undefined>(undefined);

  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [participantsRoom, setParticipantsRoom] = useState<Room | undefined>(undefined);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    roomId: string;
    roomName: string;
    actionType: "delete" | "block" | "unblock";
  }>({ isOpen: false, roomId: "", roomName: "", actionType: "delete" });
  
  const [updatingRoomId, setUpdatingRoomId] = useState<string | null>(null);
  const limit = 5;

  const fetchRooms = () => {
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
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRooms();
    }, 400);
    return () => clearTimeout(timer);
  }, [page, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleActionConfirm = async () => {
    setUpdatingRoomId(confirmModal.roomId);
    try {
      if (confirmModal.actionType === "delete") {
        await deleteRoom(confirmModal.roomId);
      } else {
        const newStatus = confirmModal.actionType === "block" ? "blocked" : "active";
        await updateRoom(confirmModal.roomId, { status: newStatus });
      }
      fetchRooms();
      setConfirmModal({ isOpen: false, roomId: "", roomName: "", actionType: "delete" });
    } catch (err: any) {
      setError(err?.response?.data?.message || `Failed to ${confirmModal.actionType} room`);
      setConfirmModal({ isOpen: false, roomId: "", roomName: "", actionType: "delete" });
    } finally {
      setUpdatingRoomId(null);
    }
  };

  const handleEditClick = (room: Room) => {
    setEditingRoom(room);
    setIsRoomModalOpen(true);
  };

  const handleCreateClick = () => {
    setEditingRoom(undefined);
    setIsRoomModalOpen(true);
  };

  const handleAccessClick = (room: Room) => {
    setAccessRoom(room);
    setIsAccessModalOpen(true);
  };

  const handleParticipantsClick = (room: Room) => {
    setParticipantsRoom(room);
    setIsParticipantsModalOpen(true);
  };

  const columns: Column<Room>[] = [
    {
      header: "Room Info",
      render: (room) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{room.name}</span>
          <span className="text-xs text-gray-500 max-w-[200px] truncate">
            {room.description || "No description"}
          </span>
        </div>
      ),
    },
    {
      header: "Type",
      render: (room) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            room.type === "public" ? "bg-indigo-50 text-indigo-700" : "bg-orange-50 text-orange-700"
          }`}
        >
          {room.type.charAt(0).toUpperCase() + room.type.slice(1)}
        </span>
      ),
    },
    {
      header: "Status",
      render: (room) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            room.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
        </span>
      ),
    },
    {
      header: "Created",
      render: (room) => (
        <span className="text-sm text-gray-700">
          {new Date(room.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (room) => (
        <button
          type="button"
          onClick={() => navigate(API_ROUTES.WORKSPACE_ADMIN.NAV.ROOM_DETAIL(room._id))}
          className="rounded-md bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Rooms</h1>
          <p className="mt-1 text-sm text-gray-500">
            {loading ? "Loading..." : `Page ${page} of ${totalPages || 1}`}
          </p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-4">
          <input
            type="text"
            placeholder="Search room name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={handleCreateClick}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            Create Room
          </button>
        </div>
      </div>

      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        onSuccess={() => {
          fetchRooms();
        }}
        room={editingRoom}
      />

      <RoomAccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        onSuccess={() => fetchRooms()}
        roomId={accessRoom?._id || ""}
        roomName={accessRoom?.name || ""}
        initialAllowedUsers={accessRoom?.allowedUsers || []}
      />

      <RoomParticipantsModal
        isOpen={isParticipantsModalOpen}
        onClose={() => setIsParticipantsModalOpen(false)}
        roomId={participantsRoom?._id || ""}
        roomName={participantsRoom?.name || ""}
      />

      <Table
        columns={columns}
        data={rooms}
        keyExtractor={(r) => r._id}
        loading={loading}
        error={error}
        emptyMessage="No rooms found."
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
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
            ? `Are you sure you want to permanently delete "${confirmModal.roomName}"? This action cannot be undone.`
            : confirmModal.actionType === "block"
            ? `"${confirmModal.roomName}" will be blocked and users won't be able to join it.`
            : `"${confirmModal.roomName}" will be unblocked and active again.`
        }
        confirmLabel={
          confirmModal.actionType === "delete"
            ? "Delete"
            : confirmModal.actionType === "block"
            ? "Block"
            : "Unblock"
        }
        onConfirm={handleActionConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, roomId: "", roomName: "", actionType: "delete" })}
        isLoading={updatingRoomId === confirmModal.roomId}
        isDanger={confirmModal.actionType === "delete" || confirmModal.actionType === "block"}
      />
    </div>
  );
};

export default Rooms;
