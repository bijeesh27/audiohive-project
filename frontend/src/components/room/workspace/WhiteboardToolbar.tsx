import React from "react";
import { Plus, ZoomIn, ZoomOut, RotateCcw, Maximize, StickyNote as NoteIcon } from "lucide-react";

export const NOTE_PALETTE = [
  { hex: "#fef08a", label: "Yellow" },
  { hex: "#fed7aa", label: "Orange" },
  { hex: "#bbf7d0", label: "Emerald" },
  { hex: "#bae6fd", label: "Sky" },
  { hex: "#e9d5ff", label: "Purple" },
  { hex: "#fbcfe8", label: "Pink" },
];

interface WhiteboardToolbarProps {
  noteCount: number;
  zoom: number;
  selectedColor: string;
  onColorSelect: (color: string) => void;
  onAddNote: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToContent: () => void;
  collaborators: { userId: string; username: string }[];
}

export const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({
  noteCount,
  zoom,
  selectedColor,
  onColorSelect,
  onAddNote,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToContent,
  collaborators,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0D1222] border-b border-slate-800 text-white select-none z-30">
      {/* Left: Add Note & New Note Color Swatches */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onAddNote}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add note</span>
        </button>

        {/* Color Palette for NEW notes only */}
        <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Color:</span>
          {NOTE_PALETTE.map((p) => {
            const isSelected = selectedColor === p.hex;
            return (
              <button
                key={p.hex}
                type="button"
                onClick={() => onColorSelect(p.hex)}
                style={{ backgroundColor: p.hex }}
                title={`Color for new notes: ${p.label}`}
                aria-label={`Color for new notes: ${p.label}`}
                className={`w-5 h-5 rounded-md transition-transform cursor-pointer ${
                  isSelected ? "ring-2 ring-indigo-400 scale-110 shadow-md" : "opacity-80 hover:opacity-100 hover:scale-105"
                }`}
              />
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
          <NoteIcon className="w-3 h-3 text-indigo-400" />
          <span>{noteCount} {noteCount === 1 ? "note" : "notes"}</span>
        </div>
      </div>

      {/* Right: Presence Avatar Stack & Canvas Controls */}
      <div className="flex items-center gap-3">
        {/* Presence using the SAME presence source */}
        <div className="flex items-center gap-2">
          <div className="flex items-center -space-x-1.5 overflow-hidden">
            {collaborators.slice(0, 4).map((c, i) => (
              <div
                key={c.userId || i}
                title={c.username}
                className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-[#0D1222]"
              >
                {c.username.substring(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
          <span className="text-xs text-slate-400 font-medium">
            <span className="text-emerald-400 font-semibold">{collaborators.length}</span> online
          </span>
        </div>

        {/* Zoom & Fit controls */}
        <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-slate-300">
          <button
            type="button"
            onClick={onZoomOut}
            title="Zoom out"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 text-[11px] font-mono text-slate-300 min-w-[36px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={onZoomIn}
            title="Zoom in"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onFitToContent}
            title="Fit to content"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border-l border-slate-800 ml-0.5"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onResetZoom}
            title="Reset (100%)"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default WhiteboardToolbar;

