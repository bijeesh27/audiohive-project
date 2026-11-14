import React, { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, UserCheck, AlertCircle } from "lucide-react";
import { searchDirectChatUsers, getOrCreateWithUser } from "../../services/directChatServices";
import type { EligibleUser } from "../../services/directChatServices";

interface NewChatModalProps {
  isOpen: boolean;
  currentUserId?: string | null;
  onClose: () => void;
  onConversationReady: (conversationId: string) => void;
}

const ROLE_BADGES: Record<string, string> = {
  workspaceadmin: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  "organization-owner": "bg-purple-50 text-purple-700 ring-1 ring-purple-100",
  superadmin: "bg-red-50 text-red-700 ring-1 ring-red-100",
  member: "bg-gray-100 text-gray-700",
};

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  currentUserId,
  onClose,
  onConversationReady,
}) => {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<EligibleUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingChatId, setStartingChatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    setQuery("");
    setError(null);
    inputRef.current?.focus();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Search users with 250ms debounce
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(() => {
      searchDirectChatUsers(query)
        .then((data) => {
          if (!cancelled) {
            // Exclude current user explicitly
            const filtered = (Array.isArray(data) ? data : []).filter(
              (u) => u._id !== currentUserId
            );
            setUsers(filtered);
          }
        })
        .catch(() => {
          if (!cancelled) setError("Failed to search members.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, isOpen, currentUserId]);

  const handleSelectUser = async (targetUser: EligibleUser) => {
    if (startingChatId || targetUser._id === currentUserId) return;

    setStartingChatId(targetUser._id);
    setError(null);

    try {
      // Backend finds existing conversation or creates one
      const conv = await getOrCreateWithUser(targetUser._id);
      if (conv?.id) {
        onConversationReady(conv.id);
        onClose();
      }
    } catch {
      setError("Unable to start conversation with this member.");
    } finally {
      setStartingChatId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-chat-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 id="new-chat-title" className="text-sm font-bold text-gray-900">
              New Direct Message
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Select a colleague to start chatting</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-3 border-b border-gray-50 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by name or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-2 p-2.5 rounded-xl bg-red-50 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Users list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-600" />
              <span className="text-xs">Finding members...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <UserCheck className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-xs font-semibold text-gray-600">No members found</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Try searching with a different name</p>
            </div>
          ) : (
            users.map((user) => {
              const isStarting = startingChatId === user._id;
              const roleBadge = ROLE_BADGES[user.role] || ROLE_BADGES.member;

              return (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => handleSelectUser(user)}
                  disabled={isStarting}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/60 transition-colors text-left cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 text-indigo-700 font-semibold text-xs flex items-center justify-center ring-2 ring-white">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                          user.isOnline ? "bg-emerald-500" : "bg-gray-300"
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-900 truncate">
                          {user.username}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${roleBadge}`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  {isStarting && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

