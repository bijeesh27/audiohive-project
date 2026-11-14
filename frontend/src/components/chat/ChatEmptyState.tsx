import React from 'react';
import { MessageSquare, Hand, Sparkles } from 'lucide-react';

interface NoConversationSelectedProps {
  onStartNewChat?: () => void;
}

export const NoConversationSelected: React.FC<NoConversationSelectedProps> = ({ onStartNewChat }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F8F9FB]">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-xs">
        <MessageSquare className="w-8 h-8 stroke-[1.75]" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1">Your Messages</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
        Choose a direct conversation from the list or start a new message with any team member in your organization.
      </p>
      {onStartNewChat && (
        <button
          type="button"
          onClick={onStartNewChat}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition shadow-xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Start a conversation</span>
        </button>
      )}
    </div>
  );
};

interface EmptyConversationViewProps {
  otherUserName: string;
  onSendGreeting?: (greeting: string) => void;
}

export const EmptyConversationView: React.FC<EmptyConversationViewProps> = ({
  otherUserName,
  onSendGreeting,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F8F9FB]">
      <div className="w-14 h-14 rounded-full bg-linear-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-xl font-semibold mb-3 shadow-xs">
        {otherUserName.charAt(0).toUpperCase()}
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">
        Start a conversation with {otherUserName}
      </h3>
      <p className="text-xs text-slate-400 max-w-xs mb-5">
        Send a friendly wave or type a message below to kick things off.
      </p>
      {onSendGreeting && (
        <button
          type="button"
          onClick={() => onSendGreeting(`👋 Hi ${otherUserName}!`)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-indigo-300 transition shadow-2xs cursor-pointer"
        >
          <Hand className="w-4 h-4 text-amber-500" />
          <span>Say hello with a wave 👋</span>
        </button>
      )}
    </div>
  );
};

