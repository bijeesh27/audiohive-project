import React, { useEffect, useRef } from "react";
import { Mic, MicOff, VideoOff, WifiOff, ScreenShare } from "lucide-react";

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
      className={`relative w-full h-full min-h-[160px] max-h-[420px] rounded-xl overflow-hidden bg-slate-900 border transition-all duration-200 flex items-center justify-center aspect-video ${
        isSpeaking
          ? "border-emerald-500 ring-2 ring-emerald-500/80 shadow-[0_0_16px_rgba(16,185,129,0.35)]"
          : isScreenSharing
          ? "border-indigo-500/70 ring-1 ring-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.25)]"
          : "border-slate-800 hover:border-slate-700 shadow-md"
      }`}
    >
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

      {/* Screen Sharing badge on top-left */}
      {isScreenSharing && (
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-600/90 text-white shadow-md z-10 backdrop-blur-sm border border-indigo-400/30">
          <ScreenShare className="w-3 h-3" />
          <span>Screen</span>
        </div>
      )}

      {/* Fallback Avatar when camera is off */}
      {!showVideo && (
        <div className="flex flex-col items-center justify-center p-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-inner transition-transform ${
              isSpeaking
                ? "bg-gradient-to-br from-indigo-500 to-emerald-600 ring-4 ring-emerald-400/50 scale-105"
                : "bg-gradient-to-br from-indigo-600 to-slate-800"
            }`}
          >
            {getInitials(username || "User")}
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-400">
            <VideoOff className="w-3.5 h-3.5 text-slate-500" />
            <span>Camera off</span>
          </div>
        </div>
      )}

      {/* Top right badges: Connection & Media indicators */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
        {connectionState === "connecting" && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-sm animate-pulse">
            Connecting...
          </span>
        )}
        {connectionState === "failed" && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/20 text-red-300 border border-red-500/30 backdrop-blur-sm flex items-center gap-1">
            <WifiOff className="w-3 h-3" />
            Offline
          </span>
        )}
        <div
          className={`p-1.5 rounded-full backdrop-blur-md transition-colors ${
            isMuted
              ? "bg-red-500/90 text-white shadow-sm"
              : isSpeaking
              ? "bg-emerald-500/90 text-white shadow-[0_0_8px_rgba(16,185,129,0.6)]"
              : "bg-slate-900/60 text-slate-300 border border-slate-700/50"
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

      {/* Bottom overlay: Participant Name Pill */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/75 backdrop-blur-md border border-slate-800/80 text-xs font-medium text-slate-200 truncate max-w-[85%]">
          <span className="truncate">{username || "Participant"}</span>
          {isScreenSharing && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-medium">
              (Screen)
            </span>
          )}
          {isLocal && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-normal">
              You
            </span>
          )}
        </div>

        {/* Real-time wave animation when speaking */}
        {isSpeaking && (
          <div className="flex items-end gap-0.5 h-3.5 bg-slate-950/75 backdrop-blur-md px-1.5 py-1 rounded-lg border border-slate-800/80">
            <span className="w-0.5 h-2 bg-emerald-400 rounded animate-bounce [animation-delay:0ms]" />
            <span className="w-0.5 h-3 bg-emerald-400 rounded animate-bounce [animation-delay:150ms]" />
            <span className="w-0.5 h-1.5 bg-emerald-400 rounded animate-bounce [animation-delay:300ms]" />
          </div>
        )}
      </div>
    </div>
  );
};
