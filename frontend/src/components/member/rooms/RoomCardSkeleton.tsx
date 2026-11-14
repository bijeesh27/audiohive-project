import React from "react";

interface RoomCardSkeletonProps {
  count?: number;
}

export const RoomCardSkeleton: React.FC<RoomCardSkeletonProps> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs animate-pulse flex flex-col justify-between h-[232px]"
          aria-hidden="true"
        >
          {/* Top row */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 bg-gray-200 rounded-md w-28" />
                  <div className="h-2.5 bg-gray-100 rounded-md w-16" />
                </div>
              </div>
              <div className="h-6 w-14 bg-gray-100 rounded-full flex-shrink-0" />
            </div>

            {/* Description */}
            <div className="space-y-2 mt-4">
              <div className="h-3 bg-gray-100 rounded-md w-full" />
              <div className="h-3 bg-gray-100 rounded-md w-4/5" />
            </div>
          </div>

          {/* Bottom section */}
          <div className="space-y-3.5 pt-3 border-t border-gray-50">
            {/* Participants */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                <div className="w-5 h-5 rounded-full bg-gray-200 ring-2 ring-white" />
                <div className="w-5 h-5 rounded-full bg-gray-200 ring-2 ring-white" />
              </div>
              <div className="h-3 bg-gray-100 rounded-md w-20" />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2">
              <div className="h-6 w-16 bg-gray-100 rounded-full" />
              <div className="h-8 w-18 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

