import React, { useState, useRef, useEffect } from 'react';
import { Pin, ChevronDown, ChevronUp, MoreVertical, Eye, EyeOff, Users } from 'lucide-react';
import type { MemberAnnouncement } from '../../services/announcementServices';
import {
  getTypeConfig,
  formatRelativeTime,
  formatFullDateTime,
  renderSafeContent,
} from './announcementUtils';
import { TypeBadge } from './TypeBadge';

interface AnnouncementRowProps {
  announcement: MemberAnnouncement;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
}

export const AnnouncementRow: React.FC<AnnouncementRowProps> = ({
  announcement,
  isExpanded,
  onToggleExpand,
  onMarkAsRead,
  onMarkAsUnread,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const typeConfig = getTypeConfig(announcement.type);
  const TypeIcon = typeConfig.icon;

  const isRead = announcement.isRead;
  const authorInitial = announcement.author?.name?.charAt(0).toUpperCase() || 'A';

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleRowClick = () => {
    onToggleExpand();
  };

  const handleToggleRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (isRead) {
      onMarkAsUnread(announcement.id);
    } else {
      onMarkAsRead(announcement.id);
    }
  };

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-200 border-l-4 ${
        typeConfig.borderColor
      } ${
        !isRead
          ? 'bg-indigo-50/40 border-indigo-200/80 hover:bg-indigo-50/70 shadow-2xs'
          : 'bg-white border-slate-200/80 hover:bg-slate-50/60 shadow-2xs'
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={handleRowClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleRowClick();
          }
        }}
        className="w-full text-left p-3.5 sm:p-4.5 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl"
      >
        <div className="flex items-start gap-2.5 sm:gap-3.5">
          {/* Fixed-width leading slot for unread dot (prevents layout shift) */}
          <div className="w-3 shrink-0 pt-1.5 flex justify-center">
            {!isRead ? (
              <span
                className="w-2.5 h-2.5 rounded-full bg-indigo-600 ring-2 ring-indigo-200 animate-pulse"
                title="Unread"
              />
            ) : (
              <span className="w-2.5 h-2.5" />
            )}
          </div>

          {/* Type Icon Tinted Square */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/60 shadow-2xs ${typeConfig.bgColor}`}
          >
            <TypeIcon className="w-4.5 h-4.5 text-slate-700" />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Header / Badges Row */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`text-sm sm:text-base leading-snug break-words ${
                  !isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
                }`}
              >
                {announcement.title}
              </span>

              {announcement.isPinned && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full shadow-2xs">
                  <Pin className="w-3 h-3 fill-indigo-600" />
                  <span>Pinned</span>
                </span>
              )}

              <TypeBadge type={announcement.type} />
            </div>

            {/* Preview or Expanded Content */}
            {isExpanded ? (
              <div className="mt-2 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border-t border-slate-100 pt-3 transition-opacity">
                {renderSafeContent(announcement.content)}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
                {announcement.content}
              </p>
            )}

            {/* Meta Row: Author, Audience, Time */}
            <div className="flex items-center gap-3 mt-2.5 pt-1 text-xs text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5 text-slate-600">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                  {authorInitial}
                </div>
                <span className="font-medium text-slate-700">{announcement.author.name}</span>
              </div>

              <span>•</span>

              <div className="flex items-center gap-1 text-slate-500">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>{announcement.audience}</span>
              </div>

              <span>•</span>

              <span
                title={formatFullDateTime(announcement.createdAt)}
                className="hover:underline cursor-help"
              >
                {formatRelativeTime(announcement.createdAt)}
              </span>
            </div>
          </div>

          {/* Right Actions: Expand Chevron + Overflow Menu */}
          <div className="flex items-center gap-1 shrink-0 ml-1">
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((prev) => !prev);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                aria-label="More actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20 text-xs">
                  <button
                    type="button"
                    onClick={handleToggleRead}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                  >
                    {isRead ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Mark as unread</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Mark as read</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="p-1 text-slate-400">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
