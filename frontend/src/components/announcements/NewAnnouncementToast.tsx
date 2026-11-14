import React from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';

interface NewAnnouncementToastProps {
  onRefresh: () => void;
}

export const NewAnnouncementToast: React.FC<NewAnnouncementToastProps> = ({ onRefresh }) => {
  return (
    <div className="flex justify-center sticky top-2 z-10 animate-bounce">
      <button
        type="button"
        onClick={onRefresh}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow-lg hover:bg-indigo-700 hover:shadow-xl transition cursor-pointer border border-indigo-500"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>New announcement available • Click to view</span>
        <ArrowUp className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

