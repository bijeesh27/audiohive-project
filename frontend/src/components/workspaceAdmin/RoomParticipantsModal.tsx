import { useState, useEffect } from "react";
import { getRoomParticipants, removeRoomUser } from "../../services/roomServices";
import { X, UserMinus, Users } from "lucide-react";

interface RoomParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
}

interface Participant {
  _id: string;
  username: string;
  email: string;
}

export default function RoomParticipantsModal({
  isOpen,
  onClose,
  roomId,
  roomName,
}: RoomParticipantsModalProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchParticipants = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRoomParticipants(roomId);
      setParticipants(res.data.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load participants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && roomId) {
      fetchParticipants();
    }
  }, [isOpen, roomId]);

  const handleRemove = async (userId: string) => {
    setRemovingId(userId);
    setError(null);
    try {
      await removeRoomUser(roomId, userId);
      setParticipants((prev) => prev.filter((p) => p._id !== userId));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to remove user");
    } finally {
      setRemovingId(null);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl relative max-h-[80vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-indigo-50">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Participants</h2>
            <p className="text-sm text-gray-500">
              Members with access to{" "}
              <span className="font-medium text-gray-900">{roomName}</span>
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="my-3 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto mt-4 border border-gray-200 rounded-md">
          {loading ? (
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
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Users className="w-10 h-10 mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No participants yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Use "Manage Access" to add users to this room.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {participants.map((participant) => (
                <li
                  key={participant._id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar / Initials */}
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-indigo-700">
                      {getInitials(participant.username)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {participant.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{participant.email}</p>
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(participant._id)}
                    disabled={removingId === participant._id}
                    title="Remove from room"
                    className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <UserMinus className="w-4 h-4" />
                    {removingId === participant._id ? "Removing..." : "Remove"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {!loading && participants.length > 0 && (
          <p className="mt-3 text-xs text-gray-400 text-right">
            {participants.length} participant{participants.length !== 1 ? "s" : ""}
          </p>
        )}

        <div className="pt-4 flex justify-end border-t border-gray-100 mt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
