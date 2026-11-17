import React, { useState, useEffect } from "react";
import { X, Search, Check, Copy, Loader2 } from "lucide-react";
import { worspaceAdminGetUsers } from "../../../services/authServices";
import { allocateRoomUsers } from "../../../services/roomServices";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  existingParticipantIds: string[];
  onInviteSuccess: () => void;
}

interface WorkspaceUser {
  _id: string;
  username: string;
  email: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  roomId,
  roomName,
  existingParticipantIds,
  onInviteSuccess,
}) => {
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(existingParticipantIds));
      setLoading(true);
      setError(null);
      worspaceAdminGetUsers(1, 100, "")
        .then((res) => {
          setUsers(res.data?.users || res.data || []);
        })
        .catch(() => {
          // If member calling, fallback or ignore
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, existingParticipantIds]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignored
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await allocateRoomUsers(roomId, Array.from(selectedIds));
      onInviteSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update room members");
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight">Invite to {roomName}</h3>
            <p className="text-xs text-gray-500">Manage granted members for this private room</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Copy link bar */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-200">
          <input
            type="text"
            readOnly
            value={window.location.href}
            className="flex-1 bg-transparent text-xs text-gray-600 font-mono focus:outline-none truncate"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition-colors shadow-2xs cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>

        {/* Member Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search team members by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Users list */}
        <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-xl">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-1 text-indigo-600" />
              <span className="text-xs">Loading members...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400">No workspace members found</div>
          ) : (
            filtered.map((u) => {
              const isChecked = selectedIds.has(u._id);
              return (
                <label
                  key={u._id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {u.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{u.username}</p>
                      <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSelect(u._id)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                </label>
              );
            })
          )}
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500 font-medium">{selectedIds.size} members selected</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {saving ? "Updating..." : "Save Access"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default InviteModal;

