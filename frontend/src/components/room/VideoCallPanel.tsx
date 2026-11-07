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
  Radio,
  ScreenShare,
  ScreenShareOff,
  Hand,
  Smile,
  MessageSquare,
  Sliders,
  LayoutGrid,
  Sparkles,
  ChevronUp,
  Copy,
  Check,
  Disc,
} from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { useCall } from "../../hooks/useCall";
import { ParticipantVideoCard } from "./ParticipantVideoCard";
import { ScreenShareModal } from "./ScreenShareModal";
import { FloatingChatPanel } from "./FloatingChatPanel";
import { FloatingParticipantsPanel } from "./FloatingParticipantsPanel";
import { MeetingSettingsModal } from "./MeetingSettingsModal";

interface VideoCallPanelProps {
  roomId: string;
  roomName?: string;
  roomType?: "public" | "private";
  currentUsername: string;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  left: number;
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Layout mode: "grid" | "spotlight" | "filmstrip"
  const [layoutMode, setLayoutMode] = useState<"grid" | "spotlight" | "filmstrip">("grid");
  const [pinnedPeerId, setPinnedPeerId] = useState<string | null>(null);

  // Floating Overlay Panels
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Modals & Popovers
  const [isScreenShareModalOpen, setIsScreenShareModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  // Hand Raise State
  const [hasHandRaised, setHasHandRaised] = useState(false);

  // Floating Emojis
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  // Meeting Duration Timer
  const [meetingSeconds, setMeetingSeconds] = useState(0);

  // Link Copied State
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  // Timer effect when in call
  useEffect(() => {
    if (!isInCall) {
      setMeetingSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setMeetingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isInCall]);

  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Fullscreen Handler
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen fallback
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

  // Keyboard Shortcuts
  useEffect(() => {
    if (!isInCall) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key.toLowerCase() === "m") {
        toggleMute();
      } else if (e.key.toLowerCase() === "v") {
        toggleVideo();
      } else if (e.key.toLowerCase() === "c") {
        setIsChatOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === "h") {
        setHasHandRaised((prev) => !prev);
      } else if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isInCall, toggleMute, toggleVideo]);

  // Handle reaction trigger
  const triggerReaction = (emoji: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    const left = Math.floor(Math.random() * 60) + 20; // 20% to 80% horizontal range
    setReactions((prev) => [...prev, { id, emoji, left }]);
    setIsReactionPickerOpen(false);

    // Auto-remove reaction after animation completes
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2500);

    // Socket emit if available
    if (socket && socket.connected) {
      socket.emit("call:reaction", { roomId, emoji, username: currentUsername });
    }
  };

