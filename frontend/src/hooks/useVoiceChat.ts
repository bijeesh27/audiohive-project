import { useMemo } from "react";
import { Socket } from "socket.io-client";
import { useCall } from "./useCall";

export interface VoiceParticipant {
  peerId: string;
  userId: string;
  username: string;
}

export function useVoiceChat(socket: Socket) {
  const {
    isInCall,
    isMuted,
    participants,
    error,
    joinCall,
    leaveCall,
    toggleMute,
  } = useCall(socket);

  const voiceParticipants = useMemo<VoiceParticipant[]>(() => {
    return participants.map((p) => ({
      peerId: p.peerId,
      userId: p.userId,
      username: p.username,
    }));
  }, [participants]);

  const remoteStreams = useMemo<Map<string, MediaStream>>(() => {
    const map = new Map<string, MediaStream>();
    participants.forEach((p) => {
      if (p.stream) {
        map.set(p.peerId, p.stream);
      }
    });
    return map;
  }, [participants]);

  return {
    isInVoice: isInCall,
    isMuted,
    voiceParticipants,
    remoteStreams,
    micError: error,
    joinVoice: (roomId: string) => joinCall(roomId, { startVideoOff: true }),
    leaveVoice: () => leaveCall(),
    toggleMute,
  };
}
