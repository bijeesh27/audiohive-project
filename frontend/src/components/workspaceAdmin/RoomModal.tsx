import { useState, useEffect } from "react";
import { createRoom, updateRoom } from "../../services/roomServices";
import type { CreateRoomData, UpdateRoomData } from "../../services/roomServices";
import { X } from "lucide-react";

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  room?: any; // If provided, it's edit mode
}

export default function RoomModal({ isOpen, onClose, onSuccess, room }: RoomModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "public",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || "",
        description: room.description || "",
        type: room.type || "public",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        type: "public",
      });
    }
    setError(null);
  }, [room, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Room name is required");
      return;
    }

    setLoading(true);

    try {
      if (room) {
        const updateData: UpdateRoomData = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          type: formData.type as "public" | "private",
        };
        await updateRoom(room._id, updateData);
      } else {
        const createData: CreateRoomData = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          type: formData.type as "public" | "private",
        };
        await createRoom(createData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || `Failed to ${room ? 'update' : 'create'} room`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {room ? "Edit Room" : "Create New Room"}
        </h2>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="E.g., Engineering Team"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              placeholder="What is this room for?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="public"
                  checked={formData.type === "public"}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Public</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="private"
                  checked={formData.type === "private"}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Private</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {formData.type === "public" ? "Anyone in the workspace can join." : "Only invited members can join."}
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : room ? "Save Changes" : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
