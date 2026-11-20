import { useState, useEffect, useCallback, useRef } from "react";
import type { Socket } from "socket.io-client";
import type {
  LiveTranscriptTurn,
  ActiveCaption,
  LiveTranscriptErrorPayload,
} from "../types/liveTranscript";

interface UseLiveTranscriptProps {
  socket: Socket | null;
  roomId: string;
  isCaptionsEnabled: boolean;
}

export function useLiveTranscript({
  socket,
  roomId,
  isCaptionsEnabled,
}: UseLiveTranscriptProps) {
  const [turns, setTurns] = useState<LiveTranscriptTurn[]>([]);
  const [activeCaptions, setActiveCaptions] = useState<ActiveCaption[]>([]);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const fadeTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  // Clear caption after 4.5 seconds of silence from that speaker
  const scheduleCaptionExpiry = useCallback((captionId: string) => {
    const existing = fadeTimersRef.current.get(captionId);
    if (existing) {
      clearTimeout(existing);
    }
    const timer = setTimeout(() => {
      setActiveCaptions((prev) => prev.filter((c) => c.id !== captionId));
      fadeTimersRef.current.delete(captionId);
    }, 4500);

    fadeTimersRef.current.set(captionId, timer);
  }, []);

  const addTurn = useCallback(
    (turn: LiveTranscriptTurn) => {
      if (!turn || !turn.text) return;

      setTurns((prev) => {
        const isDuplicate = prev.some(
          (p) =>
            p.id === turn.id ||
            (p.speakerId === turn.speakerId &&
              p.text === turn.text &&
              Math.abs(p.timestamp - turn.timestamp) < 2000)
        );
        if (isDuplicate) return prev;
        return [...prev, turn];
      });

      if (isCaptionsEnabled) {
        setActiveCaptions((prev) => {
          const filtered = prev.filter((c) => c.speakerId !== turn.speakerId);
          return [...filtered, turn];
        });
        scheduleCaptionExpiry(turn.id);
      }
    },
    [isCaptionsEnabled, scheduleCaptionExpiry]
  );

  // Subscribe to socket events
  useEffect(() => {
    if (!socket || !roomId) return;

    // Request existing meeting turns
    socket.emit("call:get-live-transcripts", roomId);

    const handleNewTranscript = (turn: LiveTranscriptTurn) => {
      addTurn(turn);
    };

    const handleInitialTranscripts = (data: {
      roomId: string;
      turns: LiveTranscriptTurn[];
    }) => {
      if (data && data.roomId === roomId && Array.isArray(data.turns)) {
        setTurns(data.turns);
      }
    };

    const handleTranscriptError = (payload: LiveTranscriptErrorPayload) => {
      if (payload?.message) {
        setTranscriptError(payload.message);
        setTimeout(() => setTranscriptError(null), 8000);
      }
    };

    socket.on("call:live-transcript", handleNewTranscript);
    socket.on("call:get-live-transcripts", handleInitialTranscripts);
    socket.on("call:live-transcript-error", handleTranscriptError);

    return () => {
      socket.off("call:live-transcript", handleNewTranscript);
      socket.off("call:get-live-transcripts", handleInitialTranscripts);
      socket.off("call:live-transcript-error", handleTranscriptError);

      fadeTimersRef.current.forEach((t) => clearTimeout(t));
      fadeTimersRef.current.clear();
    };
  }, [socket, roomId, isCaptionsEnabled, scheduleCaptionExpiry]);

  // If captions are turned off, clear active floating captions immediately
  useEffect(() => {
    if (!isCaptionsEnabled) {
      setActiveCaptions([]);
    }
  }, [isCaptionsEnabled]);

  // Copy full transcript to clipboard
  const copyTranscript = useCallback(async () => {
    if (turns.length === 0) return false;
    const formatted = turns
      .map((t) => {
        const time = new Date(t.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        return `[${time}] ${t.speakerName}: ${t.text}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(formatted);
      return true;
    } catch {
      return false;
    }
  }, [turns]);

  // Download transcript as .txt file
  const downloadTranscript = useCallback(() => {
    if (turns.length === 0) return;
    const formatted = turns
      .map((t) => {
        const time = new Date(t.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        return `[${time}] ${t.speakerName}: ${t.text}`;
      })
      .join("\n\n");

    const header = `AudioHive Live Meeting Transcript\nRoom / Meeting: ${roomId}\nExported At: ${new Date().toLocaleString()}\nTotal Turns: ${turns.length}\n${"=".repeat(50)}\n\n`;
    const fullContent = header + formatted;

    const blob = new Blob([fullContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Meeting-Transcript-${roomId.slice(0, 8)}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [turns, roomId]);

  const clearTranscript = useCallback(() => {
    setTurns([]);
    setActiveCaptions([]);
  }, []);

  return {
    turns,
    activeCaptions,
    transcriptError,
    addTurn,
    copyTranscript,
    downloadTranscript,
    clearTranscript,
  };
}
