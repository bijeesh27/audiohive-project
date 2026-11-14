import React from 'react';

interface TypingIndicatorProps {
  userName?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ userName }) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-500 animate-fade-in" aria-live="polite">
      <div className="flex items-center gap-1 bg-white border border-slate-200/80 rounded-full px-2.5 py-1 shadow-2xs">
        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
      </div>
      <span className="font-medium text-slate-500 italic">
        {userName ? `${userName} is typing...` : 'Typing...'}
      </span>
    </div>
  );
};

