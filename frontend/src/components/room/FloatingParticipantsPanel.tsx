import React, { useState } from "react";
import {
  Users,
  X,
  Search,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Pin,
  PinOff,
  Hand,
  Copy,
  Check,
  ScreenShare,
  Shield,
} from "lucide-react";
import type { CallParticipant } from "../../types/call";

interface FloatingParticipantsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  participants: CallParticipant[];
  currentUsername: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  hasHandRaised: boolean;
  speakingPeers: Set<string>;
  pinnedPeerId: string | null;
  onTogglePin: (peerId: string) => void;
  meetingTitle?: string;
  roomId?: string;
}

export const FloatingParticipantsPanel: React.FC<FloatingParticipantsPanelProps> = ({
  isOpen,
  onClose,
  participants,
  currentUsername,
  isMuted,
  isVideoOff,
  isScreenSharing,
  hasHandRaised,
  speakingPeers,
  pinnedPeerId,
  onTogglePin,
  roomId: _roomId,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Build unified list of all call participants
  const allList = [
    {
      peerId: "local",
      username: `${currentUsername} (You)`,
      isLocal: true,
      isMuted,
      isVideoOff,
      isScreenSharing,
      isSpeaking: speakingPeers.has("local"),
      hasHandRaised,
    },
    ...participants.map((p) => ({
      peerId: p.peerId,
      username: p.username || "Participant",
      isLocal: false,
      isMuted: p.isMuted,
      isVideoOff: p.isVideoOff,
      isScreenSharing: Boolean(p.isScreenSharing),
      isSpeaking: speakingPeers.has(p.peerId),
      hasHandRaised: false, // In peer sync
    })),
  ];

  const filtered = allList.filter((p) =>
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getInitials = (name: string) => {
    return name
      .replace("(You)", "")
      .trim()
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="absolute right-4 sm:right-6 top-20 bottom-28 w-80 sm:w-96 z-40 bg-[#0B0F19]/90 backdrop-blur-2xl border border-violet-500/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(139,92,246,0.15)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Background ambient glow */}
      <div className="absolute -top-20 -right-20 w-44 h-44 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="px-5 py-4 border-b border-violet-500/20 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white tracking-tight">Participants</h4>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {allList.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">In this AudioHive session</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Close participants"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-violet-500/15 relative z-10">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search participants..."
            className="w-full pl-8 pr-3 py-2 bg-slate-900/90 border border-violet-500/20 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 relative z-10 scrollbar-thin scrollbar-thumb-violet-500/20">
        {filtered.map((p) => {
          const isPinned = pinnedPeerId === p.peerId;

          return (
            <div
              key={p.peerId}
              className={`flex items-center justify-between p-2.5 rounded-2xl transition-all ${
                p.isSpeaking
                  ? "bg-violet-950/40 border border-violet-500/40 shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                  : "bg-slate-900/40 hover:bg-slate-850/60 border border-slate-800/80"
              }`}
            >
              {/* Left: Avatar + Name info */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-inner ${
                      p.isSpeaking
                        ? "bg-gradient-to-br from-violet-500 to-purple-600 ring-2 ring-violet-400/80"
                        : "bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-700"
                    }`}
                  >
                    {getInitials(p.username)}
                  </div>
                  {p.isLocal && (
                    <span
                      title="Host / Local"
                      className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-violet-600 border border-slate-900 flex items-center justify-center text-[8px] text-white"
                    >
                      <Shield className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-slate-200 truncate max-w-[130px]">
                      {p.username}
                    </p>
                    {p.isSpeaking && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-violet-500/30 text-violet-300">
                        Speaking
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                    {p.isScreenSharing && (
                      <span className="flex items-center gap-0.5 text-violet-400 font-medium">
                        <ScreenShare className="w-3 h-3" /> Screen
                      </span>
                    )}
                    {p.hasHandRaised && (
                      <span className="flex items-center gap-0.5 text-amber-400 font-medium animate-pulse">
                        <Hand className="w-3 h-3" /> Hand raised
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Action Badges & Pin toggle */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Pin toggle button */}
                <button
                  type="button"
                  onClick={() => onTogglePin(p.peerId)}
                  title={isPinned ? "Unpin participant" : "Pin participant to stage"}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    isPinned
                      ? "bg-violet-600 text-white border-violet-400 shadow-sm"
                      : "text-slate-400 hover:text-white border-transparent hover:bg-slate-800"
                  }`}
                >
                  {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </button>

                {/* Video status indicator */}
                <div
                  className={`p-1.5 rounded-lg border ${
                    p.isVideoOff
                      ? "bg-slate-800/80 text-slate-400 border-slate-700/60"
                      : "bg-violet-500/20 text-violet-300 border-violet-500/30"
                  }`}
                  title={p.isVideoOff ? "Camera Off" : "Camera On"}
                >
                  {p.isVideoOff ? (
                    <VideoOff className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <Video className="w-3.5 h-3.5 text-violet-400" />
                  )}
                </div>

                {/* Mic status indicator */}
                <div
                  className={`p-1.5 rounded-lg border ${
                    p.isMuted
                      ? "bg-red-500/20 text-red-300 border-red-500/30"
                      : p.isSpeaking
                      ? "bg-violet-500/30 text-violet-200 border-violet-400/50"
                      : "bg-slate-800/80 text-emerald-400 border-slate-700/60"
                  }`}
                  title={p.isMuted ? "Muted" : "Microphone active"}
                >
                  {p.isMuted ? (
                    <MicOff className="w-3.5 h-3.5" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Actions: Copy Link / Invite */}
      <div className="p-3 border-t border-violet-500/20 bg-slate-950/60 relative z-10 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-semibold transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Meeting Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

