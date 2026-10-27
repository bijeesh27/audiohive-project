export interface CallParticipant {
  peerId: string;
  userId: string;
  username: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing?: boolean;
  stream?: MediaStream;
  connectionState?: RTCPeerConnectionState;
}

export interface CallMediaPreferences {
  startMuted?: boolean;
  startVideoOff?: boolean;
}

export interface UseCallReturn {
  isInCall: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  participants: CallParticipant[];
  localStream: MediaStream | null;
  speakingPeers: Set<string>;
  error: string | null;
  joinCall: (roomId: string, preferences?: CallMediaPreferences) => Promise<void>;
  leaveCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
}
