import React from 'react';
import { Pin } from 'lucide-react';
import type { MemberAnnouncement } from '../../services/announcementServices';
import { AnnouncementRow } from './AnnouncementRow';

interface PinnedSectionProps {
  items: MemberAnnouncement[];
  expandedId: string | null;
  onToggleExpand: (a: MemberAnnouncement) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
}

export const PinnedSection: React.FC<PinnedSectionProps> = ({
  items,
  expandedId,
  onToggleExpand,
  onMarkAsRead,
  onMarkAsUnread,
}) => {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3 pb-3 border-b border-slate-200/80">
      <div className="flex items-center gap-2 px-1">
        <Pin className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
          Pinned Announcements
        </h2>
        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded-full">
          {items.length}
        </span>
      </div>

      <div className="space-y-2.5">
        {items.map((announcement) => (
          <AnnouncementRow
            key={announcement.id}
            announcement={announcement}
            isExpanded={expandedId === announcement.id}
            onToggleExpand={() => onToggleExpand(announcement)}
            onMarkAsRead={onMarkAsRead}
            onMarkAsUnread={onMarkAsUnread}
          />
        ))}
      </div>
    </div>
  );
};
