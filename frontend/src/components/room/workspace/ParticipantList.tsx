import React, { useState, useMemo } from "react";
import { Users, Search, UserPlus, Loader2 } from "lucide-react";
import type { ParticipantItem } from "../../../types/rooms";
import { ParticipantRow } from "./ParticipantRow";
import { InviteModal } from "./InviteModal";
import { ConfirmDialog } from "../../common/ConfirmDialog";
import { EmptyState } from "../../common/EmptyState";
import { removeRoomUser, updateMemberRole } from "../../../services/roomServices";

interface ParticipantListProps {
  roomId: string;
  roomName: string;
  roomType: "public" | "private";
  participants: ParticipantItem[];
  onlineUserIdSet: Set<string>;
  canManage: boolean;
  isOwner: boolean;
  isLoading: boolean;
  onRefresh: () => void;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  roomId,
  roomName,
  roomType,
  participants,
  onlineUserIdSet,
  canManage,
  isOwner,
  isLoading,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<"all" | "online" | "offline">("all");
  const [search, setSearch] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ userId: string; username: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Sync online presence with shared store
  const mergedParticipants: ParticipantItem[] = useMemo(() => {
    return participants.map((p) => ({
      ...p,
      isOnline: onlineUserIdSet.has(p._id),
    }));
  }, [participants, onlineUserIdSet]);

  const onlineCount = useMemo(() => mergedParticipants.filter((p) => p.isOnline).length, [mergedParticipants]);
  const offlineCount = useMemo(() => mergedParticipants.length - onlineCount, [mergedParticipants, onlineCount]);

  // Filter & Sort (Online first, then by name)
  const filteredParticipants = useMemo(() => {
    let list = [...mergedParticipants];

    if (filter === "online") list = list.filter((p) => p.isOnline);
    if (filter === "offline") list = list.filter((p) => !p.isOnline);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.username.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      return a.username.localeCompare(b.username);
    });

    return list;
  }, [mergedParticipants, filter, search]);

  const handleRoleChange = async (userId: string, newRole: "admin" | "member") => {
    try {
      await updateMemberRole(roomId, userId, newRole);
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update role");
    }
  };

  const handleConfirmRemove = async () => {
    if (!removeTarget) return;
    try {
      setIsRemoving(true);
      await removeRoomUser(roomId, removeTarget.userId);
      setRemoveTarget(null);
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to remove member");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card: Title, Counts, Invite action */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Participants</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            <span className="font-semibold text-gray-800">{mergedParticipants.length}</span> members ·{" "}
            <span className="text-emerald-600 font-semibold">{onlineCount} online</span> ·{" "}
            <span>{offlineCount} offline</span>
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Members</span>
          </button>
        )}
      </div>

      {/* Toolbar: Segmented Controls + Search */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Segmented control: All | Online | Offline */}
        <div className="flex items-center bg-gray-100 p-0.5 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              filter === "all" ? "bg-white text-gray-900 font-semibold shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            All ({mergedParticipants.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("online")}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              filter === "online" ? "bg-white text-emerald-700 font-semibold shadow-xs" : "text-gray-500 hover:text-emerald-700"
            }`}
          >
            Online ({onlineCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("offline")}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              filter === "offline" ? "bg-white text-gray-800 font-semibold shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Offline ({offlineCount})
          </button>
        </div>

        {/* Search Box */}
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search participants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Participants Unified List */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden max-h-[60vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <span className="text-xs font-medium">Loading participants...</span>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? "No matching participants" : "No participants found"}
            description={
              search
                ? `No participants found matching "${search}".`
                : "Invite colleagues to collaborate in this room."
            }
            actionLabel={canManage ? "Invite Members" : undefined}
            onAction={canManage ? () => setShowInviteModal(true) : undefined}
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredParticipants.map((p) => (
              <ParticipantRow
                key={p._id}
                participant={p}
                canManage={canManage}
                isOwner={isOwner}
                onRoleChange={handleRoleChange}
                onRemove={(userId, username) => setRemoveTarget({ userId, username })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Remove Member Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(removeTarget)}
        title="Remove Participant"
        message={
          <div>
            <p>
              Are you sure you want to remove <strong className="text-gray-900 font-semibold">{removeTarget?.username}</strong> from this room?
            </p>
            {roomType === "private" && (
              <p className="mt-1 text-xs text-amber-600">They will lose access until re-invited.</p>
            )}
          </div>
        }
        confirmLabel="Remove"
        isDestructive
        isLoading={isRemoving}
        onConfirm={handleConfirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />

      {/* Invite Modal for Private Rooms */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomId={roomId}
        roomName={roomName}
        existingParticipantIds={participants.map((p) => p._id)}
        onInviteSuccess={onRefresh}
      />
    </div>
  );
};
export default ParticipantList;

