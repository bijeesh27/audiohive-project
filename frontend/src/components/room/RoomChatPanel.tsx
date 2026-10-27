import React, { useEffect, useRef, useState, useCallback } from "react";
import { Send, Trash2, MessageSquare, Loader2 } from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import type { ChatMessage } from "../../services/chatServices";
import {
  getRoomMessages,
  sendRoomMessage,
  deleteRoomMessage,
} from "../../services/chatServices";

interface RoomChatPanelProps {
  roomId: string;
  roomName?: string;
}

const ROLE_BADGES: Record<string, string> = {
  workspaceadmin: "bg-blue-100 text-blue-700",
  "organization-owner": "bg-purple-100 text-purple-700",
  superadmin: "bg-red-100 text-red-700",
  member: "bg-gray-100 text-gray-700",
};

export const RoomChatPanel: React.FC<RoomChatPanelProps> = ({ roomId, roomName }) => {
  const { socket } = useSocket();
  const { username, userRole, accessToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    let cancelled = false;
    // loading initial state is true

    getRoomMessages(roomId, { limit: 50 })
      .then((data) => {
        if (!cancelled) {
          setMessages(data.messages || []);
          setTimeout(() => scrollToBottom(false), 50);
        }
      })
      .catch((err) => {
        console.error("Failed to load chat messages", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, scrollToBottom]);

  // Listen to socket events for real-time messages & typing
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg: ChatMessage) => {
      if (newMsg.roomId === roomId) {
        setMessages((prev) => {
          // Prevent duplicates
          const msgId = newMsg.id || newMsg._id;
          if (prev.some((m) => (m.id || m._id) === msgId)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => scrollToBottom(true), 50);
      }
    };

    const handleMessageDeleted = ({ messageId, roomId: deletedInRoom }: { messageId: string; roomId: string }) => {
      if (deletedInRoom === roomId) {
        setMessages((prev) => prev.filter((m) => (m.id || m._id) !== messageId));
      }
    };

    const handleTyping = ({ userId, username: typerName, roomId: typedRoom }: { userId: string; username: string; roomId: string }) => {
      if (typedRoom === roomId && userId !== currentUserId) {
        setTypingUsers((prev) => new Map(prev).set(userId, typerName));
      }
    };

    const handleStopTyping = ({ userId, roomId: typedRoom }: { userId: string; roomId: string }) => {
      if (typedRoom === roomId) {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
      }
    };

    socket.on("chat:new-message", handleNewMessage);
    socket.on("chat:message-deleted", handleMessageDeleted);
    socket.on("chat:typing", handleTyping);
    socket.on("chat:stop-typing", handleStopTyping);

    return () => {
      socket.off("chat:new-message", handleNewMessage);
      socket.off("chat:message-deleted", handleMessageDeleted);
      socket.off("chat:typing", handleTyping);
      socket.off("chat:stop-typing", handleStopTyping);
    };
  }, [socket, roomId, currentUserId, scrollToBottom]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (socket) {
      socket.emit("chat:typing", roomId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("chat:stop-typing", roomId);
      }, 1500);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || sending) return;

    if (socket && typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit("chat:stop-typing", roomId);
    }

    setSending(true);
    setInputText("");

    try {
      await sendRoomMessage(roomId, { content: trimmed, type: "text" });
    } catch (err) {
      console.error("Failed to send message", err);
      setInputText(trimmed); // restore text on failure
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteRoomMessage(roomId, messageId);
      setMessages((prev) => prev.filter((m) => (m.id || m._id) !== messageId));
    } catch (err) {
      console.error("Failed to delete message", err);
    }
  };

  const getSenderId = (sender: string | { _id: string; username: string }): string => {
    if (typeof sender === "object" && sender !== null) {
      return sender._id;
    }
    return String(sender);
  };

  const typingNames = Array.from(typingUsers.values());

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">
              {roomName ? `${roomName} Chat` : "Room Chat"}
            </h2>
            <p className="text-xs text-gray-400">
              Live messaging with members in this room
            </p>
          </div>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-xs">Loading conversation…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <div className="p-3 bg-gray-50 rounded-full">
              <MessageSquare className="w-8 h-8 opacity-40 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">No messages yet</p>
            <p className="text-xs text-gray-400">Say hello and start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const msgId = msg.id || msg._id || "";
            const senderId = getSenderId(msg.senderId);
            const isMe = currentUserId ? senderId === currentUserId : msg.senderName === username;
            const canDelete = isMe || userRole === "workspaceadmin" || userRole === "superadmin";

            return (
              <div
                key={msgId}
                className={`flex items-start gap-2.5 group ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                  {msg.senderName ? msg.senderName.charAt(0).toUpperCase() : "U"}
                </div>

                {/* Message Bubble Container */}
                <div className={`max-w-[75%] space-y-1 ${isMe ? "items-end" : "items-start"}`}>
                  {/* Sender metadata */}
                  <div className={`flex items-center gap-1.5 text-xs text-gray-400 ${isMe ? "justify-end" : "justify-start"}`}>
                    <span className="font-medium text-gray-700">{isMe ? "You" : msg.senderName}</span>
                    {msg.senderRole && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-medium capitalize ${
                          ROLE_BADGES[msg.senderRole] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {msg.senderRole.replace("-", " ")}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Bubble */}
                  <div className="relative group/bubble flex items-center gap-2">
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200/60"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Delete button (hover) */}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteMessage(msgId)}
                        title="Delete message"
                        className={`opacity-0 group-hover/bubble:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500 rounded ${
                          isMe ? "order-first" : "order-last"
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingNames.length > 0 && (
        <div className="px-6 py-1 text-xs text-gray-400 italic">
          {typingNames.join(", ")} {typingNames.length === 1 ? "is" : "are"} typing…
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center flex-shrink-0"
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

export default RoomChatPanel;
