import React from "react";
import { ArrowUpDown } from "lucide-react";
import type { RoomTypeFilter, RoomSortOption, RoomTabCounts } from "../../../types/rooms";

interface RoomFiltersProps {
  currentTab: RoomTypeFilter;
  currentSort: RoomSortOption;
  counts: RoomTabCounts;
  onTabChange: (tab: RoomTypeFilter) => void;
  onSortChange: (sort: RoomSortOption) => void;
}

const TABS: { id: RoomTypeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "public", label: "Public" },
  { id: "private", label: "Private" },
  { id: "live", label: "Live now" },
];

export const RoomFilters: React.FC<RoomFiltersProps> = ({
  currentTab,
  currentSort,
  counts,
  onTabChange,
  onSortChange,
}) => {
  const getTabCount = (tabId: RoomTypeFilter): number => {
    switch (tabId) {
      case "all":
        return counts.all;
      case "public":
        return counts.public;
      case "private":
        return counts.private;
      case "live":
        return counts.live;
      default:
        return 0;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-1 border-b border-gray-100">
      {/* Segmented Tabs */}
      <div
        role="tablist"
        aria-label="Filter rooms by type"
        className="flex items-center gap-1 p-1 bg-gray-100/90 rounded-xl overflow-x-auto max-w-full"
      >
        {TABS.map((tab) => {
          const isActive = currentTab === tab.id;
          const count = getTabCount(tab.id);

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls="rooms-grid"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 ${
                isActive
                  ? "bg-white text-gray-900 font-semibold shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
              }`}
            >
              {tab.id === "live" && count > 0 && (
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              )}

              <span>{tab.label}</span>

              <span
                className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-semibold rounded-full min-w-[18px] transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-gray-200/70 text-gray-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <label htmlFor="room-sort-select" className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
          <span>Sort by</span>
        </label>
        <select
          id="room-sort-select"
          value={currentSort}
          aria-label="Sort rooms"
          onChange={(e) => onSortChange(e.target.value as RoomSortOption)}
          className="rounded-xl border border-gray-200 bg-white py-1.5 pl-2.5 pr-8 text-xs font-medium text-gray-700 shadow-xs transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
        >
          <option value="active">Most active</option>
          <option value="newest">Newest</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>
    </div>
  );
};

