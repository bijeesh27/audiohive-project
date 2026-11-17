import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Volume2 } from "lucide-react";
import type { VoiceParticipant } from "../../hooks/useVoiceChat";
import { ConfirmDialog } from "../common/ConfirmDialog";

interface VoiceChatPanelProps {
  voiceParticipants: VoiceParticipant[];
  remoteStreams: Map<string, MediaStream>;
  isMuted: boolean;
  isInVoice: boolean;
  currentUsername: string;
  onToggleMute: () => void;
  onLeave: () => void;
  onJoin?: () => void;
}

// ── RemoteAudio: hidden <audio> element that auto-plays a peer's stream ───────
const RemoteAudio = ({ stream }: { stream: MediaStream }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <audio
      ref={audioRef}
      autoPlay
      style={{ display: "none" }}
    />
  );
};

// ── Avatar initials helper ────────────────────────────────────────────────────
const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// ── VoiceChatPanel ────────────────────────────────────────────────────────────
const VoiceChatPanel = ({
  voiceParticipants,
  remoteStreams,
  isMuted,
  isInVoice,
  currentUsername,
  onToggleMute,
  onLeave,
  onJoin,
}: VoiceChatPanelProps) => {
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  if (!isInVoice) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 flex flex-col items-center text-center justify-center min-h-[300px]">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
          <Volume2 className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">Room Voice Channel</h3>
        <p className="text-xs text-gray-500 max-w-xs mb-5 leading-relaxed">
          Talk hands-free with teammates in this room. Audio is low-latency and works alongside group chat.
        </p>

        {voiceParticipants.length > 0 ? (
          <div className="mb-5 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{voiceParticipants.length} teammate{voiceParticipants.length > 1 ? "s" : ""} currently in voice</span>
          </div>
        ) : (
          <div className="mb-5 text-xs text-gray-400">
            Channel is currently quiet
          </div>
        )}

        <button
          type="button"
          onClick={onJoin}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Mic className="w-4 h-4" />
          <span>Connect to Voice</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-indigo-50/70">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-100">
            <Volume2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Voice Channel</h2>
            <p className="text-xs text-gray-500">
              {voiceParticipants.length + 1} participant
              {voiceParticipants.length + 1 !== 1 ? "s" : ""} — connected
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMute}
            title={isMuted ? "Unmute" : "Mute"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isMuted
                ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {isMuted ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                Unmute
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-emerald-600" />
                Mute
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowLeaveModal(true)}
            title="Leave voice"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500 text-white hover:bg-rose-600 active:scale-98 transition-all cursor-pointer shadow-sm shadow-rose-500/20"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            Disconnect
          </button>
        </div>
      </div>

      {/* Participant list */}
      <ul className="divide-y divide-gray-50 overflow-y-auto flex-1">
        {/* You (local user — always first) */}
        <li className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white ring-2 ring-indigo-200">
              <span className="text-xs font-bold">
                {getInitials(currentUsername || "You")}
              </span>
            </div>
            {/* Mic status dot */}
            <span
              className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-white flex items-center justify-center ${
                isMuted ? "bg-rose-500" : "bg-emerald-500"
              }`}
            >
              {isMuted ? (
                <MicOff className="w-2 h-2 text-white" />
              ) : (
                <Mic className="w-2 h-2 text-white" />
              )}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-900 truncate">
              {currentUsername || "You"}
            </p>
            <p className="text-[11px] text-gray-400">{isMuted ? "Muted" : "Active"}</p>
          </div>
          <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
            You
          </span>
        </li>

        {/* Remote peers */}
        {voiceParticipants.map((participant) => {
          const stream = remoteStreams.get(participant.peerId);
          return (
            <li key={participant.peerId} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors">
              {/* Render hidden audio element for this peer's stream */}
              {stream && <RemoteAudio stream={stream} />}

              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center">
                  <span className="text-xs font-bold">
                    {getInitials(participant.username)}
                  </span>
                </div>
                {/* Green "connected" dot */}
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {participant.username}
                </p>
                <p className="text-[11px] text-gray-400">
                  {stream ? "Connected" : "Connecting…"}
                </p>
              </div>

              {/* Animated speaking indicator */}
              {stream && (
                <div className="flex items-end gap-0.5 h-3.5">
                  <span className="w-0.5 h-2 bg-emerald-400 rounded animate-bounce [animation-delay:0ms]" />
                  <span className="w-0.5 h-3.5 bg-emerald-500 rounded animate-bounce [animation-delay:150ms]" />
                  <span className="w-0.5 h-1.5 bg-emerald-400 rounded animate-bounce [animation-delay:300ms]" />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Empty state — only you in the call */}
      {voiceParticipants.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 text-center border-t border-gray-50 bg-gray-50/40">
          <Volume2 className="w-5 h-5 text-gray-300 mb-1" />
          <p className="text-xs font-medium text-gray-500">
            Waiting for others to join voice
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Teammates in this room can connect anytime
          </p>
        </div>
      )}

      {/* Disconnect Voice Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLeaveModal}
        title="Leave Voice Channel"
        message="Are you sure you want to disconnect from this room's voice channel?"
        confirmLabel="Disconnect"
        cancelLabel="Stay Connected"
        isDestructive
        onConfirm={() => {
          setShowLeaveModal(false);
          onLeave();
        }}
        onCancel={() => setShowLeaveModal(false)}
      />
    </div>
  );
};

export default VoiceChatPanel;
