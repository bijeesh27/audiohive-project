import React from 'react';
import { Check, CheckCheck, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import type { DirectMessage } from '../../services/directChatServices';
import { formatMessageTime, renderFormattedContent } from './chatUtils';

export interface OptimisticMessage extends DirectMessage {
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface MessageBubbleProps {
  message: OptimisticMessage;
  isMine: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  otherUser?: {
    username: string;
  };
  onRetry?: (msg: OptimisticMessage) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMine,
  isFirstInGroup,
  isLastInGroup,
  otherUser,
  onRetry,
}) => {
  const status = message.status || (message.isRead ? 'read' : 'sent');
  const isFailed = status === 'failed';

  const getBubbleRadius = () => {
    if (isMine) {
      if (isFirstInGroup && isLastInGroup) return 'rounded-2xl rounded-br-xs';
      if (isFirstInGroup) return 'rounded-2xl rounded-br-md';
      if (isLastInGroup) return 'rounded-2xl rounded-tr-md rounded-br-xs';
      return 'rounded-2xl rounded-r-md';
    } else {
      if (isFirstInGroup && isLastInGroup) return 'rounded-2xl rounded-bl-xs';
      if (isFirstInGroup) return 'rounded-2xl rounded-bl-md';
      if (isLastInGroup) return 'rounded-2xl rounded-tl-md rounded-bl-xs';
      return 'rounded-2xl rounded-l-md';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Loader2 className="w-3 h-3 animate-spin text-white/70" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-300" />;
      case 'read':
        return <CheckCheck className="w-3.5 h-3.5 text-indigo-200" />;
      case 'delivered':
        return <CheckCheck className="w-3.5 h-3.5 text-white/70" />;
      case 'sent':
      default:
        return <Check className="w-3.5 h-3.5 text-white/70" />;
    }
  };

  const initial = otherUser?.username?.charAt(0).toUpperCase() || 'U';

  return (
    <div
      className={`flex items-end gap-2 group ${isMine ? 'justify-end' : 'justify-start'} ${
        isFirstInGroup ? 'mt-3' : 'mt-1'
      }`}
    >
      {!isMine && (
        <div className="w-7 h-7 shrink-0">
          {isLastInGroup ? (
            <div className="w-7 h-7 rounded-full bg-linear-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow-xs">
              {initial}
            </div>
          ) : (
            <div className="w-7" />
          )}
        </div>
      )}

      <div className={`max-w-[75%] sm:max-w-[65%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2.5 shadow-2xs break-words text-sm leading-relaxed transition-colors duration-150 ${getBubbleRadius()} ${
            isMine
              ? isFailed
                ? 'bg-red-500 text-white'
                : 'bg-indigo-600 text-white'
              : 'bg-white text-slate-800 border border-slate-200/90'
          }`}
        >
          {renderFormattedContent(message.content)}
        </div>

        {isLastInGroup && (
          <div
            className={`flex items-center gap-1.5 mt-1 px-1 text-[11px] font-medium text-slate-400 ${
              isMine ? 'flex-row' : 'flex-row-reverse'
            }`}
          >
            <span>{formatMessageTime(message.createdAt)}</span>
            {isMine && <span>{getStatusIcon()}</span>}
            {isMine && isFailed && onRetry && (
              <button
                type="button"
                onClick={() => onRetry(message)}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer ml-1"
                title="Retry sending message"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
