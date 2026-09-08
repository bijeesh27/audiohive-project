import { useState, useEffect } from "react";
import { worspaceAdminGetUsers } from "../../services/authServices";
import { allocateRoomUsers } from "../../services/roomServices";
import { X } from "lucide-react";

interface RoomAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roomId: string;
  roomName: string;
  initialAllowedUsers?: string[];
}

interface User {
  _id: string;
  username: string;
  email: string;
}

export default function RoomAccessModal({
  isOpen,
  onClose,
  onSuccess,
  roomId,
  roomName,
  initialAllowedUsers = [],
}: RoomAccessModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setSelectedUsers(new Set(initialAllowedUsers));
      fetchWorkspaceUsers();
    }
  }, [isOpen, initialAllowedUsers]);

  const fetchWorkspaceUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch users without pagination for simple allocation (or fetch a large limit)
      const res = await worspaceAdminGetUsers(1, 100, "");
      setUsers(res.data.users || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load workspace users");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await allocateRoomUsers(roomId, Array.from(selectedUsers));
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save room access");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl relative max-h-[80vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Manage Access</h2>
        <p className="text-sm text-gray-500 mb-4">
          Select who can enter the private room: <span className="font-medium text-gray-900">{roomName}</span>
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto mb-4 border border-gray-200 rounded-md">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No users found in this workspace.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li key={user._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    id={`user-${user._id}`}
                    checked={selectedUsers.has(user._id)}
                    onChange={() => handleToggleUser(user._id)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor={`user-${user._id}`} className="flex flex-col flex-1 cursor-pointer">
                    <span className="text-sm font-medium text-gray-900">{user.username}</span>
                    <span className="text-xs text-gray-500">{user.email}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Access"}
          </button>
        </div>
      </div>
    </div>
  );
}
