import React from "react";

export const ConversationListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="divide-y divide-gray-50 animate-pulse" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-gray-300 ring-2 ring-white" />
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="h-3.5 bg-gray-200 rounded w-24" />
              <div className="h-2.5 bg-gray-100 rounded w-10" />
            </div>
            <div className="h-3 bg-gray-100 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const MessageListSkeleton: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 space-y-4 animate-pulse flex-1 overflow-hidden" aria-hidden="true">
      {/* Received message */}
      <div className="flex items-end gap-2 max-w-sm">
        <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="space-y-1">
          <div className="h-12 w-48 rounded-2xl rounded-bl-xs bg-gray-200" />
          <div className="h-2 w-12 bg-gray-100 rounded" />
        </div>
      </div>

      {/* Sent message */}
      <div className="flex items-end justify-end gap-2 ml-auto max-w-sm">
        <div className="space-y-1 flex flex-col items-end">
          <div className="h-10 w-56 rounded-2xl rounded-br-xs bg-indigo-100" />
          <div className="h-2 w-10 bg-gray-100 rounded" />
        </div>
      </div>

      {/* Received message */}
      <div className="flex items-end gap-2 max-w-md">
        <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="space-y-1">
          <div className="h-16 w-64 rounded-2xl rounded-bl-xs bg-gray-200" />
          <div className="h-2 w-12 bg-gray-100 rounded" />
        </div>
      </div>

      {/* Sent message */}
      <div className="flex items-end justify-end gap-2 ml-auto max-w-sm">
        <div className="space-y-1 flex flex-col items-end">
          <div className="h-14 w-40 rounded-2xl rounded-br-xs bg-indigo-100" />
          <div className="h-2 w-14 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
};

