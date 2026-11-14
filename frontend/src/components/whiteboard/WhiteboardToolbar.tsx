import React from "react";
import { Plus, ZoomIn, ZoomOut, RotateCcw, Sparkles } from "lucide-react";
import type { WhiteboardCollaborator } from "../../services/whiteboardServices";

interface WhiteboardToolbarProps {
  collaborators: WhiteboardCollaborator[];
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onAddNote: (color?: string) => void;
  noteCount: number;
}

const PRESET_COLORS = [
  { hex: "#fef08a", label: "Yellow" },
  { hex: "#fed7aa", label: "Orange" },
  { hex: "#bbf7d0", label: "Emerald" },
  { hex: "#bae6fd", label: "Sky" },
  { hex: "#e9d5ff", label: "Purple" },
  { hex: "#fbcfe8", label: "Pink" },
];

export const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({
  collaborators,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onAddNote,
  noteCount,
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-[#0d1322]/80 backdrop-blur-xl border-b border-white/[0.08] shadow-md z-30 select-none">
      {/* Left: Add Note & Preset Color Picker */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onAddNote()}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition-all duration-150"
        >
          <Plus className="w-4 h-4" />
          <span>Add Note</span>
        </button>

        {/* Quick Color Presets */}
        <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-white/10">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => onAddNote(c.hex)}
              title={`Add ${c.label} Note`}
              style={{ backgroundColor: c.hex }}
              className="w-5 h-5 rounded-md border border-black/20 hover:scale-110 active:scale-90 transition-transform shadow-sm"
            />
          ))}
        </div>

        <div className="hidden md:flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] text-slate-400">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>{noteCount} {noteCount === 1 ? "note" : "notes"}</span>
        </div>
      </div>

      {/* Center/Right: Collaborators & Zoom */}
      <div className="flex items-center gap-4">
        {/* Active Collaborators Presence */}
        <div className="flex items-center gap-2">
          <div className="flex items-center -space-x-2 overflow-hidden py-1">
            {collaborators.slice(0, 5).map((collab, idx) => (
              <div
                key={collab.userId || idx}
                title={collab.username}
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 text-white font-semibold text-[11px] ring-2 ring-[#0d1322] shadow-sm uppercase"
              >
                {collab.username ? collab.username.substring(0, 2) : "U"}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline font-medium text-slate-300">
              {collaborators.length} {collaborators.length === 1 ? "online" : "online"}
            </span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-white/[0.05] border border-white/[0.08] rounded-lg p-0.5 text-slate-300">
          <button
            type="button"
            onClick={onZoomOut}
            title="Zoom Out"
            className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1 text-[11px] font-mono text-slate-400 min-w-[38px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={onZoomIn}
            title="Zoom In"
            className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onResetZoom}
            title="Reset Zoom (100%)"
            className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors border-l border-white/10 ml-0.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
