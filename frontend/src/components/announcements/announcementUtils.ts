import React from 'react';
import { Info, AlertTriangle, AlertOctagon, CalendarDays } from 'lucide-react';

export type AnnouncementType = 'info' | 'important' | 'urgent' | 'event' | 'warning' | 'critical';

export interface TypeConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor: string;
  borderColor: string;
  dotColor: string;
  bgColor: string;
}

export const TYPE_CONFIGS: Record<string, TypeConfig> = {
  info: {
    label: 'Info',
    icon: Info,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    borderColor: 'border-l-blue-500',
    dotColor: 'bg-blue-500',
    bgColor: 'bg-blue-50',
  },
  important: {
    label: 'Important',
    icon: AlertTriangle,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    borderColor: 'border-l-amber-500',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-50',
  },
  warning: {
    label: 'Important',
    icon: AlertTriangle,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    borderColor: 'border-l-amber-500',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-50',
  },
  urgent: {
    label: 'Urgent',
    icon: AlertOctagon,
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
    borderColor: 'border-l-red-500',
    dotColor: 'bg-red-500',
    bgColor: 'bg-red-50',
  },
  critical: {
    label: 'Urgent',
    icon: AlertOctagon,
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
    borderColor: 'border-l-red-500',
    dotColor: 'bg-red-500',
    bgColor: 'bg-red-50',
  },
  event: {
    label: 'Event',
    icon: CalendarDays,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    borderColor: 'border-l-purple-500',
    dotColor: 'bg-purple-500',
    bgColor: 'bg-purple-50',
  },
};

export const getTypeConfig = (type?: string): TypeConfig => {
  const key = (type || 'info').toLowerCase();
  return TYPE_CONFIGS[key] || TYPE_CONFIGS.info;
};

export const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const diffDays = Math.floor(diffSec / 86400);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatFullDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const getAnnouncementDateGroup = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();

  // Reset time to midnight for exact calendar day comparison
  const dMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayDiff = Math.floor((nowMidnight - dMidnight) / (1000 * 60 * 60 * 24));

  if (dayDiff === 0) return 'Today';
  if (dayDiff === 1) return 'Yesterday';
  if (dayDiff < 7) return 'This week';

  // Check if same month and year
  if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
    return 'Earlier this month';
  }

  // Otherwise "Month Year" (e.g. October 2026)
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export const renderSafeContent = (content: string): React.ReactNode => {
  const parts = content.split(URL_REGEX);

  return parts.map((part, index) => {
    if (part.match(URL_REGEX)) {
      return React.createElement(
        'a',
        {
          key: index,
          href: part,
          target: '_blank',
          rel: 'noopener noreferrer',
          onClick: (e: React.MouseEvent) => e.stopPropagation(),
          className:
            'text-indigo-600 underline font-medium hover:text-indigo-800 break-all transition-colors',
        },
        part
      );
    }
    return React.createElement('span', { key: index }, part);
  });
};

