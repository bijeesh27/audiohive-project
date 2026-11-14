import React, { useState, useRef, useEffect, useCallback } from "react";
import { Trash2, GripHorizontal, Palette, User, Clock } from "lucide-react";
import type { StickyNote as StickyNoteType } from "../../services/whiteboardServices";

interface StickyNoteProps {
  note: StickyNoteType;
  onContentChange: (id: string, content: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onColorChange: (id: string, color: string) => void;
  onDelete: (id: string) => void;
}

const PALETTE = [
  { name: "Yellow", hex: "#fef08a", border: "#fde047" },
  { name: "Orange", hex: "#fed7aa", border: "#fdba74" },
  { name: "Emerald", hex: "#bbf7d0", border: "#86efac" },
  { name: "Sky", hex: "#bae6fd", border: "#7dd3fc" },
  { name: "Purple", hex: "#e9d5ff", border: "#d8b4fe" },
  { name: "Rose", hex: "#fbcfe8", border: "#f472b6" },
];

function formatTime(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  onContentChange,
  onMove,
  onColorChange,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: note.positionX, y: note.positionY });
  const [content, setContent] = useState(note.content);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const dragStartRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null
  );
  const posRef = useRef(pos);
  posRef.current = pos;

  // Sync external position updates from other users if not currently dragging
  useEffect(() => {
    if (!isDragging) {
      setPos({ x: note.positionX, y: note.positionY });
    }
  }, [note.positionX, note.positionY, isDragging]);

  // Sync external content updates from other users
  useEffect(() => {
    setContent(note.content);
  }, [note.content]);

  // Handle Dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only drag from handle
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: posRef.current.x,
        origY: posRef.current.y,
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragStartRef.current) return;
        const dx = moveEvent.clientX - dragStartRef.current.startX;
        const dy = moveEvent.clientY - dragStartRef.current.startY;
        const newX = Math.max(10, Math.round(dragStartRef.current.origX + dx));
        const newY = Math.max(10, Math.round(dragStartRef.current.origY + dy));
        setPos({ x: newX, y: newY });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        if (dragStartRef.current) {
          onMove(note.id, posRef.current.x, posRef.current.y);
          dragStartRef.current = null;
        }
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [note.id, onMove]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      setIsDragging(true);
      dragStartRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        origX: posRef.current.x,
        origY: posRef.current.y,
      };

      const handleTouchMove = (moveEvent: TouchEvent) => {
        if (!dragStartRef.current) return;
        const currentTouch = moveEvent.touches[0];
        const dx = currentTouch.clientX - dragStartRef.current.startX;
        const dy = currentTouch.clientY - dragStartRef.current.startY;
        const newX = Math.max(10, Math.round(dragStartRef.current.origX + dx));
        const newY = Math.max(10, Math.round(dragStartRef.current.origY + dy));
        setPos({ x: newX, y: newY });
      };

      const handleTouchEnd = () => {
        setIsDragging(false);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
        if (dragStartRef.current) {
          onMove(note.id, posRef.current.x, posRef.current.y);
          dragStartRef.current = null;
        }
      };

      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleTouchEnd);
    },
    [note.id, onMove]
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    onContentChange(note.id, val);
  };

  return (
    <div
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        backgroundColor: note.color || "#fef08a",
        zIndex: isDragging ? 50 : 10,
      }}
      className={`absolute w-64 min-h-[220px] rounded-xl shadow-xl flex flex-col border border-black/10 transition-shadow duration-150 select-none ${
        isDragging ? "shadow-2xl ring-2 ring-violet-500/50 cursor-grabbing scale-[1.02]" : "hover:shadow-2xl"
      }`}
    >
      {/* Top Header / Drag Handle */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="px-3 pt-2.5 pb-1 flex items-center justify-between cursor-grab border-b border-black/5"
      >
        <div className="flex items-center gap-1.5 text-slate-700/70 hover:text-slate-900 transition-colors">
          <GripHorizontal className="w-4 h-4" />
          <span className="text-[11px] font-medium tracking-tight truncate max-w-[100px]">
            {note.createdBy?.username || "Anonymous"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Color Picker Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
              title="Change color"
              className="p-1 rounded-md text-slate-700/70 hover:text-slate-900 hover:bg-black/5 transition-colors"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {/* Color Palette Popover */}
            {showColorPicker && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-7 z-50 p-1.5 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-lg shadow-xl flex items-center gap-1.5"
              >
                {PALETTE.map((p) => (
                  <button
                    key={p.hex}
                    type="button"
                    onClick={() => {
                      onColorChange(note.id, p.hex);
                      setShowColorPicker(false);
                    }}
                    style={{ backgroundColor: p.hex }}
                    className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 ${
                      note.color === p.hex ? "ring-2 ring-violet-400 scale-105" : "border-black/20"
                    }`}
                    title={p.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Delete Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            title="Delete note"
            className="p-1 rounded-md text-slate-700/70 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Note Body Textarea */}
      <div className="flex-1 p-3">
        <textarea
          value={content}
          onChange={handleTextChange}
          placeholder="Type your ideas, thoughts, or tasks here..."
          className="w-full h-full min-h-[120px] bg-transparent resize-none border-0 text-slate-800 placeholder-slate-500/60 text-sm font-normal focus:outline-none focus:ring-0 leading-relaxed cursor-text"
        />
      </div>

      {/* Note Footer Info */}
      <div className="px-3 py-1.5 border-t border-black/5 flex items-center justify-between text-[10px] text-slate-600/80 font-mono">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 opacity-60" />
          <span>{formatTime(note.updatedAt || note.createdAt)}</span>
        </div>
        {note.updatedBy && note.updatedBy.username !== note.createdBy?.username && (
          <div className="flex items-center gap-1 truncate max-w-[100px]" title={`Edited by ${note.updatedBy.username}`}>
            <User className="w-2.5 h-2.5 opacity-60" />
            <span className="truncate">{note.updatedBy.username}</span>
          </div>
        )}
      </div>
    </div>
  );
};

