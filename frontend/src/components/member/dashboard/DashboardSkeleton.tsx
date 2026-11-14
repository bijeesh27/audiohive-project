import React from "react";

export const DashboardStatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-full flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="h-11 w-11 rounded-xl bg-gray-100" />
            <div className="h-8 w-8 rounded-lg bg-gray-100" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-7 w-16 rounded bg-gray-200" />
            <div className="h-4 w-28 rounded bg-gray-100" />
            <div className="h-3 w-36 rounded bg-gray-100/70" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SectionItemsSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4"
        >
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-gray-200 flex-shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-3 w-48 rounded bg-gray-100" />
            </div>
          </div>
          <div className="h-9 w-20 rounded-xl bg-gray-200 self-stretch sm:self-center flex-shrink-0" />
        </div>
      ))}
    </div>
  );
};

export const AnnouncementsSkeleton: React.FC = () => {
  return (
    <div className="space-y-2.5 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-gray-100 bg-white p-3.5 space-y-2">
          <div className="flex justify-between items-center">
            <div className="h-4 w-16 rounded-full bg-gray-200" />
            <div className="h-3 w-12 rounded bg-gray-100" />
          </div>
          <div className="h-4 w-3/4 rounded bg-gray-200" />
          <div className="h-3 w-full rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
};

export const RecentChatsSkeleton: React.FC = () => {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-3.5">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="h-3.5 w-24 rounded bg-gray-200" />
              <div className="h-3 w-36 rounded bg-gray-100" />
            </div>
          </div>
          <div className="h-3 w-8 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
};
