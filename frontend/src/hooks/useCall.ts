import { useCallback, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import type { CallParticipant, CallMediaPreferences, UseCallReturn } from "../types/call";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

const SPEAKING_THRESHOLD = 0.04;

export function useCall(socket: Socket): UseCallReturn {
  const [isInCall, setIsInCall] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [speakingPeers, setSpeakingPeers] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const candidateQueueRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const currentRoomRef = useRef<string | null>(null);

  // Audio analysis for speaking detection
  const audioContextRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Map<string, AnalyserNode>>(new Map());
  const animationFrameRef = useRef<number | null>(null);

  // Synchronize state helpers
  const updateParticipant = useCallback((peerId: string, updates: Partial<CallParticipant>) => {
    setParticipants((prev) =>
      prev.map((p) => (p.peerId === peerId ? { ...p, ...updates } : p))
    );
  }, []);

  const removeParticipant = useCallback((peerId: string) => {
    setParticipants((prev) => prev.filter((p) => p.peerId !== peerId));
    remoteStreamsRef.current.delete(peerId);
    analysersRef.current.delete(peerId);
  }, []);

  const closePeer = useCallback((peerId: string) => {
    const pc = peersRef.current.get(peerId);
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.close();
      peersRef.current.delete(peerId);
    }
    candidateQueueRef.current.delete(peerId);
    removeParticipant(peerId);
  }, [removeParticipant]);

  // Drain queued candidates once remote description is set
  const drainCandidateQueue = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    const queue = candidateQueueRef.current.get(peerId) || [];
    if (queue.length > 0) {
      for (const candidate of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {
          // Ignore candidate add failure
        }
      }
      candidateQueueRef.current.delete(peerId);
    }
  }, []);

  // Setup audio analyzer node for a given stream
  const attachAudioAnalyser = useCallback((key: string, stream: MediaStream) => {
    try {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }

      const audioCtx = audioContextRef.current;
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);
      analysersRef.current.set(key, analyser);
    } catch {
      // AudioContext failure should not break the call
    }
  }, []);

  // Speaking detection loop
  useEffect(() => {
    if (!isInCall) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const dataArray = new Uint8Array(256);

    const checkVolume = () => {
      const activeSpeakers = new Set<string>();

      analysersRef.current.forEach((analyser, id) => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length / 255;
        if (average > SPEAKING_THRESHOLD) {
          activeSpeakers.add(id);
        }
      });

      setSpeakingPeers((prev) => {
        if (prev.size !== activeSpeakers.size) return activeSpeakers;
        for (const id of activeSpeakers) {
          if (!prev.has(id)) return activeSpeakers;
        }
        return prev;
      });

      animationFrameRef.current = requestAnimationFrame(checkVolume);
    };

    animationFrameRef.current = requestAnimationFrame(checkVolume);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isInCall]);

  // Create RTCPeerConnection
  const createPeerConnection = useCallback(
    (peerId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Add existing local audio track
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          pc.addTrack(audioTrack, localStreamRef.current);
        }
      }

      // Add active video track (screen track if sharing, else camera track)
      if (screenStreamRef.current) {
        const screenTrack = screenStreamRef.current.getVideoTracks()[0];
        if (screenTrack) {
          pc.addTrack(screenTrack, screenStreamRef.current);
        }
      } else if (localStreamRef.current) {
        const cameraTrack = localStreamRef.current.getVideoTracks()[0];
        if (cameraTrack) {
          pc.addTrack(cameraTrack, localStreamRef.current);
        }
      }

      // Handle incoming remote media
      pc.ontrack = (event) => {
        const stream = event.streams[0] || new MediaStream([event.track]);
        remoteStreamsRef.current.set(peerId, stream);
        attachAudioAnalyser(peerId, stream);

        updateParticipant(peerId, { stream });
      };

      // Forward ICE candidates to peer
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("call:ice-candidate", {
            to: peerId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        updateParticipant(peerId, { connectionState: state });

        if (state === "disconnected" || state === "failed" || state === "closed") {
          closePeer(peerId);
        }
      };

      peersRef.current.set(peerId, pc);
      return pc;
    },
    [socket, attachAudioAnalyser, updateParticipant, closePeer]
  );

  // Join Call
  const joinCall = useCallback(
    async (roomId: string, preferences?: CallMediaPreferences) => {
      if (isInCall || isConnecting) return;

      setError(null);
      setIsConnecting(true);

      const wantVideo = preferences?.startVideoOff !== true;
      const wantMute = preferences?.startMuted === true;

      let stream: MediaStream | null = null;
      let videoAvailable = wantVideo;

      try {
        if (wantVideo) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 },
              video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
            });
          } catch {
            videoAvailable = false;
          }
        }

        if (!stream) {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 },
            video: false,
          });
          videoAvailable = false;
        }

        if (wantMute) {
          const audioTrack = stream.getAudioTracks()[0];
          if (audioTrack) audioTrack.enabled = false;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsInCall(true);
        setIsMuted(wantMute);
        setIsVideoOff(!videoAvailable);
        setIsScreenSharing(false);
        currentRoomRef.current = roomId;

        attachAudioAnalyser("local", stream);

        socket.emit("call:join", roomId, {
          isMuted: wantMute,
          isVideoOff: !videoAvailable,
        });
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error && err.name === "NotAllowedError"
            ? "Microphone access denied. Please grant microphone permission in your browser."
            : "Failed to access audio device. Please check your microphone connection.";
        setError(errorMsg);
      } finally {
        setIsConnecting(false);
      }
    },
    [isInCall, isConnecting, socket, attachAudioAnalyser]
  );

  // Stop Screen Share
  const stopScreenShare = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    setIsScreenSharing(false);

    const cameraTrack = localStreamRef.current?.getVideoTracks()[0] ?? null;

    for (const pc of peersRef.current.values()) {
      const videoTransceiver = pc
        .getTransceivers()
        .find(
          (t) =>
            t.sender.track?.kind === "video" ||
            t.receiver.track?.kind === "video"
        );
      const sender = videoTransceiver
        ? videoTransceiver.sender
        : pc.getSenders().find((s) => s.track?.kind === "video");

      if (sender) {
        await sender.replaceTrack(cameraTrack).catch(() => {});
      }
    }

    setLocalStream(
      localStreamRef.current ? new MediaStream(localStreamRef.current.getTracks()) : null
    );

    socket.emit("call:media-state-changed", {
      isScreenSharing: false,
      isVideoOff: !cameraTrack,
    });
  }, [socket]);

  // Leave Call
  const leaveCall = useCallback(() => {
    // Stop screen sharing if active
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    // Close peer connections
    peersRef.current.forEach((pc) => {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.close();
    });
    peersRef.current.clear();
    candidateQueueRef.current.clear();
    remoteStreamsRef.current.clear();
    analysersRef.current.clear();

    // Stop local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setIsInCall(false);
    setIsConnecting(false);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setParticipants([]);
    setLocalStream(null);
    setSpeakingPeers(new Set());
    currentRoomRef.current = null;

    socket.emit("call:leave");
  }, [socket]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const nextMuted = audioTrack.enabled;
      audioTrack.enabled = !nextMuted;
      setIsMuted(nextMuted);
      socket.emit("call:media-state-changed", { isMuted: nextMuted });
    }
  }, [socket]);

  // Toggle Video (Camera on / off)
  const toggleVideo = useCallback(async () => {
    if (!localStreamRef.current) return;

    if (!isVideoOff) {
      // Turn Camera OFF
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = false;
        videoTrack.stop();
        localStreamRef.current.removeTrack(videoTrack);
      }

      if (!screenStreamRef.current) {
        for (const pc of peersRef.current.values()) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(null).catch(() => {});
          }
        }
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }

      setIsVideoOff(true);
      if (!screenStreamRef.current) {
        socket.emit("call:media-state-changed", { isVideoOff: true });
      }
    } else {
      // Turn Camera ON
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        });
        const newTrack = newStream.getVideoTracks()[0];
        if (!newTrack) return;

        localStreamRef.current.addTrack(newTrack);

        if (!screenStreamRef.current) {
          for (const [peerId, pc] of peersRef.current.entries()) {
            const videoTransceiver = pc
              .getTransceivers()
              .find(
                (t) =>
                  t.sender.track?.kind === "video" ||
                  t.receiver.track?.kind === "video"
              );
            const sender = videoTransceiver
              ? videoTransceiver.sender
              : pc.getSenders().find((s) => s.track?.kind === "video");

            if (sender) {
              await sender.replaceTrack(newTrack);
            } else {
              pc.addTrack(newTrack, localStreamRef.current);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit("call:offer", { to: peerId, sdp: offer });
            }
          }
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
          socket.emit("call:media-state-changed", { isVideoOff: false });
        }

        setIsVideoOff(false);
      } catch {
        setError("Unable to access camera. Please check device permissions.");
      }
    }
  }, [isVideoOff, socket]);

  // Toggle Screen Share
  const toggleScreenShare = useCallback(async () => {
    if (!isInCall) return;

    if (isScreenSharing) {
      await stopScreenShare();
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });

      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack) return;

      screenStreamRef.current = displayStream;

      screenTrack.onended = () => {
        stopScreenShare().catch(() => {});
      };

      for (const [peerId, pc] of peersRef.current.entries()) {
        const videoTransceiver = pc
          .getTransceivers()
          .find(
            (t) =>
              t.sender.track?.kind === "video" ||
              t.receiver.track?.kind === "video"
          );
        const sender = videoTransceiver
          ? videoTransceiver.sender
          : pc.getSenders().find((s) => s.track?.kind === "video");

        if (sender) {
          await sender.replaceTrack(screenTrack);
        } else {
          pc.addTrack(screenTrack, displayStream);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("call:offer", { to: peerId, sdp: offer });
        }
      }

      setIsScreenSharing(true);
      setLocalStream(
        new MediaStream([
          ...(localStreamRef.current?.getAudioTracks() || []),
          screenTrack,
        ])
      );

      socket.emit("call:media-state-changed", {
        isScreenSharing: true,
        isVideoOff: false,
      });
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.name === "NotAllowedError" || err.name === "AbortError")
      ) {
        return;
      }
      setError("Screen sharing could not be started. Please check device permissions.");
    }
  }, [isInCall, isScreenSharing, socket, stopScreenShare]);

  // Socket signaling listener setup
  useEffect(() => {
    const onParticipants = async (existing: CallParticipant[]) => {
      for (const p of existing) {
        setParticipants((prev) =>
          prev.some((x) => x.peerId === p.peerId) ? prev : [...prev, p]
        );
        const pc = createPeerConnection(p.peerId);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("call:offer", { to: p.peerId, sdp: offer });
        } catch {
          // peer connection offer failure
        }
      }
    };

    const onUserJoined = (p: CallParticipant) => {
      setParticipants((prev) =>
        prev.some((x) => x.peerId === p.peerId) ? prev : [...prev, p]
      );
      if (!peersRef.current.has(p.peerId)) {
        createPeerConnection(p.peerId);
      }
    };

    const onUserLeft = ({ peerId }: { peerId: string }) => {
      closePeer(peerId);
    };

    const onMediaStateChanged = ({
      peerId,
      isMuted: peerMuted,
      isVideoOff: peerVideoOff,
      isScreenSharing: peerScreenSharing,
    }: {
      peerId: string;
      isMuted?: boolean;
      isVideoOff?: boolean;
      isScreenSharing?: boolean;
    }) => {
      updateParticipant(peerId, {
        ...(typeof peerMuted === "boolean" && { isMuted: peerMuted }),
        ...(typeof peerVideoOff === "boolean" && { isVideoOff: peerVideoOff }),
        ...(typeof peerScreenSharing === "boolean" && { isScreenSharing: peerScreenSharing }),
      });
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
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await drainCandidateQueue(from, pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("call:answer", { to: from, sdp: answer });
      } catch {
        // Offer/Answer negotiation error
      }
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
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          await drainCandidateQueue(from, pc);
        } catch {
          // Stale answer description
        }
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
      if (!pc || !pc.remoteDescription) {
        const queue = candidateQueueRef.current.get(from) || [];
        queue.push(candidate);
        candidateQueueRef.current.set(from, queue);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Ice candidate error
      }
    };

    const onAccessDenied = ({ message }: { message: string }) => {
      setError(message || "Access denied to this call.");
      leaveCall();
    };

    socket.on("call:participants", onParticipants);
    socket.on("voice:participants", onParticipants);
    socket.on("call:user-joined", onUserJoined);
    socket.on("voice:user-joined", onUserJoined);
    socket.on("call:user-left", onUserLeft);
    socket.on("voice:user-left", onUserLeft);
    socket.on("call:media-state-changed", onMediaStateChanged);
    socket.on("call:offer", onOffer);
    socket.on("voice:offer", onOffer);
    socket.on("call:answer", onAnswer);
    socket.on("voice:answer", onAnswer);
    socket.on("call:ice-candidate", onIceCandidate);
    socket.on("voice:ice-candidate", onIceCandidate);
    socket.on("access-denied", onAccessDenied);

    return () => {
      socket.off("call:participants", onParticipants);
      socket.off("voice:participants", onParticipants);
      socket.off("call:user-joined", onUserJoined);
      socket.off("voice:user-joined", onUserJoined);
      socket.off("call:user-left", onUserLeft);
      socket.off("voice:user-left", onUserLeft);
      socket.off("call:media-state-changed", onMediaStateChanged);
      socket.off("call:offer", onOffer);
      socket.off("voice:offer", onOffer);
      socket.off("call:answer", onAnswer);
      socket.off("voice:answer", onAnswer);
      socket.off("call:ice-candidate", onIceCandidate);
      socket.off("voice:ice-candidate", onIceCandidate);
      socket.off("access-denied", onAccessDenied);
    };
  }, [
    socket,
    leaveCall,
    createPeerConnection,
    closePeer,
    drainCandidateQueue,
    updateParticipant,
  ]);

  // Clean unmount
  useEffect(() => {
    return () => {
      leaveCall();
    };
  }, [leaveCall]);

  return {
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
  };
}
