import React, { useEffect, useRef, useState, useCallback } from "react";
import { Send, X, MessageSquare, Loader2, Smile } from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import type { ChatMessage } from "../../services/chatServices";
import {
  getRoomMessages,
  sendRoomMessage,
} from "../../services/chatServices";

interface FloatingChatPanelProps {
  roomId: string;
  roomName?: string;
  isOpen: boolean;
  onClose: () => void;
  onNewMessage?: () => void;
}

export const FloatingChatPanel: React.FC<FloatingChatPanelProps> = ({
  roomId,
  roomName,
  isOpen,
  onClose,
  onNewMessage,
}) => {
  const { socket } = useSocket();
  const { username, accessToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Extract current user ID from JWT token payload
  const currentUserId = React.useMemo(() => {
    if (!accessToken) return null;
    try {
      const payload = accessToken.split(".")[1];
      if (!payload) return null;
      const decoded = JSON.parse(atob(payload));
      return decoded?.id ?? null;
    } catch {
      return null;
    }
  }, [accessToken]);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Fetch initial message history
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    getRoomMessages(roomId, { limit: 50 })
      .then((data) => {
        if (!cancelled) {
          setMessages(data.messages || []);
          setTimeout(() => scrollToBottom(false), 80);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, isOpen, scrollToBottom]);

  // Listen to socket events for real-time messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => scrollToBottom(true), 50);
      if (!isOpen && onNewMessage) {
        onNewMessage();
      }
    };

    socket.on("room:message", handleNewMessage);
    socket.on("chat:message", handleNewMessage);

    return () => {
      socket.off("room:message", handleNewMessage);
      socket.off("chat:message", handleNewMessage);
    };
  }, [socket, isOpen, onNewMessage, scrollToBottom]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const savedMsg = await sendRoomMessage(roomId, text);
      setMessages((prev) => {
        if (prev.some((m) => m._id === savedMsg._id)) return prev;
        return [...prev, savedMsg];
      });

      if (socket && socket.connected) {
        socket.emit("room:send-message", {
          roomId,
          message: savedMsg,
        });
      }

      setInputText("");
      setShowEmojiPicker(false);
      setTimeout(() => scrollToBottom(true), 50);
    } catch {
      // Local fallback in case room chat API isn't enabled
      const fallbackMsg: ChatMessage = {
        _id: `temp-${Date.now()}`,
        roomId,
        senderId: {
          _id: currentUserId || "local",
          username: username || "You",
          email: "",
          profilePicture: "",
          role: "member",
        },
        message: text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      if (socket && socket.connected) {
        socket.emit("room:send-message", {
          roomId,
          message: fallbackMsg,
        });
      }
      setInputText("");
      setShowEmojiPicker(false);
      setTimeout(() => scrollToBottom(true), 50);
    } finally {
      setSending(false);
    }
  };

  const quickEmojis = ["👍", "❤️", "👏", "🔥", "🚀", "💡", "🙌", "🎉"];

  if (!isOpen) return null;

  return (
    <div className="absolute right-4 sm:right-6 top-20 bottom-28 w-80 sm:w-96 z-40 bg-[#0B0F19]/90 backdrop-blur-2xl border border-violet-500/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(139,92,246,0.15)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Background ambient glow */}
      <div className="absolute -top-20 -right-20 w-44 h-44 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="px-5 py-4 border-b border-violet-500/20 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white tracking-tight">Meeting Chat</h4>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {messages.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
              {roomName || "Current Call"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Close chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10 scrollbar-thin scrollbar-thumb-violet-500/20">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
            <p className="text-xs">Loading conversations...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-2">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-200">No messages yet</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
              Say hello or share meeting links with all attendees!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isLocal =
              msg.senderId._id === currentUserId ||
              msg.senderId.username === username;

            return (
              <div
                key={msg._id}
                className={`flex flex-col ${isLocal ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-medium text-slate-400">
                    {isLocal ? "You" : msg.senderId.username}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed break-words shadow-md ${
                    isLocal
                      ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-tr-none border border-violet-400/30"
                      : "bg-slate-800/80 backdrop-blur-md text-slate-200 rounded-tl-none border border-slate-700/60"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emoji Bar */}
      {showEmojiPicker && (
        <div className="px-4 py-2 bg-slate-900/90 border-t border-violet-500/20 flex items-center gap-1.5 justify-between relative z-10">
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setInputText((prev) => prev + emoji);
              }}
              className="p-1 hover:scale-125 transition-transform text-base cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Message Area */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-violet-500/20 bg-slate-950/60 relative z-10 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            showEmojiPicker
              ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
              : "text-slate-400 hover:text-white border-transparent hover:bg-slate-800"
          }`}
          title="Emojis"
        >
          <Smile className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send a chat message..."
          className="flex-1 bg-slate-900/90 border border-violet-500/20 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="p-2 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white shadow-md shadow-violet-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
};

