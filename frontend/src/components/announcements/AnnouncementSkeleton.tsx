import React from 'react';

export const AnnouncementSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="space-y-3 animate-pulse" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 border-l-4 border-l-slate-200 flex items-start gap-3 shadow-2xs"
        >
          {/* Leading dot slot placeholder */}
          <div className="w-3 pt-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
          </div>

          {/* Type Icon placeholder */}
          <div className="w-9 h-9 rounded-xl bg-slate-200 shrink-0" />

          {/* Text lines */}
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="h-4 bg-slate-200 rounded w-48" />
              <div className="h-4 bg-slate-100 rounded-full w-14" />
            </div>
            <div className="h-3.5 bg-slate-100 rounded w-5/6" />
            <div className="h-3 bg-slate-100 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
};

