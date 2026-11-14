import React, { useState, useRef, useCallback } from "react";
import { useWhiteboard } from "../../hooks/useWhiteboard";
import { StickyNote } from "./StickyNote";
import { WhiteboardToolbar } from "./WhiteboardToolbar";
import { StickyNote as StickyNoteIcon, Plus, Loader2 } from "lucide-react";

interface WhiteboardProps {
  roomId: string;
  workspaceId?: string;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({ roomId }) => {
  const {
    notes,
    collaborators,
    isLoading,
    error,
    addNote,
    editContent,
    moveNotePosition,
    changeColor,
    removeNote,
  } = useWhiteboard(roomId);

  const [zoom, setZoom] = useState<number>(1);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(2, Math.round((z + 0.1) * 10) / 10));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10));
  const handleResetZoom = () => setZoom(1);

  const handleAddNoteAtCenter = useCallback(
    (color?: string) => {
      // Offset slightly near center of visible area
      const centerX = Math.round(150 + Math.random() * 100);
      const centerY = Math.round(120 + Math.random() * 80);
      addNote({
        content: "",
        color,
        positionX: centerX,
        positionY: centerY,
      });
    },
    [addNote]
  );

  return (
    <div className="relative w-full h-full flex flex-col bg-[#070b14] overflow-hidden select-none">
      {/* Top Toolbar */}
      <WhiteboardToolbar
        collaborators={collaborators}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onAddNote={handleAddNoteAtCenter}
        noteCount={notes.length}
      />

      {/* Main Canvas Area */}
      <div
        ref={boardRef}
        className="relative flex-1 w-full h-full overflow-auto cursor-default"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255, 255, 255, 0.08) 1.2px, transparent 1.2px)",
          backgroundSize: `${Math.round(26 * zoom)}px ${Math.round(26 * zoom)}px`,
          backgroundColor: "#070b14",
        }}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#070b14]/70 backdrop-blur-sm text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500 mb-2" />
            <span className="text-sm font-medium">Loading whiteboard...</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-medium">
            {error}
          </div>
        )}

        {/* Inner Zoom Container */}
        <div
          className="relative min-w-[2800px] min-h-[2200px] origin-top-left transition-transform duration-75"
          style={{
            transform: `scale(${zoom})`,
          }}
        >
          {/* Notes */}
          {notes.map((note) => (
            <StickyNote
              key={note.id}
              note={note}
              onContentChange={editContent}
              onMove={moveNotePosition}
              onColorChange={changeColor}
              onDelete={removeNote}
            />
          ))}

          {/* Empty State Banner (if no notes) */}
          {!isLoading && notes.length === 0 && (
            <div className="absolute top-36 left-48 pointer-events-auto flex flex-col items-center text-center p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md max-w-sm">
              <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-3">
                <StickyNoteIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                Collaborative Whiteboard
              </h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Brainstorm, plan, and collaborate in real-time with your team. Every sticky note is synced instantly across participants.
              </p>
              <button
                type="button"
                onClick={() => handleAddNoteAtCenter()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition-all duration-150"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Sticky Note</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Whiteboard;

