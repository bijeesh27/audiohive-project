import React from 'react';
import { Megaphone, CheckCircle2, SearchX, AlertCircle, RotateCcw } from 'lucide-react';

interface AnnouncementEmptyStateProps {
  type: 'empty' | 'caught-up' | 'no-results' | 'error';
  searchQuery?: string;
  errorMessage?: string;
  onClearFilters?: () => void;
  onRetry?: () => void;
}

export const AnnouncementEmptyState: React.FC<AnnouncementEmptyStateProps> = ({
  type,
  searchQuery,
  errorMessage,
  onClearFilters,
  onRetry,
}) => {
  if (type === 'error') {
    return (
      <div className="bg-red-50/70 border border-red-200 rounded-2xl p-6 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-red-900 mb-1">Failed to load announcements</h3>
        <p className="text-xs text-red-600 max-w-sm mx-auto mb-4">
          {errorMessage || 'There was an unexpected error fetching your announcements. Please try again.'}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  if (type === 'caught-up') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-2xs">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3 shadow-2xs">
          <CheckCircle2 className="w-7 h-7 stroke-[1.75]" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">You're all caught up!</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          You have read all recent announcements. Switch to the "All" tab to browse previous team updates.
        </p>
      </div>
    );
  }

  if (type === 'no-results') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-2xs">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 mx-auto flex items-center justify-center mb-3 shadow-2xs">
          <SearchX className="w-7 h-7 stroke-[1.75]" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">No announcements match your filters</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
          {searchQuery
            ? `No announcements found matching "${searchQuery}". Try different keywords or reset your filters.`
            : 'Try adjusting your type or date range filters to find what you are looking for.'}
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear filters</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-2xs">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mx-auto flex items-center justify-center mb-3 shadow-2xs">
        <Megaphone className="w-7 h-7 stroke-[1.75]" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">No announcements yet</h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto">
        When workspace administrators broadcast updates, important events, or team notices, they will appear here.
      </p>
    </div>
  );
};

