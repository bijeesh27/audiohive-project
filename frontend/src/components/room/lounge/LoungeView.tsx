import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Sparkles,
  Music,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  ThumbsUp,
  Plus,
  Users,
  Radio,
  Building2,
  ExternalLink,
  Globe,
  Megaphone,
  Edit3,
  CheckCircle,
  AlertCircle,
  X,
  Headphones,
  Loader2,
  LogOut,
  LogIn,
  ArrowLeft,
} from "lucide-react";
import { useSocket } from "../../../context/SocketContext";
import { useAuth } from "../../../context/AuthContext";
import {
  getCompanyProfile,
  updateCompanyProfile,
  addWorkspaceAnnouncement,
} from "../../../services/workspaceServices";
import type {
  RoomDetailData,
  ParticipantItem,
  CompanyProfile,
  TrackItem,
  PlaybackSnapshot,
} from "../../../types/rooms";

interface LoungeViewProps {
  room: RoomDetailData;
  participants?: ParticipantItem[];
  onlineUsers: { userId: string; username: string }[];
  onLeaveRoom?: () => void;
}

export const LoungeView: React.FC<LoungeViewProps> = ({
  room,
  onlineUsers,
  onLeaveRoom,
}) => {
  const { socket } = useSocket();
  const { userId, username } = useAuth();
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // User & Role State
  const currentUserId = userId || "";
  const currentUsername = username || "Member";
  const isAdmin = room.myRole === "owner" || room.myRole === "admin";
  const [isInLounge, setIsInLounge] = useState(true);

  // Playback State
  const [playbackState, setPlaybackState] = useState<PlaybackSnapshot | null>(null);
  const [displayPosition, setDisplayPosition] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.75);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);

  // Music Library & Queue Modal
  const [isAddQueueOpen, setIsAddQueueOpen] = useState(false);
  const [libraryTracks, setLibraryTracks] = useState<TrackItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [customTrackTitle, setCustomTrackTitle] = useState("");
  const [customTrackArtist, setCustomTrackArtist] = useState("");
  const [customTrackUrl, setCustomTrackUrl] = useState("");
  const [customTrackDuration, setCustomTrackDuration] = useState("180");
  const [modalTab, setModalTab] = useState<"library" | "custom">("library");

  // Company Profile State
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // Profile Edit Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    tagline: "",
    about: "",
    mission: "",
    website: "",
    logoUrl: "",
    links: [] as { label: string; url: string }[],
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  // Announcement Modal State
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);

  // 1. Fetch Company Profile
  const loadProfile = useCallback(async () => {
    const wsId = room.workspaceId || room._id;
    if (!wsId) return;
    try {
      setIsProfileLoading(true);
      const res = await getCompanyProfile(wsId);
      const data = res?.data || res;
      setCompanyProfile(data);
      setProfileForm({
        name: data.name || "",
        tagline: data.tagline || "",
        about: data.about || "",
        mission: data.mission || "",
        website: data.website || "",
        logoUrl: data.logoUrl || "",
        links: Array.isArray(data.links) ? [...data.links] : [],
      });
    } catch {
      // handled silently
    } finally {
      setIsProfileLoading(false);
    }
  }, [room.workspaceId, room._id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // 2. Socket Listeners for Music Events
  useEffect(() => {
    if (!socket || !room._id) return;

    const handleMusicState = (snapshot: PlaybackSnapshot) => {
      setPlaybackState(snapshot);

      const audio = audioElementRef.current;
      if (!audio || !snapshot.currentTrack) {
        setDisplayPosition(snapshot.position);
        return;
      }

      const clientNow = Date.now();
      const latency = Math.max(0, (clientNow - snapshot.serverTime) / 1000);
      const targetPos = Math.min(
        snapshot.currentTrack.duration,
        snapshot.position + (snapshot.isPlaying ? latency : 0)
      );

      const trackUrl = snapshot.currentTrack.url;

      const triggerPlay = () => {
        try {
          audio.currentTime = targetPos;
        } catch {
          // ignore if media seeking before buffer
        }
        setDisplayPosition(targetPos);
        audio
          .play()
          .then(() => {
            setAutoplayBlocked(false);
          })
          .catch((err) => {
            if (err?.name === "NotAllowedError") {
              setAutoplayBlocked(true);
            }
          });
      };

      if (audio.src !== trackUrl) {
        audio.src = trackUrl;
        audio.load();

        if (snapshot.isPlaying) {
          audio.onloadedmetadata = () => {
            triggerPlay();
          };
        } else {
          audio.onloadedmetadata = () => {
            try {
              audio.currentTime = targetPos;
            } catch {}
            setDisplayPosition(targetPos);
            audio.pause();
          };
        }
      } else {
        if (snapshot.isPlaying) {
          // Adjust clock only if drift is noticeable (>1.0s) to prevent audio skips
          if (Math.abs(audio.currentTime - targetPos) > 1.0) {
            audio.currentTime = targetPos;
          }
          if (audio.paused) {
            triggerPlay();
          }
        } else {
          if (!audio.paused) {
            audio.pause();
          }
          if (Math.abs(audio.currentTime - targetPos) > 0.5) {
            audio.currentTime = targetPos;
          }
          setDisplayPosition(targetPos);
        }
      }
    };

    const handleLibrary = (library: TrackItem[]) => {
      setLibraryTracks(library);
      setLibraryLoading(false);
    };

    socket.on("music:state", handleMusicState);
    socket.on("music:library", handleLibrary);

    // Initial fetch of music state and library
    socket.emit("music:get-state", room._id);
    socket.emit("music:get-library");

    return () => {
      socket.off("music:state", handleMusicState);
      socket.off("music:library", handleLibrary);
    };
  }, [socket, room._id]);

  // User gesture unlock for browser autoplay policies
  useEffect(() => {
    if (!autoplayBlocked) return;

    const handleUnlockAudio = () => {
      const audio = audioElementRef.current;
      if (audio && playbackState?.isPlaying) {
        audio
          .play()
          .then(() => {
            setAutoplayBlocked(false);
          })
          .catch(() => {});
      }
    };

    window.addEventListener("click", handleUnlockAudio, { once: true });
    window.addEventListener("keydown", handleUnlockAudio, { once: true });

    return () => {
      window.removeEventListener("click", handleUnlockAudio);
      window.removeEventListener("keydown", handleUnlockAudio);
    };
  }, [autoplayBlocked, playbackState]);

  // 3. Smooth Audio Position Tick (backed by native timeupdate or smooth tick)
  const handleAudioTimeUpdate = () => {
    if (!isScrubbing && audioElementRef.current && playbackState?.isPlaying) {
      setDisplayPosition(audioElementRef.current.currentTime);
    }
  };

  useEffect(() => {
    if (!playbackState?.isPlaying || isScrubbing || !playbackState.currentTrack) return;

    const interval = setInterval(() => {
      if (audioElementRef.current && !audioElementRef.current.paused) {
        setDisplayPosition(audioElementRef.current.currentTime);
      } else {
        const elapsed = (Date.now() - playbackState.startedAt) / 1000;
        const current = Math.min(
          playbackState.currentTrack!.duration,
          playbackState.position + elapsed
        );
        setDisplayPosition(current);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [playbackState, isScrubbing]);

  // 4. Volume Adjustment
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Playback Control Handlers (Optimistic Instant Response)
  const handleTogglePlay = () => {
    if (!socket || !room._id) return;
    const audio = audioElementRef.current;

    if (playbackState?.isPlaying) {
      // Instant local pause without network roundtrip lag
      if (audio) audio.pause();
      setPlaybackState((prev) => (prev ? { ...prev, isPlaying: false } : null));
      socket.emit("music:pause", room._id);
    } else {
      // Instant local play
      if (audio) {
        audio.play().catch(() => {});
      }
      setPlaybackState((prev) => (prev ? { ...prev, isPlaying: true, startedAt: Date.now() } : null));
      socket.emit("music:play", room._id);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPos = parseFloat(e.target.value);
    setDisplayPosition(newPos);
  };

  const handleSeekCommit = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    setIsScrubbing(false);
    const target = e.currentTarget as HTMLInputElement;
    const newPos = parseFloat(target.value);

    // Instant local seek
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = newPos;
    }
    setDisplayPosition(newPos);

    if (socket && room._id) {
      socket.emit("music:seek", { roomId: room._id, position: newPos });
    }
  };

  const handleVoteSkip = () => {
    if (!socket || !room._id) return;
    socket.emit("music:vote-skip", room._id);
  };

  const handleAdminSkip = () => {
    if (!socket || !room._id) return;
    socket.emit("music:admin-skip", room._id);
  };

  const handleAddTrack = (track: TrackItem) => {
    if (!socket || !room._id) return;
    const trackWithUser: TrackItem = {
      ...track,
      addedBy: {
        userId: currentUserId,
        username: currentUsername,
      },
    };
    socket.emit("music:add-queue", { roomId: room._id, track: trackWithUser });
    setIsAddQueueOpen(false);
  };

  const handleAddCustomTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTrackTitle.trim() || !customTrackUrl.trim()) return;

    if (!customTrackUrl.startsWith("https://")) {
      alert("Audio URL must use secure https:// protocol.");
      return;
    }

    const durationSec = parseInt(customTrackDuration, 10) || 180;
    const newTrack: TrackItem = {
      id: `custom-${Date.now()}`,
      title: customTrackTitle.trim(),
      artist: customTrackArtist.trim() || "Independent Artist",
      url: customTrackUrl.trim(),
      duration: durationSec,
      coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80",
    };

    handleAddTrack(newTrack);
    setCustomTrackTitle("");
    setCustomTrackArtist("");
    setCustomTrackUrl("");
  };

  // Format Seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Profile Save Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const wsId = room.workspaceId || room._id;
    if (!wsId) return;

    setProfileSaveError(null);
    setIsSavingProfile(true);

    try {
      const res = await updateCompanyProfile(wsId, profileForm);
      setCompanyProfile(res.data || res);
      setIsEditProfileOpen(false);
    } catch (err: any) {
      setProfileSaveError(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Announcement Post Handler
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const wsId = room.workspaceId || room._id;
    if (!wsId || !announcementTitle.trim() || !announcementBody.trim()) return;

    setAnnouncementError(null);
    setIsPostingAnnouncement(true);

    try {
      const res = await addWorkspaceAnnouncement(wsId, {
        title: announcementTitle.trim(),
        body: announcementBody.trim(),
      });
      const newAnn = res.data || res;
      setCompanyProfile((prev) =>
        prev
          ? {
              ...prev,
              announcements: [newAnn, ...(prev.announcements || [])],
            }
          : null
      );
      setAnnouncementTitle("");
      setAnnouncementBody("");
      setIsAnnouncementModalOpen(false);
    } catch (err: any) {
      setAnnouncementError(err?.response?.data?.message || "Failed to post announcement");
    } finally {
      setIsPostingAnnouncement(false);
    }
  };

  // Active online member avatars
  const activeMembers = useMemo(() => {
    const map = new Map<string, { id: string; username: string }>();
    onlineUsers.forEach((u) => {
      map.set(u.userId, { id: u.userId, username: u.username });
    });
    // Ensure current active user in lounge is counted even before socket presence roundtrip resolves
    if (isInLounge && currentUserId && !map.has(currentUserId)) {
      map.set(currentUserId, { id: currentUserId, username: currentUsername });
    }
    return Array.from(map.values());
  }, [onlineUsers, isInLounge, currentUserId, currentUsername]);

  const currentTrack = playbackState?.currentTrack;
  const trackDuration = currentTrack?.duration || 1;

  return (
    <div className="space-y-6">
      {/* Hidden Audio Player */}
      <audio
        ref={audioElementRef}
        preload="auto"
        onTimeUpdate={handleAudioTimeUpdate}
        onEnded={() => {
          if (socket && room._id) socket.emit("music:get-state", room._id);
        }}
      />

      {/* Back to Rooms Link with Leave Confirmation */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={onLeaveRoom}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Rooms</span>
        </button>
      </div>

      {/* ── LOUNGE HEADER ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  {room.name || "Lounge"}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  <Radio className="w-3 h-3 text-purple-600 animate-pulse" />
                  Default Social Space
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  {activeMembers.length} Online
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl">
                {room.description ||
                  "The central gathering hub for your team. Catch up with colleagues, enjoy synced music, and stay aligned with company updates."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center shrink-0">
            {/* Live Member Avatar Stack */}
            <div className="flex items-center -space-x-2 mr-2">
              {activeMembers.slice(0, 5).map((m, idx) => (
                <div
                  key={m.id || idx}
                  title={m.username}
                  className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-indigo-700 text-xs font-bold shadow-xs uppercase"
                >
                  {m.username.charAt(0)}
                </div>
              ))}
              {activeMembers.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-600 text-[11px] font-semibold">
                  +{activeMembers.length - 5}
                </div>
              )}
            </div>

            {/* Join / Leave Button */}
            <button
              type="button"
              onClick={() => {
                if (isInLounge) {
                  if (onLeaveRoom) {
                    onLeaveRoom();
                  } else {
                    setIsInLounge(false);
                  }
                } else {
                  setIsInLounge(true);
                }
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs ${
                isInLounge
                  ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
              }`}
            >
              {isInLounge ? (
                <>
                  <LogOut className="w-4 h-4" />
                  <span>Leave Lounge</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Join Lounge</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── THREE CLEAR AREAS: RESPONSIVE GRID ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* AREA 1: ACTIVE MEMBERS (Cols 3 on Large) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-gray-900 tracking-tight">Active Hangout</h2>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {activeMembers.length}
              </span>
            </div>

            {activeMembers.length === 0 ? (
              <div className="text-center py-8 px-2">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 mx-auto flex items-center justify-center mb-2">
                  <Headphones className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-gray-700">You are the first in the Lounge!</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Grab a virtual seat, queue some tracks, and your teammates will drop by shortly.
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {activeMembers.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                          {m.username.charAt(0)}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-gray-900 truncate">{m.username}</p>
                        <p className="text-[10px] text-gray-400 truncate">Listening in Lounge</p>
                      </div>
                    </div>
                    {playbackState?.isPlaying && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-indigo-600 font-medium">
                        <span className="w-1 h-2 bg-indigo-500 rounded-full animate-bounce" />
                        <span className="w-1 h-3 bg-purple-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                        <span className="w-1 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* AREA 2: MUSIC PLAYER & SHARED JUKEBOX (Cols 5 on Large) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Autoplay Unlock Notice (Browser Audio Policy) */}
          {autoplayBlocked && playbackState?.isPlaying && currentTrack && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white flex items-center justify-between gap-3 shadow-md animate-pulse">
              <div className="flex items-center gap-2.5 min-w-0">
                <Volume2 className="w-5 h-5 shrink-0 animate-bounce" />
                <div className="truncate text-xs">
                  <p className="font-bold truncate">Live Track Playing: {currentTrack.title}</p>
                  <p className="text-[11px] text-purple-100 truncate">Browser muted audio until you click to tune in</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const audio = audioElementRef.current;
                  if (audio) {
                    audio.play().then(() => setAutoplayBlocked(false)).catch(() => {});
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white text-indigo-700 font-bold text-xs hover:bg-purple-50 transition-colors shadow-xs cursor-pointer shrink-0"
              >
                Tune In
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs relative overflow-hidden">
            {/* Header / Jukebox Badge */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-bold text-gray-900 tracking-tight">Social Jukebox</h2>
              </div>
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                Royalty-Free Audio
              </span>
            </div>

            {/* Now Playing Visual & Metadata */}
            {currentTrack ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-900 shadow-md shrink-0 flex items-center justify-center">
                    {currentTrack.coverUrl ? (
                      <img
                        src={currentTrack.coverUrl}
                        alt={currentTrack.title}
                        className={`w-full h-full object-cover ${playbackState?.isPlaying ? "scale-105 transition-transform duration-700" : "opacity-80"}`}
                      />
                    ) : (
                      <Music className="w-8 h-8 text-white/70" />
                    )}
                    {playbackState?.isPlaying && (
                      <div className="absolute inset-0 bg-indigo-900/20 flex items-center justify-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                      Now Playing
                    </span>
                    <h3 className="text-base font-bold text-gray-900 truncate tracking-tight">
                      {currentTrack.title}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">{currentTrack.artist}</p>
                    {currentTrack.addedBy && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Added by <span className="font-semibold text-gray-600">@{currentTrack.addedBy.username}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Scrubber Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="relative flex items-center">
                    <input
                      type="range"
                      min={0}
                      max={trackDuration}
                      step={0.5}
                      value={displayPosition}
                      onChange={handleSeek}
                      onMouseDown={() => setIsScrubbing(true)}
                      onMouseUp={handleSeekCommit}
                      onTouchStart={() => setIsScrubbing(true)}
                      onTouchEnd={handleSeekCommit}
                      aria-label="Seek track position"
                      className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-medium text-gray-400">
                    <span>{formatTime(displayPosition)}</span>
                    <span>{formatTime(trackDuration)}</span>
                  </div>
                </div>

                {/* Primary Player Controls */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    {/* Play/Pause */}
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      aria-label={playbackState?.isPlaying ? "Pause music" : "Play music"}
                      className="w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-indigo-100 cursor-pointer"
                    >
                      {playbackState?.isPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>

                    {/* Upvote Skip */}
                    <button
                      type="button"
                      onClick={handleVoteSkip}
                      title={`Vote to skip track (${playbackState?.skipVotesCount || 0}/${playbackState?.skipVotesRequired || 1})`}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                        playbackState?.hasVotedSkip
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>
                        Vote Skip ({playbackState?.skipVotesCount || 0}/{playbackState?.skipVotesRequired || 1})
                      </span>
                    </button>

                    {/* Admin Force Skip */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={handleAdminSkip}
                        title="Admin instant override skip"
                        className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Admin Skip</span>
                      </button>
                    )}
                  </div>

                  {/* Per-User Volume Slider */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      aria-label={isMuted ? "Unmute" : "Mute"}
                      className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-rose-500" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value));
                        if (isMuted) setIsMuted(false);
                      }}
                      aria-label="User volume"
                      className="w-16 sm:w-20 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Empty Playing State */
              <div className="text-center py-8 px-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Music className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Music is currently silent</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 mb-4 leading-relaxed">
                  Start the session by picking an ambient focus track or study beat from the royalty-free library.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddQueueOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Queue First Track</span>
                </button>
              </div>
            )}

            {/* ── QUEUE SECTION ─────────────────────────────────── */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Shared Queue ({playbackState?.queue?.length || 0})
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddQueueOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Track</span>
                </button>
              </div>

              {!playbackState?.queue || playbackState.queue.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">
                  No upcoming tracks in queue. Add tracks so the music never stops.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {playbackState.queue.map((track, i) => (
                    <div
                      key={track.id + i}
                      className="flex items-center justify-between p-2 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[11px] font-bold text-gray-400 w-4 text-center">
                          #{i + 1}
                        </span>
                        <div className="truncate">
                          <p className="font-semibold text-gray-900 truncate">{track.title}</p>
                          <p className="text-[10px] text-gray-500 truncate">{track.artist}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="text-[11px] text-gray-400 font-medium">
                          {formatTime(track.duration)}
                        </span>
                        {track.addedBy && (
                          <p className="text-[10px] text-indigo-600 font-medium">
                            @{track.addedBy.username}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AREA 3: COMPANY INFO PANEL (Cols 4 on Large) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-5">
            {/* Header with Admin Edit Button */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-gray-900 tracking-tight">Company Info</h2>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            {/* Profile Loading State */}
            {isProfileLoading ? (
              <div className="py-8 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
                <span className="text-xs">Loading company profile...</span>
              </div>
            ) : (
              <>
                {/* Brand Logo & Name */}
                <div className="flex items-center gap-3">
                  {companyProfile?.logoUrl ? (
                    <img
                      src={companyProfile.logoUrl}
                      alt={companyProfile.name}
                      className="w-12 h-12 rounded-xl object-contain border border-gray-100 p-1"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
                      {(companyProfile?.name || "AudioHive").charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-gray-900 truncate">
                      {companyProfile?.name || "Our Workspace"}
                    </h3>
                    <p className="text-xs text-indigo-600 font-medium truncate">
                      {companyProfile?.tagline || "Welcome to our virtual headquarters"}
                    </p>
                  </div>
                </div>

                {/* About & Mission */}
                {companyProfile?.about && (
                  <div className="bg-gray-50/70 rounded-xl p-3 text-xs leading-relaxed text-gray-600 border border-gray-100">
                    <span className="font-semibold text-gray-900 block mb-1">About Us</span>
                    {companyProfile.about}
                  </div>
                )}

                {companyProfile?.mission && (
                  <div className="bg-purple-50/50 rounded-xl p-3 text-xs leading-relaxed text-purple-900 border border-purple-100/60">
                    <span className="font-semibold text-purple-950 block mb-1">Our Mission</span>
                    {companyProfile.mission}
                  </div>
                )}

                {/* Company Links (Whitelist https only) */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                    Quick Links
                  </span>
                  {companyProfile?.website && (
                    <a
                      href={companyProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs text-gray-700 font-medium transition-colors group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">Official Website</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-gray-600 shrink-0" />
                    </a>
                  )}

                  {companyProfile?.links && companyProfile.links.length > 0 ? (
                    companyProfile.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs text-gray-700 font-medium transition-colors group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">{link.label}</span>
                        </div>
                        <span title="Verified HTTPS Link">
                          <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                        </span>
                      </a>
                    ))
                  ) : !companyProfile?.website ? (
                    <p className="text-xs text-gray-400 italic">No external links configured.</p>
                  ) : null}
                </div>

                {/* ── ANNOUNCEMENTS FEED ────────────────────────────── */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Megaphone className="w-4 h-4 text-purple-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        Announcements
                      </h3>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setIsAnnouncementModalOpen(true)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                      >
                        + Post
                      </button>
                    )}
                  </div>

                  {!companyProfile?.announcements || companyProfile.announcements.length === 0 ? (
                    <div className="p-3 bg-gray-50 rounded-xl text-center">
                      <p className="text-xs text-gray-500 font-medium">No announcements yet</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Company announcements and updates will appear right here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {companyProfile.announcements.map((ann, idx) => (
                        <div
                          key={ann._id || idx}
                          className="p-3 rounded-xl bg-gray-50/90 border border-gray-100 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900">{ann.title}</span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(ann.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <p className="text-gray-600 text-[11px] leading-relaxed">{ann.body}</p>
                          <p className="text-[10px] text-indigo-600 font-medium pt-0.5">
                            By {ann.createdBy}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL: ADD TRACK TO QUEUE ─────────────────────────────── */}
      {isAddQueueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-gray-900">Add Track to Lounge Queue</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddQueueOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-gray-100 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setModalTab("library")}
                className={`pb-2.5 px-4 cursor-pointer border-b-2 transition-colors ${
                  modalTab === "library"
                    ? "border-indigo-600 text-indigo-600 font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Royalty-Free Library
              </button>
              <button
                type="button"
                onClick={() => setModalTab("custom")}
                className={`pb-2.5 px-4 cursor-pointer border-b-2 transition-colors ${
                  modalTab === "custom"
                    ? "border-indigo-600 text-indigo-600 font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Custom Audio URL
              </button>
            </div>

            {modalTab === "library" ? (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {libraryLoading ? (
                  <div className="py-8 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                    <span>Loading royalty-free catalog...</span>
                  </div>
                ) : libraryTracks.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No library tracks found.</p>
                ) : (
                  libraryTracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-indigo-50/60 border border-gray-100 transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="text-xs font-bold text-gray-900 truncate">{track.title}</p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {track.artist} • {formatTime(track.duration)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddTrack(track)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Queue</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <form onSubmit={handleAddCustomTrack} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Track Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Midnight Ambient Focus"
                    value={customTrackTitle}
                    onChange={(e) => setCustomTrackTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Artist Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Team Studio"
                    value={customTrackArtist}
                    onChange={(e) => setCustomTrackArtist(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Direct Audio File URL (must start with https://)
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/audio/sample.mp3"
                    value={customTrackUrl}
                    onChange={(e) => setCustomTrackUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Duration (Seconds)</label>
                  <input
                    type="number"
                    min={10}
                    max={1200}
                    value={customTrackDuration}
                    onChange={(e) => setCustomTrackDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddQueueOpen(false)}
                    className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
                  >
                    Add to Queue
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT COMPANY PROFILE (ADMIN ONLY) ─────────────── */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-gray-900">Edit Company Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileSaveError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileSaveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Company / Team Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Remote collaboration at its best"
                  value={profileForm.tagline}
                  onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">About Company</label>
                <textarea
                  rows={2}
                  value={profileForm.about}
                  onChange={(e) => setProfileForm({ ...profileForm, about: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Mission</label>
                <textarea
                  rows={2}
                  value={profileForm.mission}
                  onChange={(e) => setProfileForm({ ...profileForm, mission: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Website URL (must start with https://)
                </label>
                <input
                  type="url"
                  placeholder="https://yourcompany.com"
                  value={profileForm.website}
                  onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Logo Image URL (must start with https://)
                </label>
                <input
                  type="url"
                  placeholder="https://yourcompany.com/logo.png"
                  value={profileForm.logoUrl}
                  onChange={(e) => setProfileForm({ ...profileForm, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Dynamic Links Editor */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-gray-700">Verified Links (https only)</label>
                  <button
                    type="button"
                    onClick={() =>
                      setProfileForm({
                        ...profileForm,
                        links: [...profileForm.links, { label: "", url: "" }],
                      })
                    }
                    className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
                  >
                    + Add Link
                  </button>
                </div>

                {profileForm.links.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Label (e.g. Handbook)"
                      value={link.label}
                      onChange={(e) => {
                        const next = [...profileForm.links];
                        next[idx].label = e.target.value;
                        setProfileForm({ ...profileForm, links: next });
                      }}
                      className="w-1/3 px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <input
                      type="url"
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => {
                        const next = [...profileForm.links];
                        next[idx].url = e.target.value;
                        setProfileForm({ ...profileForm, links: next });
                      }}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = profileForm.links.filter((_, i) => i !== idx);
                        setProfileForm({ ...profileForm, links: next });
                      }}
                      className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: POST ANNOUNCEMENT (ADMIN ONLY) ────────────────── */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-gray-900">Post Announcement</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAnnouncementModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {announcementError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{announcementError}</span>
              </div>
            )}

            <form onSubmit={handlePostAnnouncement} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. All-Hands Meeting this Friday"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Announcement Body</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Share important updates, milestones, or instructions with your team..."
                  value={announcementBody}
                  onChange={(e) => setAnnouncementBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPostingAnnouncement}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isPostingAnnouncement && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Publish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
