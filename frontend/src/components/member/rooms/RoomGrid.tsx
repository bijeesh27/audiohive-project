import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RoomCard } from "./RoomCard";
import type { MemberRoom } from "../../../types/rooms";

interface RoomGridProps {
  rooms: MemberRoom[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onJoinRoom: (roomId: string) => Promise<void> | void;
  onCardClick: (roomId: string) => void;
}

export const RoomGrid: React.FC<RoomGridProps> = ({
  rooms,
  currentPage,
  totalPages,
  onPageChange,
  onJoinRoom,
  onCardClick,
}) => {
  // Generate page numbers with windowing for clean SaaS pagination
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-8">
      {/* Rooms Grid */}
      <div
        id="rooms-grid"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
      >
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onJoin={onJoinRoom}
            onCardClick={onCardClick}
          />
        ))}
      </div>

      {/* Pagination: rendered ONLY when more than 1 page */}
      {totalPages > 1 && (
        <nav
          aria-label="Rooms pagination"
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100"
        >
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span>Previous</span>
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((pageItem, index) => {
              if (pageItem === "...") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-xs text-gray-400 select-none"
                  >
                    ...
                  </span>
                );
              }

              const isCurrent = pageItem === currentPage;
              return (
                <button
                  key={pageItem}
                  type="button"
                  onClick={() => onPageChange(pageItem)}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`min-w-[32px] h-8 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 ${
                    isCurrent
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {pageItem}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
};

