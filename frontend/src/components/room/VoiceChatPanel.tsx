import { useEffect, useRef } from "react";
import { Mic, MicOff, PhoneOff, Volume2 } from "lucide-react";
import type { VoiceParticipant } from "../../hooks/useVoiceChat";

interface VoiceChatPanelProps {
  voiceParticipants: VoiceParticipant[];
  remoteStreams: Map<string, MediaStream>;
  isMuted: boolean;
  isInVoice: boolean;
  currentUsername: string;
  onToggleMute: () => void;
  onLeave: () => void;
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
  currentUsername,
  onToggleMute,
  onLeave,
}: VoiceChatPanelProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-indigo-50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100">
            <Volume2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Voice Chat</h2>
            <p className="text-xs text-gray-500">
              {voiceParticipants.length + 1} participant
              {voiceParticipants.length + 1 !== 1 ? "s" : ""} — live
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            title={isMuted ? "Unmute" : "Mute"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isMuted
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {isMuted ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                Unmute
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                Mute
              </>
            )}
          </button>

          <button
            onClick={onLeave}
            title="Leave voice"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-all"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            Leave
          </button>
        </div>
      </div>

      {/* Participant list */}
      <ul className="divide-y divide-gray-50">
        {/* You (local user — always first) */}
        <li className="flex items-center gap-3 px-6 py-3">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center ring-2 ring-indigo-300">
              <span className="text-xs font-semibold text-indigo-700">
                {getInitials(currentUsername || "You")}
              </span>
            </div>
            {/* Mic status dot */}
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white flex items-center justify-center ${
                isMuted ? "bg-red-500" : "bg-green-500"
              }`}
            >
              {isMuted ? (
                <MicOff className="w-1.5 h-1.5 text-white" />
              ) : (
                <Mic className="w-1.5 h-1.5 text-white" />
              )}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {currentUsername || "You"}
            </p>
            <p className="text-xs text-gray-400">{isMuted ? "Muted" : "Speaking"}</p>
          </div>
          <span className="text-xs text-indigo-500 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
            You
          </span>
        </li>

        {/* Remote peers */}
        {voiceParticipants.map((participant) => {
          const stream = remoteStreams.get(participant.peerId);
          return (
            <li key={participant.peerId} className="flex items-center gap-3 px-6 py-3">
              {/* Render hidden audio element for this peer's stream */}
              {stream && <RemoteAudio stream={stream} />}

              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-xs font-semibold text-green-700">
                    {getInitials(participant.username)}
                  </span>
                </div>
                {/* Green "connected" dot */}
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-white" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {participant.username}
                </p>
                <p className="text-xs text-gray-400">
                  {stream ? "Connected" : "Connecting…"}
                </p>
              </div>

              {/* Animated speaking indicator */}
              {stream && (
                <div className="flex items-end gap-0.5 h-4">
                  <span className="w-0.5 h-2 bg-green-400 rounded animate-bounce [animation-delay:0ms]" />
                  <span className="w-0.5 h-3 bg-green-500 rounded animate-bounce [animation-delay:150ms]" />
                  <span className="w-0.5 h-1.5 bg-green-400 rounded animate-bounce [animation-delay:300ms]" />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Empty state — only you in the call */}
      {voiceParticipants.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 text-center border-t border-gray-50">
          <Volume2 className="w-6 h-6 text-gray-300 mb-2" />
          <p className="text-xs text-gray-400">
            Waiting for others to join…
          </p>
          <p className="text-xs text-gray-300 mt-0.5">
            Share the room link to invite teammates
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceChatPanel;
