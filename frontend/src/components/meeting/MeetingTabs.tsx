import React from "react";
import type { MeetingTab, MeetingTabCounts } from "../../types/meetings";

interface MeetingTabsProps {
  currentTab: MeetingTab;
  counts: MeetingTabCounts;
  onTabChange: (tab: MeetingTab) => void;
}

const TABS: { id: MeetingTab; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "cancelled", label: "Cancelled" },
];

export const MeetingTabs: React.FC<MeetingTabsProps> = ({
  currentTab,
  counts,
  onTabChange,
}) => {
  return (
    <div
      role="tablist"
      aria-label="Filter meetings"
      className="flex items-center gap-1 p-1 bg-gray-100/90 rounded-xl overflow-x-auto max-w-full"
    >
      {TABS.map((tab) => {
        const isActive = currentTab === tab.id;
        const count = counts[tab.id] ?? 0;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 cursor-pointer ${
              isActive
                ? "bg-white text-gray-900 font-semibold shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
            }`}
          >
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
  );
};

