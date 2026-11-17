import React from "react";
import { useSocket } from "../../../context/SocketContext";
import { useAuth } from "../../../context/AuthContext";
import { useVoiceChat } from "../../../hooks/useVoiceChat";
import VoiceChatPanel from "../VoiceChatPanel";
import { RoomChatPanel } from "../RoomChatPanel";

interface VoiceAndChatSectionProps {
  roomId: string;
  roomName: string;
}

export const VoiceAndChatSection: React.FC<VoiceAndChatSectionProps> = ({
  roomId,
  roomName,
}) => {
  const { socket } = useSocket();
  const { username } = useAuth();

  // If socket is available, connect voice hook
  const {
    isInVoice,
    isMuted,
    voiceParticipants,
    remoteStreams,
    joinVoice,
    leaveVoice,
    toggleMute,
  } = useVoiceChat(socket as any);

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-5 h-full min-h-[550px] overflow-hidden">
      {/* Voice Channel Sidebar */}
      <div className="w-full lg:w-80 xl:w-96 flex flex-col shrink-0">
        <VoiceChatPanel
          voiceParticipants={voiceParticipants}
          remoteStreams={remoteStreams}
          isMuted={isMuted}
          isInVoice={isInVoice}
          currentUsername={username || "You"}
          onToggleMute={toggleMute}
          onLeave={leaveVoice}
          onJoin={() => joinVoice(roomId)}
        />
      </div>

      {/* Main Room Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <RoomChatPanel roomId={roomId} roomName={roomName} />
      </div>
    </div>
  );
};

export default VoiceAndChatSection;

