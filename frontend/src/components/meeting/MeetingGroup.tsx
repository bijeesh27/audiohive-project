import React from "react";
import { MeetingCard } from "./MeetingCard";
import type { MeetingItem, MeetingTab } from "../../types/meetings";

interface MeetingGroupProps {
  tab: MeetingTab;
  meetings: MeetingItem[];
  currentTime: Date;
  onEdit: (meeting: MeetingItem) => void;
  onCancel: (meeting: MeetingItem) => void;
  onDelete: (meeting: MeetingItem) => void;
  onJoin: (meeting: MeetingItem) => void;
}

interface GroupedMeetings {
  key: string;
  label: string;
  items: MeetingItem[];
}

export const MeetingGroup: React.FC<MeetingGroupProps> = ({
  tab,
  meetings,
  currentTime,
  onEdit,
  onCancel,
  onDelete,
  onJoin,
}) => {
  // Format section heading based on date and tab
  const getGroupLabel = (date: Date): { key: string; label: string } => {
    if (tab === "past" || tab === "cancelled") {
      const monthYearKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthYearLabel = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      return { key: monthYearKey, label: monthYearLabel };
    }

    // Upcoming tab grouping: Today, Tomorrow, or Mon, Nov 17
    const today = new Date(currentTime);
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return { key: "today", label: "Today" };
    }
    if (diffDays === 1) {
      return { key: "tomorrow", label: "Tomorrow" };
    }

    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const label = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    return { key, label };
  };

  // Group meetings into contiguous buckets preserving sort order
  const groups: GroupedMeetings[] = [];
  const groupMap = new Map<string, GroupedMeetings>();

  meetings.forEach((meeting) => {
    const date = new Date(meeting.startTime);
    const { key, label } = getGroupLabel(date);

    if (!groupMap.has(key)) {
      const newGroup: GroupedMeetings = { key, label, items: [] };
      groupMap.set(key, newGroup);
      groups.push(newGroup);
    }

    groupMap.get(key)!.items.push(meeting);
  });

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`heading-${group.key}`} className="space-y-3.5">
          {/* Group Header */}
          <div className="flex items-center gap-3">
            <h2
              id={`heading-${group.key}`}
              className="text-xs font-semibold uppercase tracking-wider text-gray-500"
            >
              {group.label}
            </h2>
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-[11px] font-medium text-gray-400">
              {group.items.length} {group.items.length === 1 ? "meeting" : "meetings"}
            </span>
          </div>

          {/* Responsive 3-col Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {group.items.map((meeting) => (
              <MeetingCard
                key={meeting.id || meeting._id}
                meeting={meeting}
                currentTime={currentTime}
                onEdit={onEdit}
                onCancel={onCancel}
                onDelete={onDelete}
                onJoin={onJoin}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

