import React, { useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  VideoOff,
  WifiOff,
  ScreenShare,
  Pin,
  PinOff,
  Hand,
} from "lucide-react";

interface ParticipantVideoCardProps {
  peerId: string;
  username: string;
  isLocal: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeaking: boolean;
  isScreenSharing?: boolean;
  stream: MediaStream | null;
  connectionState?: RTCPeerConnectionState;
  isPinned?: boolean;
  onTogglePin?: () => void;
  hasHandRaised?: boolean;
}

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export const ParticipantVideoCard: React.FC<ParticipantVideoCardProps> = ({
  username,
  isLocal,
  isMuted,
  isVideoOff,
  isSpeaking,
  isScreenSharing,
  stream,
  connectionState,
  isPinned = false,
  onTogglePin,
  hasHandRaised = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const hasVideoTrack = Boolean(
    stream &&
      stream.getVideoTracks().length > 0 &&
      stream.getVideoTracks().some((t) => t.enabled && t.readyState === "live")
  );

  const showVideo = (!isVideoOff || isScreenSharing) && hasVideoTrack;

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (stream) {
      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
    } else {
      videoEl.srcObject = null;
    }
  }, [stream, showVideo]);

  return (
    <div
      className={`group relative w-full h-full min-h-[180px] rounded-3xl overflow-hidden bg-[#0A0D18] border transition-all duration-300 flex items-center justify-center select-none ${
        isSpeaking
          ? "border-violet-500 ring-2 ring-violet-500/80 shadow-[0_0_28px_rgba(139,92,246,0.65)]"
          : isPinned
          ? "border-violet-500/80 ring-1 ring-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
          : isScreenSharing
          ? "border-indigo-500/70 ring-1 ring-indigo-500/50 shadow-[0_0_16px_rgba(99,102,241,0.3)]"
          : "border-slate-800/80 hover:border-violet-500/40 shadow-lg"
      }`}
    >
      {/* Background ambient gradient */}
      <div className="absolute inset-0 bg-radial from-violet-950/20 via-transparent to-transparent pointer-events-none" />

      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full transition-opacity duration-300 ${
          isScreenSharing ? "object-contain bg-black" : "object-cover"
        } ${showVideo ? "opacity-100" : "opacity-0 absolute pointer-events-none"} ${
          isLocal && !isScreenSharing ? "scale-x-[-1]" : ""
        }`}
      />

      {/* Top Left Badges: Screen Share & Pin Indicator */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
        {isScreenSharing && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-violet-600/90 text-white shadow-lg backdrop-blur-md border border-violet-400/40">
            <ScreenShare className="w-3.5 h-3.5" />
            <span>Presenting</span>
          </div>
        )}

        {isPinned && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-violet-600/80 text-white backdrop-blur-md border border-violet-400/30">
            <Pin className="w-3 h-3 fill-current" />
            <span>Pinned</span>
          </div>
        )}

        {hasHandRaised && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-500/90 text-slate-950 shadow-lg backdrop-blur-md border border-amber-300 animate-bounce">
            <Hand className="w-3.5 h-3.5 fill-current" />
            <span>Raised Hand</span>
          </div>
        )}
      </div>

      {/* Fallback Futuristic Avatar when Camera is Off */}
      {!showVideo && (
        <div className="flex flex-col items-center justify-center p-4 relative z-10">
          <div className="relative">
            {/* Pulsing halo when speaking */}
            {isSpeaking && (
              <span className="absolute -inset-3 rounded-full bg-violet-500/30 animate-ping duration-1000" />
            )}
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center text-xl font-extrabold text-white shadow-2xl transition-all duration-300 ${
                isSpeaking
                  ? "bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 ring-4 ring-violet-400/70 scale-105 shadow-[0_0_30px_rgba(139,92,246,0.6)]"
                  : "bg-gradient-to-br from-violet-900/60 to-slate-900 border border-violet-500/30 text-violet-200"
              }`}
            >
              {getInitials(username || "User")}
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
            <VideoOff className="w-3.5 h-3.5 text-slate-500" />
            <span>Camera off</span>
          </div>
        </div>
      )}

      {/* Top Right Badges: Controls & Audio Indicators */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
        {/* Hover Pin Toggle Button */}
        {onTogglePin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            title={isPinned ? "Unpin participant" : "Pin participant"}
            className={`p-1.5 rounded-xl backdrop-blur-md border transition-all opacity-0 group-hover:opacity-100 cursor-pointer ${
              isPinned
                ? "opacity-100 bg-violet-600 text-white border-violet-400"
                : "bg-slate-950/70 text-slate-300 border-white/10 hover:text-white hover:bg-slate-900"
            }`}
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Network State Alerts */}
        {connectionState === "connecting" && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md animate-pulse">
            Connecting...
          </span>
        )}
        {connectionState === "failed" && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/20 text-red-300 border border-red-500/30 backdrop-blur-md flex items-center gap-1">
            <WifiOff className="w-3 h-3" />
            Offline
          </span>
        )}

        {/* Microphone Status Pill */}
        <div
          className={`p-1.5 rounded-xl backdrop-blur-md transition-all ${
            isMuted
              ? "bg-red-500/90 text-white shadow-md border border-red-400/40"
              : isSpeaking
              ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.8)] border border-violet-400"
              : "bg-slate-950/60 text-slate-300 border border-white/10"
          }`}
          title={isMuted ? "Muted" : isSpeaking ? "Speaking" : "Microphone active"}
        >
          {isMuted ? (
            <MicOff className="w-3.5 h-3.5" />
          ) : (
            <Mic className="w-3.5 h-3.5" />
          )}
        </div>
      </div>

      {/* Bottom Overlay: Participant Name Pill & Violet Audio Visualizer */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-violet-500/20 text-xs font-semibold text-white shadow-lg truncate max-w-[85%]">
          <span className="truncate">{username || "Participant"}</span>
          {isScreenSharing && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-500/30 text-violet-300 font-medium border border-violet-400/20">
              Screen
            </span>
          )}
          {isLocal && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-600 text-white font-medium shadow-xs">
              You
            </span>
          )}
        </div>

        {/* Real-time Violet Equalizer Wave Visualizer when Speaking */}
        {isSpeaking && (
          <div className="flex items-end gap-1 h-5 bg-slate-950/80 backdrop-blur-xl px-2.5 py-1 rounded-2xl border border-violet-500/40 shadow-lg shadow-violet-600/20">
            <span className="w-1 h-3 bg-violet-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1 h-4 bg-violet-300 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        )}
      </div>
    </div>
  );
};
