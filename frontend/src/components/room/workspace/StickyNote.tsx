import React, { useState, useRef, useEffect } from "react";
import { Trash2, Palette, Check, Loader2 } from "lucide-react";
import type { StickyNote as StickyNoteType } from "../../../services/whiteboardServices";
import { formatRelativeTime, formatAbsoluteTime } from "../../common/formatters";
import { NOTE_PALETTE } from "./WhiteboardToolbar";

interface StickyNoteProps {
  note: StickyNoteType;
  isSelected: boolean;
  canDelete: boolean;
  editingBy?: string | null;
  zoom?: number;
  onSelect: () => void;
  onContentChange: (id: string, content: string) => void;
  onMoveThrottled: (id: string, x: number, y: number) => void;
  onMoveEnd: (id: string, x: number, y: number) => void;
  onColorChange: (id: string, color: string) => void;
  onDeleteWithUndo: (id: string) => void;
  onEditingStatus: (id: string, isEditing: boolean) => void;
}

export const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  isSelected,
  canDelete,
  editingBy,
  zoom = 1,
  onSelect,
  onContentChange,
  onMoveThrottled,
  onMoveEnd,
  onColorChange,
  onDeleteWithUndo,
  onEditingStatus,
}) => {
  const [pos, setPos] = useState({ x: note.positionX, y: note.positionY });
  const [content, setContent] = useState(note.content);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [width, setWidth] = useState(240);
  const [height, setHeight] = useState(180);
  const [isDragging, setIsDragging] = useState(false);

  const debounceTimerRef = useRef<any>(null);
  const throttleTimerRef = useRef<number>(0);

  // Sync external position changes when not locally dragging
  useEffect(() => {
    if (!isDragging) {
      setPos({ x: note.positionX, y: note.positionY });
    }
  }, [note.positionX, note.positionY, isDragging]);

  useEffect(() => {
    setContent(note.content);
  }, [note.content]);

  // Handle Text change with 500ms debounce auto-save
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setSaveStatus("saving");
    onEditingStatus(note.id, true);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onContentChange(note.id, val);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
      onEditingStatus(note.id, false);
    }, 500);
  };

  const handleBlur = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onContentChange(note.id, content);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1200);
    onEditingStatus(note.id, false);
  };

  // Dragging by header (instant local coordinate response + throttled sync)
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    setIsDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = pos.x;
    const origY = pos.y;
    let latestX = origX;
    let latestY = origY;

    const onMouseMove = (moveEvt: MouseEvent) => {
      const scale = zoom > 0 ? zoom : 1;
      const dx = (moveEvt.clientX - startX) / scale;
      const dy = (moveEvt.clientY - startY) / scale;
      latestX = Math.max(10, Math.round(origX + dx));
      latestY = Math.max(10, Math.round(origY + dy));

      setPos({ x: latestX, y: latestY });

      const now = Date.now();
      if (now - throttleTimerRef.current > 40) {
        throttleTimerRef.current = now;
        onMoveThrottled(note.id, latestX, latestY);
      }
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      onMoveEnd(note.id, latestX, latestY);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    onSelect();
    const touch = e.touches[0];
    if (!touch) return;
    setIsDragging(true);

    const startX = touch.clientX;
    const startY = touch.clientY;
    const origX = pos.x;
    const origY = pos.y;
    let latestX = origX;
    let latestY = origY;

    const onTouchMove = (moveEvt: TouchEvent) => {
      const curTouch = moveEvt.touches[0];
      if (!curTouch) return;
      const scale = zoom > 0 ? zoom : 1;
      const dx = (curTouch.clientX - startX) / scale;
      const dy = (curTouch.clientY - startY) / scale;
      latestX = Math.max(10, Math.round(origX + dx));
      latestY = Math.max(10, Math.round(origY + dy));

      setPos({ x: latestX, y: latestY });

      const now = Date.now();
      if (now - throttleTimerRef.current > 40) {
        throttleTimerRef.current = now;
        onMoveThrottled(note.id, latestX, latestY);
      }
    };

    const onTouchEnd = () => {
      setIsDragging(false);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      onMoveEnd(note.id, latestX, latestY);
    };

    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);
  };

  // Resize handle
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const initW = width;
    const initH = height;
    const scale = zoom > 0 ? zoom : 1;

    const onMouseMove = (moveEvt: MouseEvent) => {
      setWidth(Math.max(180, Math.round(initW + (moveEvt.clientX - startX) / scale)));
      setHeight(Math.max(140, Math.round(initH + (moveEvt.clientY - startY) / scale)));
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const authorName = note.createdBy?.username || "Teammate";
  const authorInitial = authorName.substring(0, 2).toUpperCase();

  return (
    <div
      tabIndex={0}
      role="article"
      aria-label={`Sticky note by ${authorName}: ${content.substring(0, 30)}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        width: `${width}px`,
        minHeight: `${height}px`,
        backgroundColor: note.color || "#fef08a",
      }}
      className={`absolute rounded-xl shadow-lg border border-black/10 flex flex-col focus:outline-none ${
        isSelected ? "ring-2 ring-indigo-600 shadow-2xl z-20" : "hover:shadow-xl z-10"
      } ${isDragging ? "opacity-95 cursor-grabbing shadow-2xl z-30" : ""}`}
    >
      {/* Note Header / Drag Handle */}
      <div
        onMouseDown={handleHeaderMouseDown}
        onTouchStart={handleHeaderTouchStart}
        className="flex items-center justify-between px-3 pt-2.5 pb-1 cursor-grab select-none border-b border-black/5"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-full bg-black/10 text-gray-800 text-[10px] font-bold flex items-center justify-center shrink-0">
            {authorInitial}
          </div>
          <span className="text-[11px] font-semibold text-gray-800 truncate max-w-[90px]">{authorName}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Status badge */}
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-[10px] text-gray-600 font-sans">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              <span>Saving...</span>
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-0.5 text-[10px] text-emerald-700 font-sans">
              <Check className="w-2.5 h-2.5" />
              <span>Saved</span>
            </span>
          )}

          {/* Color palette toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
              title="Change note color"
              className="p-1 rounded hover:bg-black/10 text-gray-700 transition-colors cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
            {showColorPicker && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-6 z-40 p-1.5 bg-slate-900 border border-slate-700 rounded-lg shadow-xl flex items-center gap-1.5"
              >
                {NOTE_PALETTE.map((p) => (
                  <button
                    key={p.hex}
                    type="button"
                    onClick={() => {
                      onColorChange(note.id, p.hex);
                      setShowColorPicker(false);
                    }}
                    style={{ backgroundColor: p.hex }}
                    className="w-4 h-4 rounded-full border border-black/20 hover:scale-125 transition-transform cursor-pointer"
                    title={p.label}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Delete note */}
          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteWithUndo(note.id);
              }}
              title="Delete note"
              className="p-1 rounded hover:bg-rose-500/20 text-gray-700 hover:text-rose-700 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Editing conflict alert */}
      {editingBy && (
        <div className="px-3 py-0.5 bg-indigo-600/15 text-[10px] text-indigo-950 font-medium truncate">
          {editingBy} is editing...
        </div>
      )}

      {/* Note Body Input */}
      <div className="flex-1 p-2.5">
        <textarea
          value={content}
          onChange={handleTextChange}
          onBlur={handleBlur}
          placeholder="Write your note..."
          className="w-full h-full min-h-[90px] bg-transparent resize-none border-0 text-gray-900 placeholder-gray-500/60 text-xs sm:text-sm font-sans focus:outline-none leading-relaxed cursor-text"
        />
      </div>

      {/* Note Footer: readable timestamp */}
      <div className="px-3 py-1.5 border-t border-black/5 flex items-center justify-between text-[10px] text-gray-600/80 font-sans select-none">
        <span title={formatAbsoluteTime(note.createdAt)}>
          {formatRelativeTime(note.createdAt)}
        </span>
        <div
          onMouseDown={handleResizeMouseDown}
          className="w-3 h-3 cursor-nwse-resize opacity-40 hover:opacity-100 flex items-center justify-center"
          title="Drag to resize"
        >
          ↘
        </div>
      </div>
    </div>
  );
};
export default StickyNote;

