import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  Lock,
  ArrowLeft,
  Share2,
  Check,
  MoreVertical,
  Settings,
  LogOut,
  Clock,
  Users,
} from "lucide-react";
import { API_ROUTES } from "../../../constants/Api_Routes";
import type { RoomDetailData } from "../../../types/rooms";
import { leaveRoom } from "../../../services/roomServices";
import { ConfirmDialog } from "../../common/ConfirmDialog";

interface RoomHeaderProps {
  room: RoomDetailData;
  onOpenSettings?: () => void;
  onOpenInvite?: () => void;
  onRoomLeft?: () => void;
  onRequestLeave?: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  room,
  onOpenSettings,
  onOpenInvite,
  onRoomLeft,
  onRequestLeave,
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showBackDialog, setShowBackDialog] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const canManageSettings = room.myRole === "owner" || room.myRole === "admin";
  const isOwner = room.myRole === "owner";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleConfirmLeave = async () => {
    try {
      setIsLeaving(true);
      setLeaveError(null);
      await leaveRoom(room._id);
      setShowLeaveDialog(false);
      if (onRoomLeft) {
        onRoomLeft();
      } else {
        navigate(API_ROUTES.MEMBER.NAV.ROOMS);
      }
    } catch (err: any) {
      setLeaveError(err?.response?.data?.message || "Failed to leave room");
    } finally {
      setIsLeaving(false);
    }
  };

  const formattedDate = new Date(room.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="space-y-2">
      {/* Back Link with Leave Room Confirmation */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => (onRequestLeave ? onRequestLeave() : setShowBackDialog(true))}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Rooms</span>
        </button>
      </div>

      {/* Main Compact Header Card (~88px min-h) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:px-6 sm:py-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Room Icon, Title, Badges, Online Count */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              room.type === "public" ? "bg-indigo-50 text-indigo-600" : "bg-purple-50 text-purple-600"
            }`}
          >
            {room.type === "public" ? <Globe className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight truncate max-w-md">
                {room.name}
              </h1>

              {/* Public/Private Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  room.type === "public"
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                    : "bg-purple-50 text-purple-700 border border-purple-100"
                }`}
              >
                {room.type === "public" ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {room.type === "public" ? "Public" : "Private"}
              </span>

              {/* Live / Idle status badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  room.isLive || room.onlineCount > 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : "bg-gray-100 text-gray-600 border border-gray-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    room.isLive || room.onlineCount > 0 ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                  }`}
                />
                {room.isLive || room.onlineCount > 0 ? "Live" : "Idle"}
              </span>
            </div>

            {/* Meta Row: One-line description, Member & Online counts, Created Date */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
              {room.description && (
                <span className="truncate max-w-sm text-gray-600 font-normal">{room.description}</span>
              )}
              {room.description && <span className="text-gray-300">•</span>}
              <span className="inline-flex items-center gap-1 text-gray-600 font-medium">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                {room.memberCount} {room.memberCount === 1 ? "member" : "members"},{" "}
                <span className="text-emerald-600 font-semibold">{room.onlineCount} online</span>
              </span>
              <span className="text-gray-300">•</span>
              <span className="inline-flex items-center gap-1 text-gray-400">
                <Clock className="w-3 h-3" />
                Created {formattedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Header Actions */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          {/* Invite Button */}
          <button
            type="button"
            onClick={room.type === "private" && onOpenInvite ? onOpenInvite : handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 active:bg-indigo-100 text-indigo-700 text-xs font-medium border border-indigo-200/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
            title="Invite to room"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied Link!" : "Invite"}</span>
          </button>

          {/* Overflow Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              title="More actions"
              aria-label="Room actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-10 z-30 w-48 rounded-xl bg-white border border-gray-100 shadow-xl py-1 text-xs text-gray-700 animate-in fade-in zoom-in-95 duration-100">
                {canManageSettings && onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-gray-500" />
                    <span>Room settings</span>
                  </button>
                )}

                {!isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setShowLeaveDialog(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Leave room</span>
                  </button>
                )}

                {isOwner && (
                  <div className="px-3 py-1.5 text-[11px] text-gray-400 italic">
                    Room Owner (Cannot leave)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exit / Return to Rooms Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showBackDialog}
        title="Leave Room"
        message={
          <p>
            Are you sure you want to leave <strong className="text-gray-900">{room.name}</strong> and return to the rooms list?
          </p>
        }
        confirmLabel="Leave Room"
        cancelLabel="Stay in Room"
        isDestructive
        onConfirm={() => {
          setShowBackDialog(false);
          navigate(API_ROUTES.MEMBER.NAV.ROOMS);
        }}
        onCancel={() => setShowBackDialog(false)}
      />

      {/* Leave Room (Membership) Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLeaveDialog}
        title="Leave Room"
        message={
          <div>
            <p>Are you sure you want to leave <strong className="text-gray-900">{room.name}</strong>?</p>
            {room.type === "private" && (
              <p className="mt-1 text-xs text-amber-600">
                This is a private room. You will need an invite to rejoin.
              </p>
            )}
            {leaveError && <p className="mt-2 text-xs text-red-600">{leaveError}</p>}
          </div>
        }
        confirmLabel="Leave Room"
        cancelLabel="Cancel"
        isDestructive
        isLoading={isLeaving}
        onConfirm={handleConfirmLeave}
        onCancel={() => setShowLeaveDialog(false)}
      />
    </header>
  );
};
export default RoomHeader;

