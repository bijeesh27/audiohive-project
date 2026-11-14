import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useAnnouncementContext } from '../../context/AnnouncementContext';
import {
  getAnnouncements,
  markAsRead as markAsReadAPI,
  markAsUnread as markAsUnreadAPI,
  markAllAsRead as markAllAsReadAPI,
} from '../../services/announcementServices';
import type { MemberAnnouncement } from '../../services/announcementServices';
import type { FilterState } from './AnnouncementFilters';
import { getAnnouncementDateGroup } from './announcementUtils';

export function useAnnouncementFeed() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { socket } = useSocket();
  const { unreadCount: globalUnreadCount, decrementUnread, setUnreadCount, markAllAsReadOptimistic } =
    useAnnouncementContext();

  const [announcements, setAnnouncements] = useState<MemberAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [serverPinnedCount, setServerPinnedCount] = useState(0);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [hasNewIncoming, setHasNewIncoming] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filters: FilterState = useMemo(() => ({
    q: searchParams.get('q') || '',
    tab: (searchParams.get('tab') as FilterState['tab']) || 'all',
    type: searchParams.get('type') || 'all',
    range: searchParams.get('range') || 'all',
    sort: (searchParams.get('sort') as FilterState['sort']) || 'newest',
  }), [searchParams]);

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('limit') || '10', 10);
  const hasActiveFilters = filters.q.trim() !== '' || filters.tab !== 'all' || filters.type !== 'all' || filters.range !== 'all' || filters.sort !== 'newest';

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (!v || v === 'all' || (k === 'sort' && v === 'newest')) next.delete(k);
      else next.set(k, String(v));
    });
    next.set('page', '1');
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const setPage = useCallback((p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const setPageSize = useCallback((size: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('limit', String(size));
    next.set('page', '1');
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const clearFilters = useCallback(() => {
    const next = new URLSearchParams();
    if (pageSize !== 10) next.set('limit', String(pageSize));
    setSearchParams(next);
  }, [pageSize, setSearchParams]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAnnouncements({
        page: currentPage, limit: pageSize, q: filters.q,
        tab: filters.tab, type: filters.type, range: filters.range,
        sort: filters.sort, status: 'published',
      });
      const data = res.data.data;
      const items: MemberAnnouncement[] = data?.announcements || [];
      setAnnouncements(items);
      setTotalItems(data?.total ?? items.length);
      setTotalPages(data?.totalPages ?? 1);
      if (typeof data?.pinnedCount === 'number') setServerPinnedCount(data.pinnedCount);
      if (typeof data?.unreadCount === 'number') setUnreadCount(data.unreadCount);
    } catch {
      setError('Failed to load announcements. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters, setUnreadCount]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  useEffect(() => {
    if (!socket) return;
    const onNew = () => setHasNewIncoming(true);
    const onDelete = ({ announcementId }: { announcementId: string }) => {
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
    };
    socket.on('new-announcement', onNew);
    socket.on('delete-announcement', onDelete);
    return () => {
      socket.off('new-announcement', onNew);
      socket.off('delete-announcement', onDelete);
    };
  }, [socket]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
    decrementUnread();
    try { await markAsReadAPI(id); } catch {
      setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: false } : a)));
      setUnreadCount((c) => c + 1);
    }
  }, [decrementUnread, setUnreadCount]);

  const handleMarkAsUnread = useCallback(async (id: string) => {
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: false } : a)));
    setUnreadCount((c) => c + 1);
    try { await markAsUnreadAPI(id); } catch {
      setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
      decrementUnread();
    }
  }, [decrementUnread, setUnreadCount]);

  const handleMarkAllAsRead = useCallback(async () => {
    if (isMarkingAllRead || globalUnreadCount === 0) return;
    setIsMarkingAllRead(true);
    setAnnouncements((prev) => prev.map((a) => ({ ...a, isRead: true })));
    markAllAsReadOptimistic();
    try { await markAllAsReadAPI(); } catch { fetchAnnouncements(); }
    finally { setIsMarkingAllRead(false); }
  }, [isMarkingAllRead, globalUnreadCount, markAllAsReadOptimistic, fetchAnnouncements]);

  const handleToggleExpand = useCallback((a: MemberAnnouncement) => {
    const next = expandedId === a.id ? null : a.id;
    setExpandedId(next);
    if (next && !a.isRead) handleMarkAsRead(a.id);
  }, [expandedId, handleMarkAsRead]);

  const { pinnedSectionItems, feedItems } = useMemo(() => {
    if (currentPage === 1 && !hasActiveFilters) {
      const pinned = announcements.filter((a) => a.isPinned).slice(0, 3);
      const pinnedIds = new Set(pinned.map((a) => a.id));
      return { pinnedSectionItems: pinned, feedItems: announcements.filter((a) => !pinnedIds.has(a.id)) };
    }
    return { pinnedSectionItems: [], feedItems: announcements };
  }, [announcements, currentPage, hasActiveFilters]);

  const groupedFeed = useMemo(() => {
    const groups: { title: string; items: MemberAnnouncement[] }[] = [];
    feedItems.forEach((item) => {
      const title = getAnnouncementDateGroup(item.createdAt);
      const ex = groups.find((g) => g.title === title);
      if (ex) ex.items.push(item);
      else groups.push({ title, items: [item] });
    });
    return groups;
  }, [feedItems]);

  return {
    announcements, pinnedSectionItems, groupedFeed, loading, error, filters,
    currentPage, pageSize, totalItems, totalPages, hasActiveFilters,
    unreadCount: globalUnreadCount, pinnedCount: serverPinnedCount, isMarkingAllRead,
    hasNewIncoming, expandedId, updateFilters, setPage, setPageSize, clearFilters,
    handleToggleExpand, handleMarkAsRead, handleMarkAsUnread, handleMarkAllAsRead,
    reloadFirstPage: () => { setHasNewIncoming(false); setPage(1); fetchAnnouncements(); },
    refetch: fetchAnnouncements,
  };
}
