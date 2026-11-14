import React from 'react';

export const formatConversationTime = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return 'Yesterday';
  }

  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const formatMessageTime = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export const formatDateSeparator = (dateStr: string | Date): string => {
  const date = new Date(dateStr);
  const now = new Date();

  if (isSameDay(date, now)) {
    return 'Today';
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export const isSameDay = (d1Str: string | Date, d2Str: string | Date): boolean => {
  const d1 = new Date(d1Str);
  const d2 = new Date(d2Str);
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};

export const isWithinFiveMinutes = (d1Str: string, d2Str: string): boolean => {
  const d1 = new Date(d1Str).getTime();
  const d2 = new Date(d2Str).getTime();
  return Math.abs(d2 - d1) <= 5 * 60 * 1000;
};

// URL regex for safe linkification without dangerouslySetInnerHTML
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export const renderFormattedContent = (content: string): React.ReactNode => {
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
          className: 'underline decoration-indigo-300 hover:decoration-indigo-500 font-medium break-all',
        },
        part
      );
    }
    return React.createElement('span', { key: index }, part);
  });
};
