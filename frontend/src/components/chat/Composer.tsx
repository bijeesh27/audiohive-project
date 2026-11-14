import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, AlertCircle } from 'lucide-react';

interface ComposerProps {
  conversationId: string;
  onSendMessage: (content: string) => Promise<boolean> | boolean;
  onTyping: () => void;
  onStopTyping: () => void;
  disabled?: boolean;
}

const MAX_CHARS = 2000;
const DRAFT_STORAGE_KEY_PREFIX = 'audiohive_chat_draft_';

export const Composer: React.FC<ComposerProps> = ({
  conversationId,
  onSendMessage,
  onTyping,
  onStopTyping,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore draft when conversation changes
  useEffect(() => {
    if (!conversationId) return;
    const savedDraft = sessionStorage.getItem(`${DRAFT_STORAGE_KEY_PREFIX}${conversationId}`) || '';
    setText(savedDraft);
  }, [conversationId]);

  // Save draft
  const updateDraft = useCallback(
    (newText: string) => {
      setText(newText);
      if (conversationId) {
        if (newText.trim()) {
          sessionStorage.setItem(`${DRAFT_STORAGE_KEY_PREFIX}${conversationId}`, newText);
        } else {
          sessionStorage.removeItem(`${DRAFT_STORAGE_KEY_PREFIX}${conversationId}`);
        }
      }
    },
    [conversationId]
  );

  // Auto-grow textarea
  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = 120; // ~5 lines
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [text]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) {
      updateDraft(val);

      // Typing notification
      onTyping();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        onStopTyping();
      }, 1500);
    }
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting || disabled) return;

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    onStopTyping();

    setIsSubmitting(true);
    try {
      const success = await onSendMessage(trimmed);
      if (success !== false) {
        updateDraft('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    } finally {
      setIsSubmitting(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const charCount = text.length;
  const isNearLimit = charCount >= 1800;
  const isOverLimit = charCount >= MAX_CHARS;
  const canSend = text.trim().length > 0 && !isSubmitting && !disabled;

  return (
    <div className="p-3 sm:p-4 bg-white border-t border-slate-200/90 shrink-0">
      <div className="relative flex items-end gap-2 bg-[#F8F9FB] rounded-2xl border border-slate-200/80 p-1.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSubmitting}
          placeholder={disabled ? 'Connecting...' : 'Type a message... (Shift + Enter for new line)'}
          className="w-full resize-none bg-transparent px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden disabled:opacity-50 min-h-[40px] max-h-[120px] leading-relaxed"
          aria-label="Message input"
        />

        <div className="flex items-center gap-1.5 pb-1 pr-1 shrink-0">
          {isNearLimit && (
            <span
              className={`text-[11px] font-medium px-1.5 py-0.5 rounded-sm ${
                isOverLimit ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'
              }`}
            >
              {charCount}/{MAX_CHARS}
            </span>
          )}

          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={`p-2 rounded-xl transition-all duration-150 flex items-center justify-center cursor-pointer ${
              canSend
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
            }`}
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isOverLimit && (
        <div className="flex items-center gap-1 text-xs text-red-600 mt-1.5 px-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Maximum character limit (2000) reached.</span>
        </div>
      )}
    </div>
  );
};
