import React, { useState, useRef, useEffect } from "react";
import type { LiveTranscriptTurn } from "../../types/liveTranscript";
import {
  X,
  Search,
  Copy,
  Check,
  Download,
  FileText,
  Sparkles,
} from "lucide-react";

interface LiveTranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  turns: LiveTranscriptTurn[];
  onCopy: () => Promise<boolean>;
  onDownload: () => void;
}

export const LiveTranscriptDrawer: React.FC<LiveTranscriptDrawerProps> = ({
  isOpen,
  onClose,
  turns,
  onCopy,
  onDownload,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabled = useRef(true);

  // Auto-scroll to bottom on new turns
  useEffect(() => {
    if (isAutoScrollEnabled.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // If within 80px from bottom, keep auto-scroll enabled
    isAutoScrollEnabled.current = scrollHeight - scrollTop - clientHeight < 80;
  };

  const handleCopy = async () => {
    const success = await onCopy();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredTurns = turns.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.text.toLowerCase().includes(q) ||
      t.speakerName.toLowerCase().includes(q)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <span>Live Transcript</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {turns.length}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Groq Whisper AI</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Close Drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-white/5 bg-slate-950/40">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcript..."
            className="w-full bg-slate-800/80 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Turns List */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {filteredTurns.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
            <FileText className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs font-medium text-slate-400">
              {searchQuery ? "No matches found" : "No speech transcribed yet"}
            </p>
            <p className="text-[11px] text-slate-500 max-w-[200px] mt-1">
              Speak into your microphone while live captions are enabled.
            </p>
          </div>
        ) : (
          filteredTurns.map((turn) => {
            const timeStr = new Date(turn.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            const initials = turn.speakerName
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={turn.id}
                className="group flex items-start space-x-3 text-xs"
              >
                {/* Initials Avatar */}
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm mt-0.5">
                  {initials}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-200 truncate">
                      {turn.speakerName}
                    </span>
                    <span className="text-[10px] text-slate-500">{timeStr}</span>
                  </div>
                  <p className="text-slate-300 mt-1 leading-relaxed break-words">
                    {turn.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-white/10 bg-slate-950/60 flex items-center space-x-2">
        <button
          onClick={handleCopy}
          disabled={turns.length === 0}
          className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>

        <button
          onClick={onDownload}
          disabled={turns.length === 0}
          className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:hover:bg-violet-600 text-xs font-medium text-white transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download</span>
        </button>
      </div>
    </div>
  );
};
