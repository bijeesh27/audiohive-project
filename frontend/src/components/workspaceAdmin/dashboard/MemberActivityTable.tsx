import React, { useState, useEffect, useTransition } from "react";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Users,
} from "lucide-react";
import type { MemberActivityRecord } from "../../../services/workspaceAdminServices";

export type SortField = "logins" | "meetings" | "duration" | "rooms" | "actions" | "name" | "lastActive";

interface MemberActivityTableProps {
  items?: MemberActivityRecord[];
  total: number;
  page: number;
  totalPages: number;
  loading?: boolean;
  onPageChange: (newPage: number) => void;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: "all" | "active" | "disabled") => void;
  onSortChange: (field: SortField, order: "asc" | "desc") => void;
  onRowClick: (userId: string) => void;
  currentSortField: SortField;
  currentSortOrder: "asc" | "desc";
  currentStatusFilter: "all" | "active" | "disabled";
}

const formatRelativeTime = (iso: string | null): string => {
  if (!iso) return "Never";
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 14) return `${diffDays}d ago`;
    return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "–";
  }
};

const formatFullDate = (iso: string | null): string => {
  if (!iso) return "No activity recorded";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

export const MemberActivityTable: React.FC<MemberActivityTableProps> = ({
  items = [],
  total,
  page,
  totalPages,
  loading = false,
  onPageChange,
  onSearchChange,
  onStatusFilterChange,
  onSortChange,
  onRowClick,
  currentSortField,
  currentSortOrder,
  currentStatusFilter,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [, startTransition] = useTransition();

  // Debounce search by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(() => {
        onSearchChange(searchInput);
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput, onSearchChange]);

  const handleHeaderSort = (field: SortField) => {
    if (currentSortField === field) {
      onSortChange(field, currentSortOrder === "asc" ? "desc" : "asc");
    } else {
      onSortChange(field, "desc");
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (currentSortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-gray-300 group-hover:text-gray-500 ml-1 inline-block" />;
    }
    return currentSortOrder === "asc" ? (
      <ArrowUp className="w-3 h-3 text-indigo-600 ml-1 inline-block" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-600 ml-1 inline-block" />
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs">
      {/* ── TABLE CONTROLS ROW ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">Member Activity</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time activity log, meeting attendance, and engagement metrics for workspace members
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search member by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white w-full sm:w-64 transition-all"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <select
              value={currentStatusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as "all" | "active" | "disabled")}
              aria-label="Filter members by account status"
              className="pl-3 pr-8 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700 font-medium cursor-pointer"
            >
              <option value="all">All Accounts</option>
              <option value="active">Active Only</option>
              <option value="disabled">Disabled Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── RESPONSIVE TABLE CONTAINER ── */}
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 font-semibold bg-gray-50/60 uppercase text-[10px] tracking-wider select-none">
              <th
                onClick={() => handleHeaderSort("name")}
                className="py-3 px-3 cursor-pointer group hover:text-gray-900"
              >
                Member {renderSortIndicator("name")}
              </th>
              <th className="py-3 px-3">Presence</th>
              <th className="py-3 px-3">Status</th>
              <th
                onClick={() => handleHeaderSort("lastActive")}
                className="py-3 px-3 cursor-pointer group hover:text-gray-900"
              >
                Last Active {renderSortIndicator("lastActive")}
              </th>
              <th
                onClick={() => handleHeaderSort("logins")}
                className="py-3 px-3 cursor-pointer group hover:text-gray-900 text-right"
              >
                Logins {renderSortIndicator("logins")}
              </th>
              <th
                onClick={() => handleHeaderSort("meetings")}
                className="py-3 px-3 cursor-pointer group hover:text-gray-900 text-right"
              >
                Meetings {renderSortIndicator("meetings")}
              </th>
              <th
                onClick={() => handleHeaderSort("duration")}
                className="py-3 px-3 cursor-pointer group hover:text-gray-900 text-right"
              >
                Time in Meetings {renderSortIndicator("duration")}
              </th>
              <th
                onClick={() => handleHeaderSort("rooms")}
                className="py-3 px-3 cursor-pointer group hover:text-gray-900 text-right"
              >
                Rooms {renderSortIndicator("rooms")}
              </th>
              <th
                onClick={() => handleHeaderSort("actions")}
                className="py-3 px-3 cursor-pointer group hover:text-gray-900 text-right"
              >
                Actions {renderSortIndicator("actions")}
              </th>
              <th className="py-3 px-3 text-right">Details</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={10} className="py-16 text-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                  <span className="text-xs">Loading member activity records...</span>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-14 text-center text-gray-400">
                  <Users className="w-7 h-7 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs font-medium text-gray-600">No members found</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Try adjusting your search query or status filter.</p>
                </td>
              </tr>
            ) : (
              items.map((row) => {
                const initials = row.username.slice(0, 2).toUpperCase();
                return (
                  <tr
                    key={row.userId}
                    onClick={() => onRowClick(row.userId)}
                    className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                  >
                    {/* Member Name & Email */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            {initials}
                          </div>
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                            {row.username}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">{row.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Presence Dot & Badge */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          row.isOnline
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            row.isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                          }`}
                        />
                        {row.isOnline ? "Online" : "Offline"}
                      </span>
                    </td>

                    {/* Account Status Badge */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-md ${
                          row.status
                            ? "text-emerald-700 bg-emerald-50"
                            : "text-gray-500 bg-gray-100"
                        }`}
                      >
                        {row.status ? "Active" : "Disabled"}
                      </span>
                    </td>

                    {/* Last Active with Hover Tooltip */}
                    <td
                      className="py-3 px-3 text-gray-600 font-medium cursor-help"
                      title={formatFullDate(row.lastActiveAt)}
                    >
                      {formatRelativeTime(row.lastActiveAt)}
                    </td>

                    {/* Logins Count */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-gray-800 font-medium">
                      {row.totalLogins}
                    </td>

                    {/* Meetings Attended */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-gray-800 font-medium">
                      {row.meetingsAttended}
                    </td>

                    {/* Time in Meetings */}
                    <td className="py-3 px-3 text-right text-gray-600 font-medium">
                      {row.formattedMeetingDuration || "–"}
                    </td>

                    {/* Accessible Rooms */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-gray-700">
                      {row.roomsCount}
                    </td>

                    {/* Actions Count */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-indigo-700 bg-indigo-50/90 px-2 py-0.5 rounded-md font-mono tabular-nums">
                        {row.activityCount}
                      </span>
                    </td>

                    {/* Row Action: View Drawer */}
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick(row.userId);
                        }}
                        aria-label={`View history and stats for ${row.username}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── PAGINATION CONTROLS ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 text-xs text-gray-500">
        <span>
          Showing <span className="font-semibold text-gray-800">{items.length}</span> of{" "}
          <span className="font-semibold text-gray-800">{total}</span> members
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
            aria-label="Previous page"
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors flex items-center gap-1 font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <span className="font-semibold text-gray-900 px-2">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || loading}
            aria-label="Next page"
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors flex items-center gap-1 font-semibold"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
