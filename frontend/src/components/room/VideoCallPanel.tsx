import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  Maximize2,
  Minimize2,
  AlertCircle,
  Video as VideoIcon,
  Radio,
  ScreenShare,
  ScreenShareOff,
} from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { useCall } from "../../hooks/useCall";
import { ParticipantVideoCard } from "./ParticipantVideoCard";

interface VideoCallPanelProps {
  roomId: string;
  roomName?: string;
  roomType?: "public" | "private";
  currentUsername: string;
}

export const VideoCallPanel: React.FC<VideoCallPanelProps> = ({
  roomId,
  roomName,
  roomType,
  currentUsername,
}) => {
  const { socket } = useSocket();
  const {
    isInCall,
    isConnecting,
    isMuted,
    isVideoOff,
    isScreenSharing,
    participants,
    localStream,
    speakingPeers,
    error,
    joinCall,
    leaveCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  } = useCall(socket);

  // Pre-join options
  const [preMuted, setPreMuted] = useState(false);
  const [preVideoOff, setPreVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle Fullscreen toggle
  const toggleFullscreen = async () => {
    if (!panelRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await panelRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen request fallback
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const totalParticipants = participants.length + (isInCall ? 1 : 0);

  // Identify active screen sharer (either local user or remote peer)
  const activeScreenSharer = useMemo(() => {
    if (isScreenSharing) {
      return {
        peerId: "local",
        username: currentUsername,
        isLocal: true,
        isMuted,
        isVideoOff: false,
        isScreenSharing: true,
        stream: localStream,
        connectionState: undefined,
      };
    }
    const remote = participants.find((p) => p.isScreenSharing);
    if (remote) {
      return {
        ...remote,
        isLocal: false,
      };
    }
    return null;
  }, [isScreenSharing, currentUsername, isMuted, localStream, participants]);

  // Other participants excluding the screen sharer
  const otherParticipants = useMemo(() => {
    if (!activeScreenSharer) return [];
    const list = [];
    if (!activeScreenSharer.isLocal) {
      list.push({
        peerId: "local",
        username: currentUsername,
        isLocal: true,
        isMuted,
        isVideoOff,
        isScreenSharing: false,
        stream: localStream,
        connectionState: undefined,
      });
    }
    participants.forEach((p) => {
      if (p.peerId !== activeScreenSharer.peerId) {
        list.push({
          ...p,
          isLocal: false,
        });
      }
    });
    return list;
  }, [activeScreenSharer, currentUsername, isMuted, isVideoOff, localStream, participants]);

  // Determine grid columns based on total participants
  const getGridClass = () => {
    if (totalParticipants <= 1) return "grid-cols-1";
    if (totalParticipants === 2) return "grid-cols-1 sm:grid-cols-2";
    if (totalParticipants <= 4) return "grid-cols-1 sm:grid-cols-2";
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  };

  // ── Pre-join View ────────────────────────────────────────────────────────
  if (!isInCall) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 transition-all">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <VideoIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Audio & Video Call</h3>
              <p className="text-xs text-slate-400">
                {roomName ? `${roomName} · ` : ""}
                {roomType === "private" ? "Private Office" : "Team Space"}
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
            <Radio className="w-3 h-3 text-slate-400" />
            Ready to join
          </span>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/50 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Preview & Join Box */}
        <div className="my-5 p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300 mb-3 shadow-inner">
            <Users className="w-7 h-7 text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-slate-200">
            Join conference with your team
          </p>
          <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
            High definition real-time audio, video, and screen sharing powered by WebRTC.
          </p>

          {/* Device Pre-selection Controls */}
          <div className="flex items-center gap-3 mb-5">
            <button
              type="button"
              onClick={() => setPreMuted((prev) => !prev)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                preMuted
                  ? "bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/20"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700/80"
              }`}
            >
              {preMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              {preMuted ? "Mic Muted" : "Mic On"}
            </button>

            <button
              type="button"
              onClick={() => setPreVideoOff((prev) => !prev)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                preVideoOff
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700/80"
              }`}
            >
              {preVideoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
              {preVideoOff ? "Camera Off" : "Camera On"}
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              joinCall(roomId, {
                startMuted: preMuted,
                startVideoOff: preVideoOff,
              })
            }
            disabled={isConnecting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-60 cursor-pointer"
          >
            <VideoIcon className="w-4 h-4" />
            <span>{isConnecting ? "Connecting..." : "Join Call Now"}</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Active Conference Stage ──────────────────────────────────────────────
  return (
    <div
      ref={panelRef}
      className={`bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ${
        isFullscreen ? "fixed inset-0 z-50 p-6 rounded-none" : "p-4 min-h-[440px]"
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">
                {roomName || "Call Session"}
              </h3>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {totalParticipants} participant{totalParticipants === 1 ? "" : "s"} in call
              </span>
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="mb-3 p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-2 text-xs text-red-300">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Video Presentation Stage */}
      {activeScreenSharer ? (
        /* Spotlight Layout: Large Screen presentation with participant filmstrip */
        <div className="flex flex-col lg:flex-row gap-3 flex-1 overflow-hidden min-h-[320px] p-1">
          {/* Featured Screen Stage */}
          <div className="flex-1 min-h-[260px] max-h-[580px] rounded-xl overflow-hidden flex items-center justify-center">
            <ParticipantVideoCard
              peerId={activeScreenSharer.peerId}
              username={activeScreenSharer.username}
              isLocal={activeScreenSharer.isLocal}
              isMuted={activeScreenSharer.isMuted}
              isVideoOff={false}
              isSpeaking={speakingPeers.has(activeScreenSharer.peerId)}
              isScreenSharing={true}
              stream={activeScreenSharer.stream || null}
              connectionState={activeScreenSharer.connectionState}
            />
          </div>

          {/* Side Participant Filmstrip */}
          {otherParticipants.length > 0 && (
            <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto lg:w-60 shrink-0 max-h-[580px] py-1">
              {otherParticipants.map((p) => (
                <div key={p.peerId} className="w-44 lg:w-full shrink-0 aspect-video">
                  <ParticipantVideoCard
                    peerId={p.peerId}
                    username={p.username}
                    isLocal={p.isLocal}
                    isMuted={p.isMuted}
                    isVideoOff={p.isVideoOff}
                    isSpeaking={speakingPeers.has(p.peerId)}
                    isScreenSharing={false}
                    stream={p.stream || null}
                    connectionState={p.connectionState}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Standard Responsive Grid Layout */
        <div
          className={`grid ${getGridClass()} gap-3 flex-1 overflow-y-auto min-h-[220px] items-center justify-center p-1`}
        >
          {/* Local Participant Card */}
          <ParticipantVideoCard
            peerId="local"
            username={currentUsername}
            isLocal={true}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isSpeaking={speakingPeers.has("local")}
            isScreenSharing={false}
            stream={localStream}
          />

          {/* Remote Participant Cards */}
          {participants.map((p) => (
            <ParticipantVideoCard
              key={p.peerId}
              peerId={p.peerId}
              username={p.username}
              isLocal={false}
              isMuted={p.isMuted}
              isVideoOff={p.isVideoOff}
              isSpeaking={speakingPeers.has(p.peerId)}
              isScreenSharing={p.isScreenSharing}
              stream={p.stream || null}
              connectionState={p.connectionState}
            />
          ))}
        </div>
      )}

      {/* Floating Dark Control Bar */}
      <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-center gap-2.5 flex-wrap">
        {/* Microphone Mute / Unmute */}
        <button
          type="button"
          onClick={toggleMute}
          title={isMuted ? "Unmute microphone" : "Mute microphone"}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
            isMuted
              ? "bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30"
              : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700/80"
          }`}
        >
          {isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
          <span>{isMuted ? "Unmute" : "Mute"}</span>
        </button>

        {/* Camera On / Off */}
        <button
          type="button"
          onClick={toggleVideo}
          title={isVideoOff ? "Turn camera on" : "Turn camera off"}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
            isVideoOff
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
              : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700/80"
          }`}
        >
          {isVideoOff ? <VideoOff className="w-4 h-4 text-amber-400" /> : <Video className="w-4 h-4 text-indigo-400" />}
          <span>{isVideoOff ? "Start Video" : "Stop Video"}</span>
        </button>

        {/* Screen Share / Stop Sharing */}
        <button
          type="button"
          onClick={toggleScreenShare}
          title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
            isScreenSharing
              ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 hover:bg-indigo-500"
              : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700/80"
          }`}
        >
          {isScreenSharing ? (
            <ScreenShareOff className="w-4 h-4 text-indigo-200" />
          ) : (
            <ScreenShare className="w-4 h-4 text-indigo-400" />
          )}
          <span>{isScreenSharing ? "Stop Sharing" : "Share Screen"}</span>
        </button>

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700/80 transition-all cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
        </button>

        {/* Leave Call */}
        <button
          type="button"
          onClick={leaveCall}
          title="Leave conference"
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 active:bg-red-700 text-white shadow-md shadow-red-600/30 transition-all cursor-pointer ml-1"
        >
          <PhoneOff className="w-4 h-4" />
          <span>Leave</span>
        </button>
      </div>
    </div>
  );
};
