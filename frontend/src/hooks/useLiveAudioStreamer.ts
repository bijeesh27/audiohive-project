import { useState, useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import type { LiveTranscriptTurn } from "../types/liveTranscript";
import { transcribeAudioBlob } from "../services/groqClient";

interface UseLiveAudioStreamerProps {
  localStream: MediaStream | null;
  isMuted: boolean;
  isInCall: boolean;
  isCaptionsEnabled: boolean;
  roomId: string;
  speakerName: string;
  speakerId: string;
  socket: Socket | null;
  onTurn?: (turn: LiveTranscriptTurn) => void;
}

export function useLiveAudioStreamer({
  localStream,
  isMuted,
  isInCall,
  isCaptionsEnabled,
  roomId,
  speakerName,
  speakerId,
  socket,
  onTurn,
}: UseLiveAudioStreamerProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [chunksSent, setChunksSent] = useState(0);
  const sliceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    let isDestroyed = false;

    const cleanup = () => {
      isDestroyed = true;
      setIsStreaming(false);

      if (sliceTimerRef.current) {
        clearTimeout(sliceTimerRef.current);
        sliceTimerRef.current = null;
      }

      if (
        activeRecorderRef.current &&
        activeRecorderRef.current.state !== "inactive"
      ) {
        try {
          activeRecorderRef.current.stop();
        } catch {
          // Ignore
        }
      }
      activeRecorderRef.current = null;
    };

    const shouldStream =
      isInCall &&
      isCaptionsEnabled &&
      !isMuted &&
      Boolean(localStream) &&
      Boolean(roomId);

    if (!shouldStream) {
      cleanup();
      return;
    }

    const audioTrack = localStream?.getAudioTracks()[0];
    if (!audioTrack) {
      cleanup();
      return;
    }

    setIsStreaming(true);

    // Pick best supported MIME type
    let mimeType = "audio/webm;codecs=opus";
    if (typeof MediaRecorder !== "undefined") {
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
          mimeType = "audio/ogg;codecs=opus";
        } else {
          mimeType = "";
        }
      }
    }

    const streamSlice = () => {
      if (isDestroyed) return;

      try {
        const stream = new MediaStream([audioTrack]);
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);

        activeRecorderRef.current = recorder;
        const chunks: Blob[] = [];

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onstop = async () => {
          if (isDestroyed) return;

          if (chunks.length > 0) {
            const blob = new Blob(chunks, {
              type: mimeType || "audio/webm",
            });

            // Discard tiny background empty noise (< 300 bytes)
            if (blob.size >= 300) {
              setChunksSent((prev) => prev + 1);

              // 1. Send via WebSocket if socket is connected
              if (socket?.connected) {
                try {
                  const arrayBuffer = await blob.arrayBuffer();
                  socket.emit("call:live-audio-chunk", {
                    roomId,
                    audioData: arrayBuffer,
                    mimeType: mimeType || "audio/webm",
                    speakerName,
                    speakerId,
                  });
                } catch (err) {
                  console.error("[LiveAudio] Error sending chunk to socket:", err);
                }
              }

              // 2. Direct client-side Groq transcription for instant, reliable subtitles
              transcribeAudioBlob(blob)
                .then((text) => {
                  if (text && !isDestroyed) {
                    const turn: LiveTranscriptTurn = {
                      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                      speakerId,
                      speakerName,
                      text,
                      timestamp: Date.now(),
                    };

                    // Update local captions & transcript drawer immediately
                    onTurn?.(turn);

                    // Broadcast to other peers over socket
                    if (socket?.connected) {
                      socket.emit("call:live-transcript", {
                        ...turn,
                        roomId,
                      });
                    }
                  }
                })
                .catch((err) => {
                  console.error("[LiveAudio] Direct transcription error:", err);
                });
            }
          }
        };

        recorder.start();

        // Run this slice for 2.5 seconds, then stop and immediately spawn next slice
        sliceTimerRef.current = setTimeout(() => {
          if (recorder.state === "recording") {
            try {
              recorder.stop();
            } catch {
              // Ignore
            }
          }

          if (!isDestroyed) {
            streamSlice();
          }
        }, 2500);
      } catch (err) {
        console.error("[LiveAudio] Failed to record audio slice:", err);
        sliceTimerRef.current = setTimeout(() => {
          if (!isDestroyed) streamSlice();
        }, 1000);
      }
    };

    streamSlice();

    return () => {
      cleanup();
    };
  }, [
    isInCall,
    isCaptionsEnabled,
    isMuted,
    localStream,
    socket,
    roomId,
    speakerName,
    speakerId,
    onTurn,
  ]);

  return { isStreaming, chunksSent };
}
