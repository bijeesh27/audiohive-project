import React, { useState, useEffect } from 'react';
import { Search, X, Filter, RotateCcw } from 'lucide-react';

export interface FilterState {
  q: string;
  tab: 'all' | 'unread' | 'pinned';
  type: string;
  range: string;
  sort: 'newest' | 'oldest';
}

interface AnnouncementFiltersProps {
  filters: FilterState;
  counts: {
    all: number;
    unread: number;
    pinned: number;
  };
  onFilterChange: (updates: Partial<FilterState>) => void;
  onClearFilters: () => void;
}

export const AnnouncementFilters: React.FC<AnnouncementFiltersProps> = ({
  filters,
  counts,
  onFilterChange,
  onClearFilters,
}) => {
  const [localSearch, setLocalSearch] = useState(filters.q);

  useEffect(() => {
    setLocalSearch(filters.q);
  }, [filters.q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.q) {
        onFilterChange({ q: localSearch });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, filters.q, onFilterChange]);

  const hasActiveFilters =
    filters.q.trim() !== '' ||
    filters.tab !== 'all' ||
    filters.type !== 'all' ||
    filters.range !== 'all' ||
    filters.sort !== 'newest';

  const tabs: { id: FilterState['tab']; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'unread', label: 'Unread', count: counts.unread },
    { id: 'pinned', label: 'Pinned', count: counts.pinned },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-3 sm:p-4 space-y-3">
      {/* Top Row: Search & Segmented Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Segmented Tabs */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl shrink-0">
          {tabs.map((tab) => {
            const isActive = filters.tab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange({ tab: tab.id })}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-pressed={isActive}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by title or content..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50/70 hover:bg-slate-50 focus:bg-white rounded-xl border border-slate-200/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800 placeholder-slate-400 focus:outline-hidden"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onFilterChange({ q: '' });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Dropdowns & Clear Link */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-slate-400 font-medium">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          {/* Type Dropdown */}
          <select
            value={filters.type}
            onChange={(e) => onFilterChange({ type: e.target.value })}
            className="bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="info">Info</option>
            <option value="important">Important</option>
            <option value="urgent">Urgent</option>
            <option value="event">Event</option>
          </select>

          {/* Date Range Dropdown */}
          <select
            value={filters.range}
            onChange={(e) => onFilterChange({ range: e.target.value })}
            className="bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">Any time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={filters.sort}
            onChange={(e) => onFilterChange({ sort: e.target.value as 'newest' | 'oldest' })}
            className="bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline cursor-pointer ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear filters</span>
          </button>
        )}
      </div>
    </div>
  );
};

