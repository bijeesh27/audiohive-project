import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Shield, UserMinus } from "lucide-react";
import type { ParticipantItem } from "../../../types/rooms";
import { formatRelativeTime } from "../../common/formatters";

interface ParticipantRowProps {
  participant: ParticipantItem;
  canManage: boolean;
  isOwner?: boolean;
  onRoleChange: (userId: string, newRole: "admin" | "member") => void;
  onRemove: (userId: string, username: string) => void;
}

export const ParticipantRow: React.FC<ParticipantRowProps> = ({
  participant,
  canManage,
  onRoleChange,
  onRemove,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isUserOwner = participant.role === "owner";
  const avatarInitials = participant.username.substring(0, 2).toUpperCase();

  return (
    <div className="flex items-center justify-between p-3.5 sm:px-5 hover:bg-gray-50/70 border-b border-gray-100 last:border-b-0 transition-colors gap-3">
      {/* Left: Avatar with presence dot + name + email */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="relative shrink-0">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
              isUserOwner
                ? "bg-purple-100 text-purple-700 ring-2 ring-purple-200"
                : participant.role === "admin"
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {avatarInitials}
          </div>
          {/* Presence Dot */}
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
              participant.isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-300"
            }`}
            title={participant.isOnline ? "Online" : "Offline"}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate tracking-tight">
              {participant.username}
            </p>

            {/* Role Badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isUserOwner
                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                  : participant.role === "admin"
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200"
              }`}
            >
              {participant.role}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-gray-400">
            <span className="truncate max-w-[200px]">{participant.email}</span>
            {participant.createdAt && (
              <>
                <span className="text-gray-300">•</span>
                <span>Joined {formatRelativeTime(participant.createdAt)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Online / Offline status badge + Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
            participant.isOnline
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-gray-50 text-gray-500 border-gray-200"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              participant.isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
            }`}
          />
          {participant.isOnline ? "Online" : "Offline"}
        </span>

        {/* Admin/Owner Row Actions */}
        {canManage && !isUserOwner && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              title="Manage participant"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-30 w-44 rounded-xl bg-white border border-gray-100 shadow-xl py-1 text-xs text-gray-700 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onRoleChange(participant._id, participant.role === "admin" ? "member" : "admin");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{participant.role === "admin" ? "Demote to Member" : "Promote to Admin"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onRemove(participant._id, participant.username);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  <span>Remove from room</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default ParticipantRow;