  // Listen to peer reactions
  useEffect(() => {
    if (!socket) return;
    const handlePeerReaction = (data: { emoji: string }) => {
      if (!data?.emoji) return;
      const id = `${Date.now()}-${Math.random()}`;
      const left = Math.floor(Math.random() * 60) + 20;
      setReactions((prev) => [...prev, { id, emoji: data.emoji, left }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2500);
    };

    socket.on("call:reaction", handlePeerReaction);
    return () => {
      socket.off("call:reaction", handlePeerReaction);
    };
  }, [socket]);

  const totalParticipants = participants.length + (isInCall ? 1 : 0);

  // Active Screen Sharer (local or remote)
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

  // Unified list of participants for grid rendering
  const allParticipantsList = useMemo(() => {
    const list = [
      {
        peerId: "local",
        username: currentUsername,
        isLocal: true,
        isMuted,
        isVideoOff,
        isScreenSharing: Boolean(isScreenSharing),
        stream: localStream,
        connectionState: undefined,
        hasHandRaised,
      },
    ];

    participants.forEach((p) => {
      list.push({
        peerId: p.peerId,
        username: p.username || "Participant",
        isLocal: false,
        isMuted: p.isMuted,
        isVideoOff: p.isVideoOff,
        isScreenSharing: Boolean(p.isScreenSharing),
        stream: p.stream || null,
        connectionState: p.connectionState,
        hasHandRaised: false,
      });
    });

    return list;
  }, [currentUsername, isMuted, isVideoOff, isScreenSharing, localStream, participants, hasHandRaised]);

  // Focused Spotlight Participant (pinned or active speaker or first participant)
  const spotlightParticipant = useMemo(() => {
    if (pinnedPeerId) {
      const pinned = allParticipantsList.find((p) => p.peerId === pinnedPeerId);
      if (pinned) return pinned;
    }
    if (speakingPeers.size > 0) {
      const activeId = Array.from(speakingPeers)[0];
      const speaker = allParticipantsList.find((p) => p.peerId === activeId);
      if (speaker) return speaker;
    }
    return allParticipantsList[0];
  }, [pinnedPeerId, speakingPeers, allParticipantsList]);

  // Dynamic responsive grid styling based on participant count
  const getDynamicGridClass = (count: number) => {
    if (count === 1) {
      return "grid-cols-1 max-w-5xl h-full max-h-[82vh] mx-auto";
    }
    if (count === 2) {
      return "grid-cols-1 md:grid-cols-2 max-w-6xl h-full max-h-[80vh] mx-auto";
    }
    if (count === 3) {
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl h-full max-h-[80vh] mx-auto";
    }
    if (count === 4) {
      return "grid-cols-2 grid-rows-2 max-w-6xl h-full max-h-[82vh] mx-auto";
    }
    if (count <= 6) {
      return "grid-cols-2 md:grid-cols-3 max-w-7xl h-full max-h-[84vh] mx-auto";
    }
    return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl h-full max-h-[85vh] mx-auto overflow-y-auto";
  };

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000);
  };

  // ═════════════════════════════════════════════════════════════════════════
  // PRE-JOIN LOBBY VIEW
  // ═════════════════════════════════════════════════════════════════════════
  if (!isInCall) {
    return (
      <div className="relative w-full rounded-3xl bg-gradient-to-b from-[#0D1222] to-[#07090F] border border-violet-500/25 p-6 sm:p-8 shadow-2xl text-white overflow-hidden">
        {/* Ambient atmospheric glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-violet-500/20 relative z-10">
          <div className="flex items-center gap-3.5">
            {/* AudioHive Hex Logo */}
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-500 p-0.5 shadow-lg shadow-violet-600/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#0B0F19] rounded-[14px] flex items-center justify-center text-violet-400">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
                  <path d="M12 22V12" />
                  <path d="M22 7l-10 5" />
                  <path d="M2 7l10 5" />
                </svg>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">AudioHive Conference</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase tracking-wider">
                  Full-Screen Experience
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {roomName || "Team Video Room"} · {roomType === "private" ? "Private Office" : "Collaborative Space"}
              </p>
            </div>
          </div>

          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-950/50 text-violet-300 border border-violet-500/30">
            <Radio className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
            Ready to Connect
          </span>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-4 p-3.5 rounded-2xl bg-red-950/50 border border-red-500/40 flex items-start gap-2.5 text-xs text-red-200 relative z-10">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Pre-join Stage Preview */}
        <div className="my-6 p-6 sm:p-8 rounded-3xl bg-[#090C15]/80 border border-violet-500/20 flex flex-col items-center justify-center text-center relative z-10">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-violet-600/30 ring-4 ring-violet-500/20">
              <Users className="w-8 h-8 text-white" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#090C15] flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </span>
          </div>

          <h4 className="text-lg font-bold text-white tracking-tight">Enter Video Conference</h4>
          <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
            Experience an immersive full-screen video calling layout with zero sidebar distractions, dynamic multi-participant grid, screen sharing, and floating glass controls.
          </p>

          {/* Quick Hardware Controls */}
          <div className="flex items-center gap-3 my-6">
            <button
              type="button"
              onClick={() => setPreMuted((prev) => !prev)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                preMuted
                  ? "bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30"
                  : "bg-slate-900 text-slate-200 border-violet-500/30 hover:border-violet-500/60 hover:bg-slate-850"
              }`}
            >
              {preMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
              <span>{preMuted ? "Mic Muted" : "Mic Active"}</span>
            </button>

            <button
              type="button"
              onClick={() => setPreVideoOff((prev) => !prev)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                preVideoOff
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                  : "bg-slate-900 text-slate-200 border-violet-500/30 hover:border-violet-500/60 hover:bg-slate-850"
              }`}
            >
              {preVideoOff ? <VideoOff className="w-4 h-4 text-amber-400" /> : <Video className="w-4 h-4 text-violet-400" />}
              <span>{preVideoOff ? "Camera Off" : "Camera On"}</span>
            </button>
          </div>

          {/* Join Call Action Button */}
          <button
            type="button"
            onClick={() =>
              joinCall(roomId, {
                startMuted: preMuted,
                startVideoOff: preVideoOff,
              })
            }
            disabled={isConnecting}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:from-violet-700 active:to-indigo-700 text-white text-sm font-bold shadow-xl shadow-violet-600/40 hover:shadow-violet-600/60 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isConnecting ? "Connecting to Conference..." : "Join Full-Screen Conference"}</span>
          </button>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // FULL-SCREEN VIDEO CONFERENCING EXPERIENCE (NO SIDEBARS)
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 w-screen h-screen flex flex-col bg-[#06080F] text-white overflow-hidden select-none"
    >
      {/* Ambient background lighting */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-violet-700/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[300px] bg-purple-700/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Floating Animated Emojis */}
      {reactions.map((r) => (
        <div
          key={r.id}
          style={{ left: `${r.left}%` }}
          className="absolute bottom-24 text-4xl pointer-events-none z-50 animate-out fade-out slide-out-to-top duration-1000 transform -translate-x-1/2 drop-shadow-[0_0_12px_rgba(139,92,246,0.6)]"
        >
          {r.emoji}
        </div>
      ))}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER                                                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-violet-500/15 bg-[#090C15]/70 backdrop-blur-xl shrink-0 z-30">
        {/* Left: AudioHive Logo & Title & Duration */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* AudioHive Hex Logo */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-500 p-0.5 shadow-md shadow-violet-600/30 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center text-violet-400">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
                <path d="M12 22V12" />
                <path d="M22 7l-10 5" />
                <path d="M2 7l10 5" />
              </svg>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-violet-400 uppercase tracking-widest hidden sm:inline">
                AudioHive
              </span>
              <span className="text-slate-600 hidden sm:inline">/</span>
              <h2 className="text-sm font-bold text-white tracking-tight truncate max-w-[180px] sm:max-w-xs">
                {roomName || "Sprint Design Conference"}
              </h2>
              <button
                type="button"
                onClick={copyMeetingLink}
                title="Copy link"
                className="p-1 rounded-md text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 transition-colors"
              >
                {isLinkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
              <span className="font-mono text-violet-300 font-semibold">{formatDuration(meetingSeconds)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-violet-400" />
                <span>{totalParticipants} participant{totalParticipants === 1 ? "" : "s"}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Status Indicators (Recording & HD Connection) */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Recording Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-300 border border-red-500/25 shadow-inner">
            <Disc className="w-3.5 h-3.5 text-red-400 animate-spin [animation-duration:3s]" />
            <span className="tracking-wide">REC</span>
          </div>

          {/* Connection Quality Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>HD 1080p</span>
          </div>
        </div>

        {/* Right: Layout Switcher, Fullscreen, and Header Leave */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Layout Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLayoutMenu((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-violet-500/20 text-xs font-semibold transition-all cursor-pointer"
              title="Change Grid Layout"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline capitalize">{layoutMode}</span>
              <ChevronUp className={`w-3 h-3 text-slate-400 transition-transform ${showLayoutMenu ? "rotate-180" : ""}`} />
            </button>

            {showLayoutMenu && (
              <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-[#0B0F19]/95 backdrop-blur-2xl border border-violet-500/30 p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                {[
                  { id: "grid" as const, label: "Grid View", desc: "Auto responsive grid" },
                  { id: "spotlight" as const, label: "Spotlight View", desc: "Focus active speaker" },
                  { id: "filmstrip" as const, label: "Filmstrip View", desc: "Stage with sidebar strip" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setLayoutMode(item.id);
                      setShowLayoutMenu(false);
                    }}
                    className={`w-full flex flex-col items-start px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                      layoutMode === item.id
                        ? "bg-violet-600/30 text-white font-semibold"
                        : "text-slate-300 hover:bg-slate-800/80"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-slate-400">{item.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Header Quick Leave Button */}
          <button
            type="button"
            onClick={leaveCall}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            title="Leave Conference"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. MAIN VIDEO AREA (FULL AVAILABLE SCREEN, RESPONSIVE GRID)         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <main className="flex-1 w-full relative overflow-hidden p-3 sm:p-5 flex items-center justify-center">
        {/* Error notification banner if any */}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-2xl bg-red-950/80 border border-red-500/50 backdrop-blur-md flex items-center gap-2 text-xs text-red-200 shadow-xl">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Presentation View (When Screen Sharing is active) */}
        {activeScreenSharer ? (
          <div className="w-full h-full flex flex-col lg:flex-row gap-3.5 items-stretch overflow-hidden">
            {/* Featured Screen Sharing Stage */}
            <div className="flex-1 min-h-[300px] h-full rounded-3xl overflow-hidden flex items-center justify-center relative">
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

            {/* Side Filmstrip of other attendees */}
            <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:w-64 shrink-0 max-h-full py-1">
              {allParticipantsList
                .filter((p) => p.peerId !== activeScreenSharer.peerId)
                .map((p) => (
                  <div key={p.peerId} className="w-48 lg:w-full shrink-0 aspect-video">
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
                      isPinned={pinnedPeerId === p.peerId}
                      onTogglePin={() => setPinnedPeerId(pinnedPeerId === p.peerId ? null : p.peerId)}
                      hasHandRaised={p.hasHandRaised}
                    />
                  </div>
                ))}
            </div>
          </div>
        ) : layoutMode === "spotlight" || pinnedPeerId ? (
          /* Spotlight Mode (Focused participant) */
          <div className="w-full h-full flex flex-col lg:flex-row gap-3.5 items-stretch overflow-hidden">
            <div className="flex-1 min-h-[300px] h-full rounded-3xl overflow-hidden flex items-center justify-center relative">
              <ParticipantVideoCard
                peerId={spotlightParticipant.peerId}
                username={spotlightParticipant.username}
                isLocal={spotlightParticipant.isLocal}
                isMuted={spotlightParticipant.isMuted}
                isVideoOff={spotlightParticipant.isVideoOff}
                isSpeaking={speakingPeers.has(spotlightParticipant.peerId)}
                isScreenSharing={spotlightParticipant.isScreenSharing}
                stream={spotlightParticipant.stream || null}
                connectionState={spotlightParticipant.connectionState}
                isPinned={pinnedPeerId === spotlightParticipant.peerId}
                onTogglePin={() =>
                  setPinnedPeerId(pinnedPeerId === spotlightParticipant.peerId ? null : spotlightParticipant.peerId)
                }
                hasHandRaised={spotlightParticipant.hasHandRaised}
              />
            </div>

            {/* Other participants in side strip */}
            {allParticipantsList.length > 1 && (
              <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:w-64 shrink-0 max-h-full py-1">
                {allParticipantsList
                  .filter((p) => p.peerId !== spotlightParticipant.peerId)
                  .map((p) => (
                    <div key={p.peerId} className="w-48 lg:w-full shrink-0 aspect-video">
                      <ParticipantVideoCard
                        peerId={p.peerId}
                        username={p.username}
                        isLocal={p.isLocal}
                        isMuted={p.isMuted}
                        isVideoOff={p.isVideoOff}
                        isSpeaking={speakingPeers.has(p.peerId)}
                        isScreenSharing={p.isScreenSharing}
                        stream={p.stream || null}
                        connectionState={p.connectionState}
                        isPinned={pinnedPeerId === p.peerId}
                        onTogglePin={() => setPinnedPeerId(pinnedPeerId === p.peerId ? null : p.peerId)}
                        hasHandRaised={p.hasHandRaised}
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>
        ) : (
          /* Dynamic Responsive Video Grid (1, 2, 3, 4, 6 and multiple) */
          <div
            className={`w-full grid ${getDynamicGridClass(allParticipantsList.length)} gap-3.5 items-center justify-center`}
          >
            {allParticipantsList.map((p) => (
              <div key={p.peerId} className="w-full h-full min-h-[160px] max-h-[460px] aspect-video">
                <ParticipantVideoCard
                  peerId={p.peerId}
                  username={p.username}
                  isLocal={p.isLocal}
                  isMuted={p.isMuted}
                  isVideoOff={p.isVideoOff}
                  isSpeaking={speakingPeers.has(p.peerId)}
                  isScreenSharing={p.isScreenSharing}
                  stream={p.stream || null}
                  connectionState={p.connectionState}
                  isPinned={pinnedPeerId === p.peerId}
                  onTogglePin={() => setPinnedPeerId(pinnedPeerId === p.peerId ? null : p.peerId)}
                  hasHandRaised={p.hasHandRaised}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. FLOATING BOTTOM CONTROL DOCK (GLASSMORPHISM, CENTERED)           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center">
        <div className="flex items-center gap-1.5 sm:gap-2.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full bg-[#090C15]/85 backdrop-blur-2xl border border-violet-500/30 shadow-[0_12px_45px_rgba(0,0,0,0.85),0_0_25px_rgba(139,92,246,0.15)] transition-all">
          {/* Microphone Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            title={isMuted ? "Unmute Microphone (M)" : "Mute Microphone (M)"}
            className={`p-3 rounded-full transition-all cursor-pointer ${
              isMuted
                ? "bg-red-500/25 text-red-300 border border-red-500/40 hover:bg-red-500/35 shadow-inner"
                : "bg-slate-900/90 text-white border border-violet-500/30 hover:border-violet-500/60 hover:bg-slate-800"
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Camera Toggle */}
          <button
            type="button"
            onClick={toggleVideo}
            title={isVideoOff ? "Start Camera (V)" : "Stop Camera (V)"}
            className={`p-3 rounded-full transition-all cursor-pointer ${
              isVideoOff
                ? "bg-amber-500/25 text-amber-300 border border-amber-500/40 hover:bg-amber-500/35 shadow-inner"
                : "bg-slate-900/90 text-white border border-violet-500/30 hover:border-violet-500/60 hover:bg-slate-800"
            }`}
          >
            {isVideoOff ? <VideoOff className="w-4 h-4 text-amber-400" /> : <Video className="w-4 h-4 text-violet-400" />}
          </button>

          {/* Screen Share Button */}
          <button
            type="button"
            onClick={() => {
              if (isScreenSharing) {
                toggleScreenShare();
              } else {
                setIsScreenShareModalOpen(true);
              }
            }}
            title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
            className={`p-3 rounded-full transition-all cursor-pointer ${
              isScreenSharing
                ? "bg-violet-600 text-white border border-violet-400 shadow-lg shadow-violet-600/40"
                : "bg-slate-900/90 text-slate-300 border border-violet-500/30 hover:border-violet-500/60 hover:text-white hover:bg-slate-800"
            }`}
          >
            {isScreenSharing ? <ScreenShareOff className="w-4 h-4" /> : <ScreenShare className="w-4 h-4" />}
          </button>

          {/* Raise Hand Toggle */}
          <button
            type="button"
            onClick={() => setHasHandRaised((prev) => !prev)}
            title={hasHandRaised ? "Lower Hand (H)" : "Raise Hand (H)"}
            className={`p-3 rounded-full transition-all cursor-pointer ${
              hasHandRaised
                ? "bg-amber-500 text-slate-950 font-bold border border-amber-300 shadow-lg shadow-amber-500/30 scale-105"
                : "bg-slate-900/90 text-slate-300 border border-violet-500/30 hover:border-violet-500/60 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Hand className="w-4 h-4" />
          </button>

          {/* Emoji Reactions Picker Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsReactionPickerOpen((prev) => !prev)}
              title="React with Emoji"
              className={`p-3 rounded-full transition-all cursor-pointer ${
                isReactionPickerOpen
                  ? "bg-violet-600/30 text-violet-300 border border-violet-400"
                  : "bg-slate-900/90 text-slate-300 border border-violet-500/30 hover:border-violet-500/60 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Reaction Popover */}
            {isReactionPickerOpen && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-2 rounded-2xl bg-[#0B0F19]/95 backdrop-blur-2xl border border-violet-500/30 shadow-2xl flex items-center gap-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {["👍", "❤️", "👏", "🎉", "🔥", "🚀", "💡"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => triggerReaction(emoji)}
                    className="p-1 text-xl hover:scale-130 transition-transform cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-[1px] h-6 bg-violet-500/20 mx-1" />

          {/* Floating Chat Panel Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsChatOpen((prev) => !prev);
              setUnreadChatCount(0);
            }}
            title="Meeting Chat (C)"
            className={`relative p-3 rounded-full transition-all cursor-pointer ${
              isChatOpen
                ? "bg-violet-600 text-white border border-violet-400 shadow-md shadow-violet-600/30"
                : "bg-slate-900/90 text-slate-300 border border-violet-500/30 hover:border-violet-500/60 hover:text-white hover:bg-slate-800"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {unreadChatCount > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 text-[9px] font-bold text-white flex items-center justify-center">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Floating Participants Panel Toggle */}
          <button
            type="button"
            onClick={() => setIsParticipantsOpen((prev) => !prev)}
            title="Participants List"
            className={`relative p-3 rounded-full transition-all cursor-pointer ${
              isParticipantsOpen
                ? "bg-violet-600 text-white border border-violet-400 shadow-md shadow-violet-600/30"
                : "bg-slate-900/90 text-slate-300 border border-violet-500/30 hover:border-violet-500/60 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 px-1 rounded-full bg-violet-600 text-[9px] font-bold text-white min-w-[14px] text-center border border-slate-950">
              {totalParticipants}
            </span>
          </button>

          {/* More Settings Button */}
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            title="Audio & Video Settings"
            className="p-3 rounded-full bg-slate-900/90 text-slate-300 border border-violet-500/30 hover:border-violet-500/60 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-6 bg-violet-500/20 mx-1" />

          {/* Leave Meeting Button */}
          <button
            type="button"
            onClick={leaveCall}
            title="Leave Conference"
            className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-600/35 transition-all cursor-pointer ml-1"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. FLOATING PANELS (CHAT & PARTICIPANTS AS OVERLAYS)               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <FloatingChatPanel
        roomId={roomId}
        roomName={roomName}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onNewMessage={() => {
          if (!isChatOpen) {
            setUnreadChatCount((prev) => prev + 1);
          }
        }}
      />

      <FloatingParticipantsPanel
        isOpen={isParticipantsOpen}
        onClose={() => setIsParticipantsOpen(false)}
        participants={participants}
        currentUsername={currentUsername}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        hasHandRaised={hasHandRaised}
        speakingPeers={speakingPeers}
        pinnedPeerId={pinnedPeerId}
        onTogglePin={(peerId) => setPinnedPeerId(pinnedPeerId === peerId ? null : peerId)}
        meetingTitle={roomName}
        roomId={roomId}
      />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. SCREEN SHARING MODAL & SETTINGS MODAL                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <ScreenShareModal
        isOpen={isScreenShareModalOpen}
        onClose={() => setIsScreenShareModalOpen(false)}
        onStartShare={async () => {
          await toggleScreenShare();
        }}
        isCurrentlySharing={isScreenSharing}
        onStopShare={() => toggleScreenShare()}
      />

      <MeetingSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};
