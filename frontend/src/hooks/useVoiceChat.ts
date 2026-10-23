import { useCallback, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface VoiceParticipant {
  peerId: string;
  userId: string;
  username: string;
}

// ── STUN servers (free Google STUN — no TURN needed for LAN / most NATs) ─────
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useVoiceChat(socket: Socket) {
  const [isInVoice, setIsInVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceParticipants, setVoiceParticipants] = useState<VoiceParticipant[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [micError, setMicError] = useState<string | null>(null);

  // Refs so callbacks always see the latest value without re-creating effects
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const currentRoomRef = useRef<string | null>(null);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const addParticipant = useCallback((p: VoiceParticipant) => {
    setVoiceParticipants((prev) =>
      prev.some((x) => x.peerId === p.peerId) ? prev : [...prev, p]
    );
  }, []);

  const removeParticipant = useCallback((peerId: string) => {
    setVoiceParticipants((prev) => prev.filter((x) => x.peerId !== peerId));
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.delete(peerId);
      return next;
    });
  }, []);

  const closePeer = useCallback((peerId: string) => {
    const pc = peersRef.current.get(peerId);
    if (pc) {
      pc.close();
      peersRef.current.delete(peerId);
    }
    removeParticipant(peerId);
  }, [removeParticipant]);

  // ── Create and configure a new RTCPeerConnection ────────────────────────────
  const createPeerConnection = useCallback(
    (peerId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Add local audio tracks to the connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // When we receive a remote track, store it as a MediaStream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteStreams((prev) => new Map(prev).set(peerId, remoteStream));
      };

      // Relay ICE candidates through the server
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("voice:ice-candidate", {
            to: peerId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          closePeer(peerId);
        }
      };

      peersRef.current.set(peerId, pc);
      return pc;
    },
    [socket, closePeer]
  );

  // ── Join voice ───────────────────────────────────────────────────────────────
  const joinVoice = useCallback(
    async (roomId: string) => {
      if (isInVoice) return;
      setMicError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 },
          video: false,
        });
        localStreamRef.current = stream;
        currentRoomRef.current = roomId;
        setIsInVoice(true);
        setIsMuted(false);
        socket.emit("voice:join", roomId);
      } catch {
        setMicError("Microphone access denied. Please allow mic access and try again.");
      }
    },
    [isInVoice, socket]
  );

  // ── Leave voice ──────────────────────────────────────────────────────────────
  const leaveVoice = useCallback(
    (roomId: string) => {
      // Close all peer connections
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();

      // Stop all local audio tracks
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;

      setIsInVoice(false);
      setIsMuted(false);
      setVoiceParticipants([]);
      setRemoteStreams(new Map());
      currentRoomRef.current = null;
      socket.emit("voice:leave", roomId);
    },
    [socket]
  );

  // ── Toggle mute ──────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  }, []);

  // ── Socket event listeners ───────────────────────────────────────────────────
  useEffect(() => {
    // Server sends this right after voice:join with the list of already-present peers
    const onParticipants = async (
      participants: VoiceParticipant[]
    ) => {
      // New joiner creates an offer to each existing participant
      for (const participant of participants) {
        addParticipant(participant);
        const pc = createPeerConnection(participant.peerId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("voice:offer", { to: participant.peerId, sdp: offer });
      }
    };

    // Existing participant receives this when a new user joins
    // They wait for that user's offer — no action needed here
    const onUserJoined = (participant: VoiceParticipant) => {
      addParticipant(participant);
      // The new joiner will send us an offer — we just create the PC to be ready
      if (!peersRef.current.has(participant.peerId)) {
        createPeerConnection(participant.peerId);
      }
    };

    const onUserLeft = ({ peerId }: { peerId: string }) => {
      closePeer(peerId);
    };

    const onOffer = async ({
      from,
      sdp,
    }: {
      from: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      let pc = peersRef.current.get(from);
      if (!pc) {
        pc = createPeerConnection(from);
      }
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("voice:answer", { to: from, sdp: answer });
    };

    const onAnswer = async ({
      from,
      sdp,
    }: {
      from: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      const pc = peersRef.current.get(from);
      if (pc && pc.signalingState !== "stable") {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    };

    const onIceCandidate = async ({
      from,
      candidate,
    }: {
      from: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const pc = peersRef.current.get(from);
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {
          // Ignore stale ICE candidates
        }
      }
    };

    socket.on("voice:participants", onParticipants);
    socket.on("voice:user-joined", onUserJoined);
    socket.on("voice:user-left", onUserLeft);
    socket.on("voice:offer", onOffer);
    socket.on("voice:answer", onAnswer);
    socket.on("voice:ice-candidate", onIceCandidate);

    return () => {
      socket.off("voice:participants", onParticipants);
      socket.off("voice:user-joined", onUserJoined);
      socket.off("voice:user-left", onUserLeft);
      socket.off("voice:offer", onOffer);
      socket.off("voice:answer", onAnswer);
      socket.off("voice:ice-candidate", onIceCandidate);
    };
  }, [socket, addParticipant, createPeerConnection, closePeer]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (currentRoomRef.current) {
        leaveVoice(currentRoomRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isInVoice,
    isMuted,
    voiceParticipants,
    remoteStreams,
    micError,
    joinVoice,
    leaveVoice,
    toggleMute,
  };
}
