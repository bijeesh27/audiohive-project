import React, { useState } from "react";
import {
  X,
  Sliders,
  Mic,
  Video,
  Volume2,
  Sparkles,
  Keyboard,
  Check,
} from "lucide-react";

interface MeetingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MeetingSettingsModal: React.FC<MeetingSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"audio" | "video" | "shortcuts">("audio");
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [mirrorVideo, setMirrorVideo] = useState(true);
  const [hdVideo, setHdVideo] = useState(true);
  const [virtualBg, setVirtualBg] = useState<"none" | "blur" | "violet">("none");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0B0F19]/95 border border-violet-500/30 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(139,92,246,0.15)] text-white overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-violet-500/15 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-600/30 to-purple-600/20 border border-violet-500/30 text-violet-300">
              <Sliders className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Audio & Video Settings</h3>
              <p className="text-xs text-slate-400">Configure devices and conference preferences</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-4 p-1 bg-slate-900/80 border border-violet-500/20 rounded-2xl relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab("audio")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "audio"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Audio</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("video")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "video"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video & FX</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("shortcuts")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "shortcuts"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Shortcuts</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-5 space-y-4 min-h-[220px] relative z-10">
          {activeTab === "audio" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Microphone Input
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-900/90 border border-violet-500/20 rounded-2xl text-xs text-slate-200">
                  <Mic className="w-4 h-4 text-violet-400" />
                  <span className="truncate">Default System Microphone (High Definition Audio)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Speaker Output
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-900/90 border border-violet-500/20 rounded-2xl text-xs text-slate-200">
                  <Volume2 className="w-4 h-4 text-violet-400" />
                  <span className="truncate">Default System Speakers / Headphones</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-violet-500/15 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">AI Noise Suppression</p>
                    <p className="text-[11px] text-slate-400">Filters out background keyboard, fan, and room noise</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={noiseSuppression}
                    onChange={(e) => setNoiseSuppression(e.target.checked)}
                    className="w-4 h-4 accent-violet-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Acoustic Echo Cancellation</p>
                    <p className="text-[11px] text-slate-400">Prevents echo feedback during multi-party calls</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={echoCancellation}
                    onChange={(e) => setEchoCancellation(e.target.checked)}
                    className="w-4 h-4 accent-violet-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "video" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Camera Source
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-900/90 border border-violet-500/20 rounded-2xl text-xs text-slate-200">
                  <Video className="w-4 h-4 text-violet-400" />
                  <span className="truncate">Integrated FaceTime / Web Camera (1080p HD)</span>
                </div>
              </div>

              {/* Virtual Background */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Virtual Background & Effects
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: "none", label: "None", icon: Sparkles },
                    { id: "blur", label: "Studio Blur", icon: Sparkles },
                    { id: "violet", label: "Cosmic Neon", icon: Sparkles },
                  ].map((bg) => {
                    const isSelected = virtualBg === bg.id;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => setVirtualBg(bg.id as "none" | "blur" | "violet")}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-violet-600/30 border-violet-400 text-white shadow-md shadow-violet-600/20"
                            : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <p className="text-xs font-semibold">{bg.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-violet-500/15 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Mirror My Video</p>
                    <p className="text-[11px] text-slate-400">Flips your local camera feed horizontally</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={mirrorVideo}
                    onChange={(e) => setMirrorVideo(e.target.checked)}
                    className="w-4 h-4 accent-violet-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">High Definition 1080p</p>
                    <p className="text-[11px] text-slate-400">Stream crisp video when network bandwidth permits</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hdVideo}
                    onChange={(e) => setHdVideo(e.target.checked)}
                    className="w-4 h-4 accent-violet-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "shortcuts" && (
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span>Toggle Microphone Mute</span>
                <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono text-violet-300">M</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span>Toggle Camera Video</span>
                <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono text-violet-300">V</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span>Toggle Fullscreen</span>
                <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono text-violet-300">F</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span>Toggle Chat Overlay</span>
                <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono text-violet-300">C</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span>Raise / Lower Hand</span>
                <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono text-violet-300">H</kbd>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-violet-500/15 flex justify-end relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};

