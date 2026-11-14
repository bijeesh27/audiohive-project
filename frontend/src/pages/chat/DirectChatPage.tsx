import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDirectChat } from '../../context/useDirectChat';
import { API_ROUTES } from '../../constants/Api_Routes';
import { ConversationList } from '../../components/chat/ConversationList';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { MessageList } from '../../components/chat/MessageList';
import { Composer } from '../../components/chat/Composer';
import { NoConversationSelected } from '../../components/chat/ChatEmptyState';
import { MessageListSkeleton } from '../../components/chat/ChatSkeleton';
import { NewChatModal } from '../../components/chat/NewChatModal';
import { useDirectChatState } from '../../components/chat/useDirectChatState';

export default function DirectChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { userId, userRole } = useAuth();
  const { isUserOnline } = useDirectChat();
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  const activeConversationId = conversationId || null;
  const {
    conversations,
    loadingConversations,
    messages,
    loadingMessages,
    isLoadingOlder,
    hasMoreOlder,
    otherUser,
    typingUserName,
    isConnected,
    handleSendMessage,
    handleRetryMessage,
    handleLoadOlder,
    emitTyping,
    emitStopTyping,
  } = useDirectChatState(activeConversationId);

  const getChatRoute = useCallback(
    (convId?: string) => {
      if (userRole === 'workspaceadmin') {
        return convId
          ? API_ROUTES.WORKSPACE_ADMIN.NAV.CHAT_CONVERSATION(convId)
          : API_ROUTES.WORKSPACE_ADMIN.NAV.CHAT;
      }
      if (userRole === 'organization-owner') {
        return convId
          ? API_ROUTES.ORGANIZATION_ADMIN.NAV.CHAT_CONVERSATION(convId)
          : API_ROUTES.ORGANIZATION_ADMIN.NAV.CHAT;
      }
      return convId ? API_ROUTES.MEMBER.NAV.CHAT_CONVERSATION(convId) : API_ROUTES.MEMBER.NAV.CHAT;
    },
    [userRole]
  );

  const handleSelectConversation = (id: string) => {
    navigate(getChatRoute(id));
  };

  const handleBackToList = () => {
    navigate(getChatRoute());
  };

  const isOtherOnline = otherUser ? isUserOnline(otherUser._id) : false;

  return (
    <div className="h-[calc(100dvh-5.5rem)] sm:h-[calc(100dvh-6.5rem)] lg:h-[calc(100dvh-7.5rem)] flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      {!isConnected && (
        <div className="bg-amber-500/10 border-b border-amber-200 px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-medium text-amber-800">
          <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span>Connecting to real-time chat service...</span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Conversation List */}
        <div
          className={`w-full md:w-[340px] md:shrink-0 h-full border-r border-slate-200/80 bg-white ${
            activeConversationId ? 'hidden md:flex flex-col' : 'flex flex-col'
          }`}
        >
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            loading={loadingConversations}
            currentUserId={userId}
            isUserOnline={isUserOnline}
            onSelectConversation={handleSelectConversation}
            onOpenNewChat={() => setIsNewChatOpen(true)}
          />
        </div>

        {/* Right Pane: Conversation View */}
        <div
          className={`flex-1 flex flex-col h-full bg-[#F8F9FB] ${
            !activeConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversationId && otherUser ? (
            <>
              <ChatHeader
                otherUser={otherUser}
                isOnline={isOtherOnline}
                onBack={handleBackToList}
              />

              {loadingMessages ? (
                <MessageListSkeleton />
              ) : (
                <MessageList
                  messages={messages}
                  currentUserId={userId || ''}
                  otherUser={otherUser}
                  isLoadingOlder={isLoadingOlder}
                  hasMoreOlder={hasMoreOlder}
                  onLoadOlder={handleLoadOlder}
                  onRetryMessage={handleRetryMessage}
                  onSendGreeting={handleSendMessage}
                  typingUserName={typingUserName}
                />
              )}

              <Composer
                conversationId={activeConversationId}
                onSendMessage={handleSendMessage}
                onTyping={emitTyping}
                onStopTyping={emitStopTyping}
                disabled={!isConnected}
              />
            </>
          ) : (
            <NoConversationSelected onStartNewChat={() => setIsNewChatOpen(true)} />
          )}
        </div>
      </div>

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onConversationReady={(newConvId) => {
          setIsNewChatOpen(false);
          navigate(getChatRoute(newConvId));
        }}
        currentUserId={userId}
      />
    </div>
  );
}
