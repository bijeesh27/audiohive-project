import React from "react";
import type { ActiveCaption } from "../../types/liveTranscript";
import { AlertCircle } from "lucide-react";

interface LiveCaptionsOverlayProps {
  activeCaptions: ActiveCaption[];
  isCaptionsEnabled: boolean;
  transcriptError?: string | null;
}

export const LiveCaptionsOverlay: React.FC<LiveCaptionsOverlayProps> = ({
  activeCaptions,
  isCaptionsEnabled,
  transcriptError,
}) => {
  if (!isCaptionsEnabled) return null;

  return (
    <div className="absolute bottom-24 left-0 right-0 z-30 pointer-events-none flex flex-col items-center justify-end px-4 space-y-2">
      {/* Configuration notice if GROQ_API_KEY is missing on backend */}
      {transcriptError && (
        <div className="pointer-events-auto flex items-center space-x-2 px-4 py-2 bg-amber-950/80 border border-amber-500/30 text-amber-200 text-xs rounded-full shadow-lg backdrop-blur-md animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{transcriptError}</span>
        </div>
      )}

      {/* Real-time speech subtitle cards */}
      {activeCaptions.map((caption) => (
        <div
          key={caption.id}
          className="pointer-events-auto max-w-2xl w-full bg-slate-950/85 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 shadow-2xl shadow-black/70 flex items-start space-x-3 transition-all duration-300 animate-slide-up"
        >
          {/* Speaker chip */}
          <span className="shrink-0 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-600/30 text-violet-300 border border-violet-500/30 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{caption.speakerName}</span>
          </span>

          {/* Subtitle text */}
          <p className="text-sm md:text-base font-medium text-slate-100 leading-relaxed tracking-wide select-text">
            {caption.text}
          </p>
        </div>
      ))}
    </div>
  );
};
