import React, { useRef } from "react";
import { MessageSquare, Video, Layout, FileText, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type RoomTabKey = "voice" | "video" | "whiteboard" | "documents" | "participants";

interface TabItem {
  key: RoomTabKey;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface RoomTabsProps {
  activeTab: RoomTabKey;
  onTabChange: (tab: RoomTabKey) => void;
  documentCount?: number;
  participantCount?: number;
}

export const RoomTabs: React.FC<RoomTabsProps> = ({
  activeTab,
  onTabChange,
  documentCount,
  participantCount,
}) => {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs: TabItem[] = [
    { key: "voice", label: "Voice & Group Chat", icon: MessageSquare },
    { key: "video", label: "Meeting & Video", icon: Video },
    { key: "whiteboard", label: "Collaborative Whiteboard", icon: Layout },
    { key: "documents", label: "Documents", icon: FileText, badge: documentCount },
    { key: "participants", label: "Participants", icon: Users, badge: participantCount },
  ];

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex: number;
    if (e.key === "ArrowRight") {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextTab = tabs[nextIndex];
    if (nextTab) {
      onTabChange(nextTab.key);
      tabsRef.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white rounded-t-2xl px-2 sm:px-4">
      <div
        role="tablist"
        aria-label="Room navigation tabs"
        className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-1"
      >
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;

          return (
            <button
              key={tab.key}
              ref={(el) => {
                tabsRef.current[idx] = el;
              }}
              role="tab"
              id={`tab-${tab.key}`}
              aria-controls={`panel-${tab.key}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.key)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`relative inline-flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg cursor-pointer ${
                isActive ? "text-indigo-600 font-semibold" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-gray-400"}`} />
              <span>{tab.label}</span>

              {typeof tab.badge === "number" && tab.badge > 0 && (
                <span
                  className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.badge}
                </span>
              )}

              {/* Active Tab Underline Indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default RoomTabs;

