import React from "react";
import { DoorOpen, SearchX, AlertCircle, RefreshCw } from "lucide-react";

interface EmptyStateProps {
  type: "no-rooms" | "no-results" | "error";
  searchQuery?: string;
  errorMessage?: string;
  onClearFilters?: () => void;
  onRetry?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  searchQuery,
  errorMessage,
  onClearFilters,
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
        <h3 className="text-base font-semibold text-gray-900">Unable to load rooms</h3>
        <p className="mt-1 text-sm text-gray-600">
          {errorMessage || "An unexpected error occurred while fetching your rooms."}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
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
          {searchQuery ? `No rooms match "${searchQuery}"` : "No rooms match your filters"}
        </h3>
        <p className="mt-1.5 text-sm text-gray-500 max-w-sm">
          Try adjusting your search terms or filters to find what you are looking for.
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-gray-100 bg-white shadow-xs">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-50 to-purple-50 text-indigo-600 mb-4 ring-1 ring-indigo-100">
        <DoorOpen className="h-8 w-8" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">No rooms available yet</h3>
      <p className="mt-1.5 text-sm text-gray-500 max-w-md">
        There are no rooms set up in your workspace yet. Check back soon or contact your workspace
        administrator to get access.
      </p>
    </div>
  );
};

