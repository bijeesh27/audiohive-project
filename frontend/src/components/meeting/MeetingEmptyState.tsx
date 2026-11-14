import React from "react";
import { Calendar, SearchX, AlertCircle, RefreshCw, Plus, CalendarOff, History } from "lucide-react";
import type { MeetingTab } from "../../types/meetings";

interface MeetingEmptyStateProps {
  type: "tab-empty" | "no-results" | "error";
  tab?: MeetingTab;
  searchQuery?: string;
  errorMessage?: string;
  onSchedule?: () => void;
  onClearSearch?: () => void;
  onRetry?: () => void;
}

export const MeetingEmptyState: React.FC<MeetingEmptyStateProps> = ({
  type,
  tab = "upcoming",
  searchQuery,
  errorMessage,
  onSchedule,
  onClearSearch,
  onRetry,
}) => {
  if (type === "error") {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200/80 bg-red-50/60 p-6 sm:p-8 text-center max-w-xl mx-auto shadow-xs"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-3.5">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">Unable to load meetings</h3>
        <p className="mt-1 text-sm text-gray-600">
          {errorMessage || "An unexpected error occurred while fetching your meetings."}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  if (type === "no-results") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-gray-200 bg-white/70">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4 ring-1 ring-indigo-100/60">
          <SearchX className="h-7 w-7" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">
          {searchQuery ? `No meetings match "${searchQuery}"` : "No meetings match your search"}
        </h3>
        <p className="mt-1.5 text-sm text-gray-500 max-w-sm">
          Check for typos in the meeting title or code, or clear your query to view all meetings.
        </p>
        {onClearSearch && (
          <button
            type="button"
            onClick={onClearSearch}
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 cursor-pointer"
          >
            Clear search
          </button>
        )}
      </div>
    );
  }

  // Tab-specific empty states
  if (tab === "past") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-gray-100 bg-white shadow-xs">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 mb-4 ring-1 ring-gray-100">
          <History className="h-7 w-7" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">No past meetings yet</h3>
        <p className="mt-1.5 text-sm text-gray-500 max-w-sm">
          Completed sessions and expired meetings will appear here for your records.
        </p>
      </div>
    );
  }

  if (tab === "cancelled") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-gray-100 bg-white shadow-xs">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 mb-4 ring-1 ring-amber-100">
          <CalendarOff className="h-7 w-7" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">No cancelled meetings</h3>
        <p className="mt-1.5 text-sm text-gray-500 max-w-sm">
          You don&apos;t have any cancelled meetings.
        </p>
      </div>
    );
  }

  // Upcoming empty state
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-gray-100 bg-white shadow-xs">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-50 to-purple-50 text-indigo-600 mb-4 ring-1 ring-indigo-100">
        <Calendar className="h-8 w-8" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">No upcoming meetings</h3>
      <p className="mt-1.5 text-sm text-gray-500 max-w-sm">
        You have no scheduled calls. Plan a new conference to collaborate with your team.
      </p>
      {onSchedule && (
        <button
          type="button"
          onClick={onSchedule}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 cursor-pointer"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Schedule a meeting</span>
        </button>
      )}
    </div>
  );
};

