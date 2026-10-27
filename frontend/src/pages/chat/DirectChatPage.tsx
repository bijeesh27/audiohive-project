import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Search,
  Send,
  UserPlus,
  ArrowLeft,
  Loader2,
  Check,
  CheckCheck,
  X,
  User as UserIcon,
} from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { useDirectChat } from "../../context/DirectChatContext";
import {
  getConversations,
  getConversationMessages,
  getOrCreateWithUser,
  sendDirectMessage,
  markConversationAsRead,
  searchDirectChatUsers,
} from "../../services/directChatServices";
import type {
  Conversation,
  DirectMessage,
  EligibleUser,
} from "../../services/directChatServices";

const ROLE_BADGES: Record<string, string> = {
  workspaceadmin: "bg-blue-100 text-blue-700",
  "organization-owner": "bg-purple-100 text-purple-700",
  superadmin: "bg-red-100 text-red-700",
  member: "bg-gray-100 text-gray-700",
};

export default function DirectChatPage() {
  const { conversationId: routeConversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { userId, userRole } = useAuth();
  const { isUserOnline, refreshUnreadCount } = useDirectChat();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    routeConversationId || null
  );
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // New Chat Modal state
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const otherUser = activeConversation?.otherUser;

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Fetch conversations list
  const loadConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const data = await getConversations();
      setConversations(data);
      return data;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to load conversations", err);
      return [];
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Sync route param with active conversation
  useEffect(() => {
    if (routeConversationId && routeConversationId !== activeConversationId) {
      setActiveConversationId(routeConversationId);
    }
  }, [routeConversationId, activeConversationId]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setLoadingMessages(true);

    getConversationMessages(activeConversationId)
      .then((res) => {
        if (!cancelled) {
          setMessages(res.messages || []);
          setTimeout(() => scrollToBottom(false), 50);

          // Update unread count in conversations state locally
          setConversations((prev) =>
            prev.map((c) => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c))
          );
          refreshUnreadCount();
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("Failed to load conversation messages", err);
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeConversationId, scrollToBottom, refreshUnreadCount]);

  // Real-time socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg: DirectMessage) => {
      const isForCurrentConv = newMsg.conversationId === activeConversationId;

      if (isForCurrentConv) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => scrollToBottom(true), 50);

        if (newMsg.receiverId === userId) {
          markConversationAsRead(newMsg.conversationId).catch(() => {});
        }
      }

      // Update conversations list with latest message & bump to top
      setConversations((prev) => {
        const existingIdx = prev.findIndex((c) => c.id === newMsg.conversationId);
        if (existingIdx !== -1) {
          const updated = [...prev];
          const conv = { ...updated[existingIdx] };
          conv.lastMessage = {
            content: newMsg.content,
            senderId: newMsg.senderId,
            createdAt: newMsg.createdAt,
            type: newMsg.type,
          };
          conv.updatedAt = newMsg.createdAt;
          if (!isForCurrentConv && newMsg.receiverId === userId) {
            conv.unreadCount = (conv.unreadCount || 0) + 1;
          }
          updated.splice(existingIdx, 1);
          return [conv, ...updated];
        } else {
          // If conversation wasn't in state, reload conversations
          loadConversations();
          return prev;
        }
      });
    };

    const handleMessagesRead = ({
      conversationId: readConvId,
      readBy,
    }: {
      conversationId: string;
      readBy: string;
    }) => {
      if (readConvId === activeConversationId && readBy !== userId) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId === userId ? { ...m, isRead: true, readAt: new Date().toISOString() } : m))
        );
      }
    };

    const handleTyping = ({
      senderId,
      conversationId: typingConvId,
    }: {
      senderId: string;
      conversationId: string;
    }) => {
      if (typingConvId === activeConversationId && senderId !== userId) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = ({
      senderId,
      conversationId: typingConvId,
    }: {
      senderId: string;
      conversationId: string;
    }) => {
      if (typingConvId === activeConversationId && senderId !== userId) {
        setIsTyping(false);
      }
    };

    socket.on("dm:new-message", handleNewMessage);
    socket.on("dm:messages-read", handleMessagesRead);
    socket.on("dm:typing", handleTyping);
    socket.on("dm:stop-typing", handleStopTyping);

    return () => {
      socket.off("dm:new-message", handleNewMessage);
      socket.off("dm:messages-read", handleMessagesRead);
      socket.off("dm:typing", handleTyping);
      socket.off("dm:stop-typing", handleStopTyping);
    };
  }, [socket, activeConversationId, userId, scrollToBottom, loadConversations]);

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConversation || !otherUser || sending) return;

    const messageText = inputText.trim();
    setInputText("");

    // Emit stop typing
    if (socket && otherUser) {
      socket.emit("dm:stop-typing", {
        receiverId: otherUser._id,
        conversationId: activeConversation.id,
      });
    }

    try {
      setSending(true);
      await sendDirectMessage({
        receiverId: otherUser._id,
        content: messageText,
        conversationId: activeConversation.id,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to send direct message", err);
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (!socket || !otherUser || !activeConversation) return;

    socket.emit("dm:typing", {
      receiverId: otherUser._id,
      conversationId: activeConversation.id,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("dm:stop-typing", {
        receiverId: otherUser._id,
        conversationId: activeConversation.id,
      });
    }, 2000);
  };

  // Search users for new conversation modal
  useEffect(() => {
    if (!isNewChatOpen) return;

    const timer = setTimeout(() => {
      setSearchingUsers(true);
      searchDirectChatUsers(userSearchQuery)
        .then((users) => setEligibleUsers(users))
        .catch(() => setEligibleUsers([]))
        .finally(() => setSearchingUsers(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [isNewChatOpen, userSearchQuery]);

  // Start chat with user
  const handleStartChatWithUser = async (targetUser: EligibleUser) => {
    try {
      const conv = await getOrCreateWithUser(targetUser._id);
      setIsNewChatOpen(false);
      setUserSearchQuery("");

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conv.id);
        return exists ? prev : [conv, ...prev];
      });

      setActiveConversationId(conv.id);

      // Update URL route based on role
      const basePath =
        userRole === "workspaceadmin"
          ? "/workspaceadmin/chat"
          : userRole === "organization-owner"
          ? "/organization-owner/chat"
          : "/member/chat";

      navigate(`${basePath}/${conv.id}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to start chat with user", err);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversationId(conv.id);
    const basePath =
      userRole === "workspaceadmin"
        ? "/workspaceadmin/chat"
        : userRole === "organization-owner"
        ? "/organization-owner/chat"
        : "/member/chat";

    navigate(`${basePath}/${conv.id}`);
  };

  // Filter conversations by search box
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.otherUser?.username?.toLowerCase().includes(q) ||
        c.otherUser?.email?.toLowerCase().includes(q) ||
        c.lastMessage?.content?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const formatMessageTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const formatConversationDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] bg-white rounded-xl border border-gray-200 shadow-sm flex overflow-hidden">
      {/* ── LEFT PANE: CONVERSATION LIST ── */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-white flex-shrink-0 ${
          activeConversationId ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <h1 className="text-base font-semibold text-gray-900">Direct Messages</h1>
          </div>
          <button
            onClick={() => setIsNewChatOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-medium transition-colors"
            title="Start new chat"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loadingConversations ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <p className="text-xs">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 gap-2">
              <MessageSquare className="w-8 h-8 opacity-30 text-gray-400" />
              <p className="text-sm font-medium text-gray-600">No conversations yet</p>
              <p className="text-xs text-gray-400 max-w-[200px]">
                Click &ldquo;New Chat&rdquo; to start messaging members of your workspace.
              </p>
              <button
                onClick={() => setIsNewChatOpen(true)}
                className="mt-2 text-xs font-medium text-indigo-600 hover:underline"
              >
                Find someone to chat with
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const other = conv.otherUser;
              const online = isUserOnline(other._id) || other.isOnline;
              const isSelected = conv.id === activeConversationId;
              const unread = conv.unreadCount || 0;

              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`flex items-start gap-3 p-3.5 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-indigo-50/80 border-l-4 border-indigo-600"
                      : "hover:bg-gray-50 border-l-4 border-transparent"
                  }`}
                >
                  {/* Avatar with online status badge */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
                      {other.username ? other.username.slice(0, 2).toUpperCase() : "U"}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white ${
                        online ? "bg-green-500" : "bg-gray-300"
                      }`}
                      title={online ? "Online" : "Offline"}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {other.username}
                      </p>
                      {conv.lastMessage && (
                        <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">
                          {formatConversationDate(conv.updatedAt)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-500 truncate flex-1">
                        {conv.lastMessage?.content || (
                          <span className="italic text-gray-400">Draft / No messages</span>
                        )}
                      </p>
                      {unread > 0 && (
                        <span className="bg-indigo-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT PANE: ACTIVE CHAT WINDOW ── */}
      <div
        className={`flex-1 flex flex-col bg-gray-50 ${
          !activeConversationId ? "hidden md:flex" : "flex"
        }`}
      >
        {activeConversation && otherUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between flex-shrink-0 shadow-sm z-10">
              <div className="flex items-center gap-3">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setActiveConversationId(null)}
                  className="md:hidden p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg mr-1"
                  title="Back to conversations"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Avatar with status */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
                    {otherUser.username ? otherUser.username.slice(0, 2).toUpperCase() : "U"}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white ${
                      isUserOnline(otherUser._id) || otherUser.isOnline
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-gray-900">{otherUser.username}</h2>
                    {otherUser.role && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${
                          ROLE_BADGES[otherUser.role] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {otherUser.role.replace("-", " ")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {isUserOnline(otherUser._id) || otherUser.isOnline ? (
                      <span className="text-green-600 font-medium">Online</span>
                    ) : (
                      "Offline"
                    )}
                    {otherUser.email && (
                      <span className="text-gray-400"> • {otherUser.email}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
              {loadingMessages ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <p className="text-xs">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                  <div className="p-3 bg-white rounded-full border border-gray-200 shadow-sm">
                    <MessageSquare className="w-8 h-8 opacity-40 text-indigo-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">No messages here yet</p>
                  <p className="text-xs text-gray-400 text-center max-w-xs">
                    Send a direct message to start a private conversation with {otherUser.username}.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === userId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] md:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${
                          isMe
                            ? "bg-indigo-600 text-white rounded-tr-none"
                            : "bg-white text-gray-800 rounded-tl-none border border-gray-200/80"
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* Timestamp & read receipts */}
                      <div
                        className={`flex items-center gap-1 mt-1 text-[11px] text-gray-400 px-1`}
                      >
                        <span>{formatMessageTime(msg.createdAt)}</span>
                        {isMe && (
                          <span>
                            {msg.isRead ? (
                              <CheckCheck className="w-3.5 h-3.5 text-indigo-600" title="Read" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-gray-400" title="Sent" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-gray-400 italic bg-white/70 py-1 px-3 rounded-full w-max border border-gray-200">
                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  {otherUser.username} is typing...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 md:p-4 bg-white border-t border-gray-200 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={`Message ${otherUser.username}...`}
                value={inputText}
                onChange={handleInputChange}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </>
        ) : (
          /* Empty state when no conversation is selected */
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-400">
            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm mb-4">
              <MessageSquare className="w-12 h-12 text-indigo-500 opacity-60" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Your Direct Messages</h2>
            <p className="text-sm text-gray-500 max-w-sm mb-6">
              Connect and collaborate with people in your workspace or organization through private messages.
            </p>
            <button
              onClick={() => setIsNewChatOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Start a Conversation
            </button>
          </div>
        )}
      </div>

      {/* ── NEW CHAT MODAL ── */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-semibold text-gray-900">New Message</h3>
              </div>
              <button
                onClick={() => {
                  setIsNewChatOpen(false);
                  setUserSearchQuery("");
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search members */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search members by name or email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2">
              {searchingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : eligibleUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  {userSearchQuery ? "No members match your search." : "No other members found in this workspace."}
                </div>
              ) : (
                eligibleUsers.map((u) => {
                  const online = isUserOnline(u._id) || u.isOnline;

                  return (
                    <div
                      key={u._id}
                      onClick={() => handleStartChatWithUser(u)}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs">
                            {u.username ? u.username.slice(0, 2).toUpperCase() : "U"}
                          </div>
                          <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                              online ? "bg-green-500" : "bg-gray-300"
                            }`}
                          />
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-900">{u.username}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium capitalize ${
                          ROLE_BADGES[u.role] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {u.role.replace("-", " ")}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
