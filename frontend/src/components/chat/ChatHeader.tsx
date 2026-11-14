import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, MoreVertical, BellOff, X } from "lucide-react";
import type { ConversationParticipant } from "../../services/directChatServices";

interface ChatHeaderProps {
  otherUser: ConversationParticipant;
  isOnline: boolean;
  onBack: () => void;
  onCloseChat?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  otherUser,
  isOnline,
  onBack,
  onCloseChat,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const username = otherUser?.username || "Colleague";
  const userInitial = username.charAt(0).toUpperCase();

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Back Button */}
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations list"
          className="md:hidden p-1.5 -ml-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Contact Avatar */}
        <div className="relative flex-shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 text-xs font-semibold text-indigo-700 ring-2 ring-white">
            {userInitial}
          </div>
          <span
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
              isOnline ? "bg-emerald-500" : "bg-gray-300"
            }`}
          />
        </div>

        {/* Name and Presence */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-gray-900 truncate">{username}</h3>
            {otherUser.role && (
              <span className="hidden sm:inline-block text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded-md">
                {otherUser.role}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 flex items-center gap-1 leading-tight">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                isOnline ? "bg-emerald-500" : "bg-gray-300"
              }`}
            />
            <span>{isOnline ? "Online" : "Offline"}</span>
          </p>
        </div>
      </div>

      {/* Overflow Menu */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Chat options"
          aria-expanded={menuOpen}
          className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-gray-100 bg-white p-1 shadow-lg ring-1 ring-black/5 z-20 animate-fade-in"
          >
            <div className="px-3 py-2 border-b border-gray-50 text-[11px] text-gray-400">
              {otherUser.email}
            </div>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMuted(!muted);
                setMenuOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <BellOff className="w-3.5 h-3.5 text-gray-400" />
              <span>{muted ? "Unmute" : "Mute notifications"}</span>
            </button>

            {onCloseChat && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onCloseChat();
                }}
                className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
                <span>Close chat</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
