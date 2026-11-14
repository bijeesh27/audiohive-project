import React from 'react';
import { CheckCheck, Loader2 } from 'lucide-react';

interface AnnouncementsHeaderProps {
  unreadCount: number;
  isMarkingAllRead: boolean;
  onMarkAllAsRead: () => void;
}

export const AnnouncementsHeader: React.FC<AnnouncementsHeaderProps> = ({
  unreadCount,
  isMarkingAllRead,
  onMarkAllAsRead,
}) => {
  const hasUnread = unreadCount > 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/80">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Announcements
        </h1>
        <p className="text-sm text-slate-500 mt-1 flex items-center gap-2" aria-live="polite">
          {hasUnread ? (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span className="font-medium text-slate-700">{unreadCount} unread</span>
              <span>• Updates and notices from your team</span>
            </>
          ) : (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600">You're all caught up</span>
            </>
          )}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMarkAllAsRead}
          disabled={!hasUnread || isMarkingAllRead}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            hasUnread && !isMarkingAllRead
              ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
              : 'bg-slate-100 border border-slate-200/60 text-slate-400 cursor-not-allowed opacity-75'
          }`}
          aria-label="Mark all announcements as read"
        >
          {isMarkingAllRead ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          ) : (
            <CheckCheck className={`w-4 h-4 ${hasUnread ? 'text-indigo-600' : 'text-slate-400'}`} />
          )}
          <span>Mark all as read</span>
        </button>
      </div>
    </div>
  );
};

