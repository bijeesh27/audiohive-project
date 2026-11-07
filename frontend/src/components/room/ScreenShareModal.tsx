import React, { useState } from "react";
import {
  Monitor,
  AppWindow,
  Globe,
  Volume2,
  X,
  ScreenShare,
  Check,
  StopCircle,
} from "lucide-react";

interface ScreenShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartShare: (sourceType: "screen" | "window" | "tab", shareAudio: boolean) => void;
  isCurrentlySharing?: boolean;
  onStopShare?: () => void;
}

export const ScreenShareModal: React.FC<ScreenShareModalProps> = ({
  isOpen,
  onClose,
  onStartShare,
  isCurrentlySharing = false,
  onStopShare,
}) => {
  const [selectedSource, setSelectedSource] = useState<"screen" | "window" | "tab">("screen");
  const [shareAudio, setShareAudio] = useState(true);

  if (!isOpen) return null;

  const handleShare = () => {
    onStartShare(selectedSource, shareAudio);
    onClose();
  };

  const sources = [
    {
      id: "screen" as const,
      title: "Entire Screen",
      description: "Share everything on your primary or secondary display",
      icon: Monitor,
      preview: "Full desktop with all apps & notifications",
    },
    {
      id: "window" as const,
      title: "Application Window",
      description: "Share a specific application like Figma, VSCode, or IDE",
      icon: AppWindow,
      preview: "Targeted single application window only",
    },
    {
      id: "tab" as const,
      title: "Browser Tab",
      description: "Share a specific browser tab with high quality and tab audio",
      icon: Globe,
      preview: "Optimized for slides, videos, and web documents",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0B0F19]/95 border border-violet-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(139,92,246,0.15)] text-white overflow-hidden">
        {/* Background ambient decorative glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-5 border-b border-violet-500/15 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-600/30 to-purple-600/20 border border-violet-500/30 text-violet-300 shadow-inner">
              <ScreenShare className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Share Your Screen</h3>
              <p className="text-xs text-slate-400">Choose what you want to present to participants</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Share Status Alert if already sharing */}
        {isCurrentlySharing && (
          <div className="mt-5 p-4 rounded-2xl bg-violet-950/40 border border-violet-500/40 flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500" />
              </span>
              <div>
                <p className="text-xs font-semibold text-violet-200">Screen sharing is currently active</p>
                <p className="text-[11px] text-violet-300/70">Participants can see your selected presentation.</p>
              </div>
            </div>
            {onStopShare && (
              <button
                type="button"
                onClick={() => {
                  onStopShare();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <StopCircle className="w-4 h-4" />
                <span>Stop Sharing</span>
              </button>
            )}
          </div>
        )}

        {/* Source Option Cards */}
        <div className="mt-5 space-y-3 relative z-10">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Select Display Source
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sources.map((src) => {
              const Icon = src.icon;
              const isSelected = selectedSource === src.id;
              return (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => setSelectedSource(src.id)}
                  className={`group relative flex flex-col items-start p-4 rounded-2xl text-left border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-b from-violet-600/25 to-purple-900/30 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.3)] ring-1 ring-violet-400/50"
                      : "bg-slate-900/60 border-slate-800 hover:border-violet-500/30 hover:bg-slate-800/50"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  <div
                    className={`p-2.5 rounded-xl mb-3 border transition-colors ${
                      isSelected
                        ? "bg-violet-500/20 text-violet-300 border-violet-400/30"
                        : "bg-slate-800/80 text-slate-400 border-slate-700/60 group-hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <span className="text-sm font-semibold text-white tracking-tight">
                    {src.title}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">
                    {src.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* System Audio Option */}
        <div className="mt-5 pt-4 border-t border-violet-500/15 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Share system audio</p>
              <p className="text-[11px] text-slate-400">Include sound from video clips, music, or apps</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={shareAudio}
              onChange={(e) => setShareAudio(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600 border border-slate-700 peer-checked:border-violet-500 shadow-inner" />
          </label>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-violet-500/15 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:from-violet-700 active:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-violet-600/35 transition-all cursor-pointer hover:shadow-violet-600/50"
          >
            <ScreenShare className="w-4 h-4" />
            <span>Share {sources.find((s) => s.id === selectedSource)?.title}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

