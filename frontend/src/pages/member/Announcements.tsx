import { useAnnouncementFeed } from '../../components/announcements/useAnnouncementFeed';
import { AnnouncementsHeader } from '../../components/announcements/AnnouncementsHeader';
import { AnnouncementFilters } from '../../components/announcements/AnnouncementFilters';
import { PinnedSection } from '../../components/announcements/PinnedSection';
import { AnnouncementGroup } from '../../components/announcements/AnnouncementGroup';
import { AnnouncementRow } from '../../components/announcements/AnnouncementRow';
import { Pagination } from '../../components/announcements/Pagination';
import { AnnouncementSkeleton } from '../../components/announcements/AnnouncementSkeleton';
import { AnnouncementEmptyState } from '../../components/announcements/AnnouncementEmptyState';
import { NewAnnouncementToast } from '../../components/announcements/NewAnnouncementToast';

export default function MemberAnnouncements() {
  const {
    announcements,
    pinnedSectionItems,
    groupedFeed,
    loading,
    error,
    filters,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasActiveFilters,
    unreadCount,
    pinnedCount,
    isMarkingAllRead,
    hasNewIncoming,
    expandedId,
    updateFilters,
    setPage,
    setPageSize,
    clearFilters,
    handleToggleExpand,
    handleMarkAsRead,
    handleMarkAsUnread,
    handleMarkAllAsRead,
    reloadFirstPage,
    refetch,
  } = useAnnouncementFeed();

  const isInitialLoading = loading && announcements.length === 0;

  return (
    <div className="max-w-[960px] mx-auto py-4 sm:py-6 px-4 sm:px-6 space-y-6">
      {/* Page Header */}
      <AnnouncementsHeader
        unreadCount={unreadCount}
        isMarkingAllRead={isMarkingAllRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />

      {/* Filter Toolbar Card */}
      <AnnouncementFilters
        filters={filters}
        counts={{
          all: totalItems,
          unread: unreadCount,
          pinned: pinnedCount,
        }}
        onFilterChange={updateFilters}
        onClearFilters={clearFilters}
      />

      {/* New Announcement Toast */}
      {hasNewIncoming && <NewAnnouncementToast onRefresh={reloadFirstPage} />}

      {/* Main Content Feed */}
      <div className="relative min-h-[300px]">
        {/* Soft loading indicator overlay during filter / pagination changes */}
        {loading && !isInitialLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-start justify-center pt-12">
            <div className="bg-white border border-slate-200 px-4 py-2 rounded-full shadow-md text-xs font-medium text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              <span>Updating announcements...</span>
            </div>
          </div>
        )}

        {isInitialLoading ? (
          <AnnouncementSkeleton count={5} />
        ) : error ? (
          <AnnouncementEmptyState type="error" errorMessage={error} onRetry={refetch} />
        ) : announcements.length === 0 ? (
          filters.tab === 'unread' ? (
            <AnnouncementEmptyState type="caught-up" />
          ) : hasActiveFilters ? (
            <AnnouncementEmptyState
              type="no-results"
              searchQuery={filters.q}
              onClearFilters={clearFilters}
            />
          ) : (
            <AnnouncementEmptyState type="empty" />
          )
        ) : (
          <div className="space-y-6">
            {/* Pinned Section (Page 1 only & No active filters) */}
            <PinnedSection
              items={pinnedSectionItems}
              expandedId={expandedId}
              onToggleExpand={handleToggleExpand}
              onMarkAsRead={handleMarkAsRead}
              onMarkAsUnread={handleMarkAsUnread}
            />

            {/* Date Grouped Feed */}
            <div className="space-y-6">
              {groupedFeed.map((group) => (
                <AnnouncementGroup
                  key={group.title}
                  title={group.title}
                  count={group.items.length}
                >
                  {group.items.map((announcement) => (
                    <AnnouncementRow
                      key={announcement.id}
                      announcement={announcement}
                      isExpanded={expandedId === announcement.id}
                      onToggleExpand={() => handleToggleExpand(announcement)}
                      onMarkAsRead={handleMarkAsRead}
                      onMarkAsUnread={handleMarkAsUnread}
                    />
                  ))}
                </AnnouncementGroup>
              ))}
            </div>

            {/* Reusable Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>
    </div>
  );
}
