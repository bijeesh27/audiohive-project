import React from "react";

interface MeetingCardSkeletonProps {
  count?: number;
}

export const MeetingCardSkeleton: React.FC<MeetingCardSkeletonProps> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-[236px] rounded-2xl border border-gray-100 bg-white p-5 shadow-xs animate-pulse flex flex-col justify-between"
          aria-hidden="true"
        >
          {/* Top row */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
                <div className="h-6 w-28 bg-gray-100 rounded-lg" />
              </div>
              <div className="h-7 w-7 bg-gray-100 rounded-lg" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2 mt-4">
              <div className="h-4 bg-gray-200 rounded-md w-3/4" />
              <div className="h-3 bg-gray-100 rounded-md w-full" />
            </div>
          </div>

          {/* Meta & Footer */}
          <div className="space-y-3.5 pt-3 border-t border-gray-50">
            {/* Date/Time meta */}
            <div className="flex items-center gap-4">
              <div className="h-3.5 bg-gray-100 rounded w-24" />
              <div className="h-3.5 bg-gray-100 rounded w-32" />
            </div>

            {/* Footer row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-gray-200" />
                <div className="space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-16" />
                  <div className="h-2 bg-gray-100 rounded w-10" />
                </div>
              </div>
              <div className="h-8 w-24 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

