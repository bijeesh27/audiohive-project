import React, { useState, useRef, useEffect } from "react";
import { StickyNote as StickyNoteIcon, Plus, Undo2, ArrowUpRight } from "lucide-react";
import { useSocket } from "../../../context/SocketContext";
import { useAuth } from "../../../context/AuthContext";
import {
  getWhiteboardNotes,
  createStickyNote,
  updateStickyNote,
  updateStickyNoteColor,
  deleteStickyNote,
  type StickyNote as StickyNoteType,
} from "../../../services/whiteboardServices";
import { WhiteboardToolbar } from "./WhiteboardToolbar";
import { StickyNote } from "./StickyNote";

interface WhiteboardCanvasProps {
  roomId: string;
  onlinePresenceUsers: { userId: string; username: string }[];
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  roomId,
  onlinePresenceUsers,
}) => {
  const { socket } = useSocket();
  const { userId, userRole, username } = useAuth();
  const [notes, setNotes] = useState<StickyNoteType[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [newNoteColor, setNewNoteColor] = useState("#fef08a");
  const [editingUsers, setEditingUsers] = useState<Record<string, string>>({});
  const [deletedNoteUndo, setDeletedNoteUndo] = useState<StickyNoteType | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ x: 0, y: 0 });
  const undoTimeoutRef = useRef<any>(null);

  // 1. Load notes via REST
  useEffect(() => {
    let active = true;
    getWhiteboardNotes(roomId).then((data) => {
      if (active && Array.isArray(data)) setNotes(data);
    }).catch(() => {});
    return () => { active = false; };
  }, [roomId]);

  // 2. Real-time socket sync
  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit("whiteboard:join", roomId);

    const onInitialState = (data: StickyNoteType[]) => {
      if (Array.isArray(data)) setNotes(data);
    };
    const onCreated = (note: StickyNoteType) => {
      setNotes((prev) => (prev.some((n) => n.id === note.id) ? prev : [...prev, note]));
    };
    const onUpdated = (note: StickyNoteType) => {
      setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)));
    };
    const onMoved = (data: { noteId: string; positionX: number; positionY: number }) => {
      setNotes((prev) =>
        prev.map((n) => (n.id === data.noteId ? { ...n, positionX: data.positionX, positionY: data.positionY } : n))
      );
    };
    const onColorUpdated = (data: { noteId: string; color: string }) => {
      setNotes((prev) => prev.map((n) => (n.id === data.noteId ? { ...n, color: data.color } : n)));
    };
    const onDeleted = (data: { noteId: string }) => {
      setNotes((prev) => prev.filter((n) => n.id !== data.noteId));
    };
    const onEditing = (data: { noteId: string; isEditing: boolean; username: string }) => {
      setEditingUsers((prev) => {
        const next = { ...prev };
        if (data.isEditing) next[data.noteId] = data.username;
        else delete next[data.noteId];
        return next;
      });
    };

    socket.on("whiteboard:initial-state", onInitialState);
    socket.on("whiteboard:note:created", onCreated);
    socket.on("whiteboard:note:updated", onUpdated);
    socket.on("whiteboard:note:moved", onMoved);
    socket.on("whiteboard:note:color-updated", onColorUpdated);
    socket.on("whiteboard:note:deleted", onDeleted);
    socket.on("whiteboard:note:editing", onEditing);

    return () => {
      socket.emit("whiteboard:leave", roomId);
      socket.off("whiteboard:initial-state", onInitialState);
      socket.off("whiteboard:note:created", onCreated);
      socket.off("whiteboard:note:updated", onUpdated);
      socket.off("whiteboard:note:moved", onMoved);
      socket.off("whiteboard:note:color-updated", onColorUpdated);
      socket.off("whiteboard:note:deleted", onDeleted);
      socket.off("whiteboard:note:editing", onEditing);
    };
  }, [socket, roomId]);

  // Keyboard navigation & Shortcuts (Delete, Esc)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape") {
        setSelectedNoteId(null);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNoteId) {
          handleDeleteNote(selectedNoteId);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedNoteId, notes]);

  // Pan canvas with mouse drag on empty space
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setSelectedNoteId(null);
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };

    const onMouseMove = (moveEvt: MouseEvent) => {
      setPan({ x: moveEvt.clientX - panStartRef.current.x, y: moveEvt.clientY - panStartRef.current.y });
    };
    const onMouseUp = () => {
      setIsPanning(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Zoom with wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom((z) => Math.min(2, Math.max(0.4, Math.round((z + delta) * 100) / 100)));
  };

  // Fit to content
  const handleFitToContent = () => {
    if (notes.length === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const minX = Math.min(...notes.map((n) => n.positionX));
    const minY = Math.min(...notes.map((n) => n.positionY));
    setPan({ x: -minX + 80, y: -minY + 60 });
    setZoom(1);
  };

  // Add note
  const handleAddNote = async () => {
    const posX = Math.round(-pan.x + 120 + Math.random() * 80);
    const posY = Math.round(-pan.y + 100 + Math.random() * 60);
    try {
      if (socket && socket.connected) {
        socket.emit("whiteboard:note:create", {
          roomId,
          content: "",
          color: newNoteColor,
          positionX: posX,
          positionY: posY,
        });
      } else {
        const created = await createStickyNote(roomId, {
          content: "",
          color: newNoteColor,
          positionX: posX,
          positionY: posY,
        });
        setNotes((prev) => [...prev, created]);
      }
    } catch {
      // Ignored
    }
  };

  // Content change
  const handleContentChange = (id: string, content: string) => {
    if (socket && socket.connected) {
      socket.emit("whiteboard:note:update", { roomId, noteId: id, content });
    } else {
      updateStickyNote(roomId, id, { content }).catch(() => {});
    }
  };

  // Move throttled: notify peers without re-rendering the whole canvas during drag
  const handleMoveThrottled = (id: string, x: number, y: number) => {
    if (socket && socket.connected) {
      socket.emit("whiteboard:note:move", { roomId, noteId: id, positionX: x, positionY: y });
    }
  };

  // Move drop: update canonical state and persist final position
  const handleMoveEnd = (id: string, x: number, y: number) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, positionX: x, positionY: y } : n)));
    if (socket && socket.connected) {
      socket.emit("whiteboard:note:move", { roomId, noteId: id, positionX: x, positionY: y });
    }
  };

  // Color change
  const handleColorChange = (id: string, color: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, color } : n)));
    if (socket && socket.connected) {
      socket.emit("whiteboard:note:color", { roomId, noteId: id, color });
    } else {
      updateStickyNoteColor(roomId, id, color).catch(() => {});
    }
  };

  // Delete with Undo toast
  const handleDeleteNote = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setDeletedNoteUndo(target);

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(async () => {
      try {
        if (socket && socket.connected) {
          socket.emit("whiteboard:note:delete", { roomId, noteId: id });
        } else {
          await deleteStickyNote(roomId, id);
        }
      } catch {
        // Ignored
      }
      setDeletedNoteUndo(null);
    }, 4500);
  };

  const handleUndoDelete = () => {
    if (!deletedNoteUndo) return;
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setNotes((prev) => [...prev, deletedNoteUndo]);
    setDeletedNoteUndo(null);
  };

  const handleEditingStatus = (id: string, isEditing: boolean) => {
    if (socket && socket.connected) {
      socket.emit("whiteboard:note:editing", {
        roomId,
        noteId: id,
        isEditing,
        username: username || "You",
      });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-210px)] min-h-[500px] flex flex-col bg-[#070B14] rounded-2xl border border-slate-800 overflow-hidden select-none">
      <WhiteboardToolbar
        noteCount={notes.length}
        zoom={zoom}
        selectedColor={newNoteColor}
        onColorSelect={setNewNoteColor}
        onAddNote={handleAddNote}
        onZoomIn={() => setZoom((z) => Math.min(2, Math.round((z + 0.1) * 10) / 10))}
        onZoomOut={() => setZoom((z) => Math.max(0.4, Math.round((z - 0.1) * 10) / 10))}
        onResetZoom={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
        onFitToContent={handleFitToContent}
        collaborators={onlinePresenceUsers}
      />

      {/* Main Pan/Zoom Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleCanvasMouseDown}
        onWheel={handleWheel}
        className={`relative flex-1 w-full h-full overflow-hidden ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255, 255, 255, 0.08) 1.2px, transparent 1.2px)",
          backgroundSize: `${Math.round(24 * zoom)}px ${Math.round(24 * zoom)}px`,
          backgroundColor: "#070B14",
        }}
      >
        <div
          className="absolute origin-top-left"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          }}
        >
          {notes.map((note) => {
            const canDelete =
              userRole === "workspaceAdmin" ||
              userRole === "admin" ||
              note.createdBy?.userId === userId ||
              note.createdBy?.username === username;

            return (
              <StickyNote
                key={note.id}
                note={note}
                isSelected={selectedNoteId === note.id}
                canDelete={Boolean(canDelete)}
                editingBy={editingUsers[note.id]}
                zoom={zoom}
                onSelect={() => setSelectedNoteId(note.id)}
                onContentChange={handleContentChange}
                onMoveThrottled={handleMoveThrottled}
                onMoveEnd={handleMoveEnd}
                onColorChange={handleColorChange}
                onDeleteWithUndo={handleDeleteNote}
                onEditingStatus={handleEditingStatus}
              />
            );
          })}
        </div>

        {/* Empty state prompt with arrow to button */}
        {notes.length === 0 && (
          <div className="absolute top-16 left-8 sm:left-14 pointer-events-auto flex items-start gap-3 bg-[#0D1222]/90 border border-slate-700/80 p-5 rounded-2xl shadow-2xl backdrop-blur-md max-w-sm text-white">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <StickyNoteIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                <span>Add your first note</span>
                <ArrowUpRight className="w-4 h-4 text-indigo-400 animate-bounce" />
              </div>
              <p className="text-xs text-slate-400 mt-1 mb-3 leading-relaxed">
                Click "Add note" on the top-left toolbar to start brainstorming in real-time with your team.
              </p>
              <button
                type="button"
                onClick={handleAddNote}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create note</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Undo Toast for Deleted Note */}
      {deletedNoteUndo && (
        <div className="absolute bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white shadow-2xl animate-in slide-in-from-bottom duration-150">
          <span className="text-xs text-slate-300">Note deleted</span>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            <Undo2 className="w-3 h-3" />
            <span>Undo</span>
          </button>
        </div>
      )}
    </div>
  );
};
export default WhiteboardCanvas;

