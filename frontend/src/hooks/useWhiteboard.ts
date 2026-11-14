import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import {
  getWhiteboardNotes,
  createStickyNote,
  updateStickyNote,
  moveStickyNote,
  updateStickyNoteColor,
  deleteStickyNote,
} from "../services/whiteboardServices";
import type { StickyNote, WhiteboardCollaborator } from "../services/whiteboardServices";

export function useWhiteboard(roomId: string | undefined) {
  const { socket, isConnected } = useSocket();
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [collaborators, setCollaborators] = useState<WhiteboardCollaborator[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce map for text updates to prevent flooding the server
  const debounceTimerRef = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});

  // 1. Initial REST fetch for immediate loading before/while socket syncs
  useEffect(() => {
    if (!roomId) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getWhiteboardNotes(roomId)
      .then((data) => {
        if (isMounted) {
          setNotes(data || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Error loading whiteboard notes:", err);
          setError("Failed to load whiteboard notes");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  // 2. Real-time Socket.IO Sync
  useEffect(() => {
    if (!socket || !roomId) return;

    const joinWhiteboard = () => {
      socket.emit("whiteboard:join", roomId);
    };

    if (isConnected || socket.connected) {
      joinWhiteboard();
    }

    const handleInitialState = (initialNotes: StickyNote[]) => {
      if (Array.isArray(initialNotes)) {
        setNotes(initialNotes);
        setError(null);
        setIsLoading(false);
      }
    };

    const handlePresence = (users: WhiteboardCollaborator[]) => {
      if (Array.isArray(users)) {
        setCollaborators(users);
      }
    };

    const handleNoteCreated = (newNote: StickyNote) => {
      setNotes((prev) => {
        if (prev.some((n) => n.id === newNote.id)) {
          return prev.map((n) => (n.id === newNote.id ? newNote : n));
        }
        return [...prev, newNote];
      });
    };

    const handleNoteUpdated = (updatedNote: StickyNote) => {
      setNotes((prev) =>
        prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
      );
    };

    const handleNoteMoved = (data: {
      noteId: string;
      positionX: number;
      positionY: number;
      updatedBy?: StickyNote["updatedBy"];
      version?: number;
    }) => {
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id !== data.noteId) return n;
          return {
            ...n,
            positionX: data.positionX,
            positionY: data.positionY,
            updatedBy: data.updatedBy ?? n.updatedBy,
            version: data.version ?? n.version,
          };
        })
      );
    };

    const handleNoteColorUpdated = (data: {
      noteId: string;
      color: string;
      updatedBy?: StickyNote["updatedBy"];
      version?: number;
    }) => {
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id !== data.noteId) return n;
          return {
            ...n,
            color: data.color,
            updatedBy: data.updatedBy ?? n.updatedBy,
            version: data.version ?? n.version,
          };
        })
      );
    };

    const handleNoteDeleted = (data: { noteId: string }) => {
      setNotes((prev) => prev.filter((n) => n.id !== data.noteId));
    };

    const handleWhiteboardError = (err: { message: string }) => {
      console.warn("[Whiteboard Socket Error]:", err.message);
    };

    socket.on("connect", joinWhiteboard);
    socket.on("whiteboard:initial-state", handleInitialState);
    socket.on("whiteboard:presence", handlePresence);
    socket.on("whiteboard:note:created", handleNoteCreated);
    socket.on("whiteboard:note:updated", handleNoteUpdated);
    socket.on("whiteboard:note:moved", handleNoteMoved);
    socket.on("whiteboard:note:color-updated", handleNoteColorUpdated);
    socket.on("whiteboard:note:deleted", handleNoteDeleted);
    socket.on("whiteboard:error", handleWhiteboardError);

    return () => {
      socket.emit("whiteboard:leave", roomId);
      socket.off("connect", joinWhiteboard);
      socket.off("whiteboard:initial-state", handleInitialState);
      socket.off("whiteboard:presence", handlePresence);
      socket.off("whiteboard:note:created", handleNoteCreated);
      socket.off("whiteboard:note:updated", handleNoteUpdated);
      socket.off("whiteboard:note:moved", handleNoteMoved);
      socket.off("whiteboard:note:color-updated", handleNoteColorUpdated);
      socket.off("whiteboard:note:deleted", handleNoteDeleted);
      socket.off("whiteboard:error", handleWhiteboardError);
    };
  }, [socket, roomId, isConnected]);

  // Clean up debounce timers on unmount
  useEffect(() => {
    const timers = debounceTimerRef.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  // 3. Actions
  const addNote = useCallback(
    async (params?: { content?: string; color?: string; positionX?: number; positionY?: number }) => {
      if (!roomId) return;
      try {
        if (socket && socket.connected) {
          socket.emit("whiteboard:note:create", {
            roomId,
            content: params?.content || "",
            color: params?.color,
            positionX: params?.positionX,
            positionY: params?.positionY,
          });
        } else {
          const newNote = await createStickyNote(roomId, {
            content: params?.content || "",
            color: params?.color,
            positionX: params?.positionX,
            positionY: params?.positionY,
          });
          setNotes((prev) => [...prev, newNote]);
        }
      } catch (err) {
        console.error("Failed to add note:", err);
      }
    },
    [roomId, socket]
  );

  const editContent = useCallback(
    (noteId: string, newContent: string) => {
      if (!roomId) return;

      // Optimistically update local state immediately
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, content: newContent } : n))
      );

      // Clear existing debounce timer for this note
      if (debounceTimerRef.current[noteId]) {
        clearTimeout(debounceTimerRef.current[noteId]);
      }

      // Debounce the network dispatch
      debounceTimerRef.current[noteId] = setTimeout(() => {
        if (socket && socket.connected) {
          socket.emit("whiteboard:note:update", {
            roomId,
            noteId,
            content: newContent,
          });
        } else {
          updateStickyNote(roomId, noteId, { content: newContent }).catch((err) => {
            console.error("Failed to update note content:", err);
          });
        }
      }, 300);
    },
    [roomId, socket]
  );

  const moveNotePosition = useCallback(
    (noteId: string, x: number, y: number) => {
      if (!roomId) return;

      // Optimistic local update
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, positionX: x, positionY: y } : n))
      );

      if (socket && socket.connected) {
        socket.emit("whiteboard:note:move", {
          roomId,
          noteId,
          positionX: x,
          positionY: y,
        });
      } else {
        moveStickyNote(roomId, noteId, { positionX: x, positionY: y }).catch((err) => {
          console.error("Failed to move note:", err);
        });
      }
    },
    [roomId, socket]
  );

  const changeColor = useCallback(
    (noteId: string, color: string) => {
      if (!roomId) return;

      // Optimistic local update
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, color } : n))
      );

      if (socket && socket.connected) {
        socket.emit("whiteboard:note:color", {
          roomId,
          noteId,
          color,
        });
      } else {
        updateStickyNoteColor(roomId, noteId, color).catch((err) => {
          console.error("Failed to change note color:", err);
        });
      }
    },
    [roomId, socket]
  );

  const removeNote = useCallback(
    (noteId: string) => {
      if (!roomId) return;

      // Optimistic local update
      setNotes((prev) => prev.filter((n) => n.id !== noteId));

      if (socket && socket.connected) {
        socket.emit("whiteboard:note:delete", {
          roomId,
          noteId,
        });
      } else {
        deleteStickyNote(roomId, noteId).catch((err) => {
          console.error("Failed to delete note:", err);
        });
      }
    },
    [roomId, socket]
  );

  return {
    notes,
    collaborators,
    isLoading,
    error,
    addNote,
    editContent,
    moveNotePosition,
    changeColor,
    removeNote,
  };
}

