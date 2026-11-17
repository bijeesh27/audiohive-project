import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ShieldCheck,
  Archive,
  AlertTriangle,
} from "lucide-react";
import { API_ROUTES } from "../../../constants/Api_Routes";
import type { WorkspaceHealthItem } from "../../../services/organizationServices";

interface WorkspaceHealthTableProps {
  chips?: {
    active: number;
    archived: number;
    suspended: number;
    total: number;
  };
  workspaces?: WorkspaceHealthItem[];
  loading?: boolean;
}

type SortField = "name" | "status" | "members" | "online" | "rooms" | "meetings" | "lastActivity";

const formatRelativeTime = (iso: string | null | undefined): string => {
  if (!iso) return "No activity";
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    if (diffMs < 0) return "Just now";
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

const StatusBadge: React.FC<{ status: "active" | "archived" | "suspended" }> = ({ status }) => {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Active
        </span>
      );
    case "suspended":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3" />
          Suspended
        </span>
      );
    case "archived":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
          <Archive className="w-3 h-3" />
          Archived
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
          {status}
        </span>
      );
  }
};

export const WorkspaceHealthTable: React.FC<WorkspaceHealthTableProps> = ({
  chips,
  workspaces = [],
  loading = false,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("lastActivity");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleHeaderSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600 inline ml-1 opacity-60" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3 h-3 text-indigo-600 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-600 inline ml-1" />
    );
  };

  const filteredWorkspaces = useMemo(() => {
    let list = [...workspaces];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((w) => w.name.toLowerCase().includes(q) || w.slug.toLowerCase().includes(q));
    }

    if (statusFilter !== "all") {
      list = list.filter((w) => w.status === statusFilter);
    }

    list.sort((a, b) => {
      let valA: string | number = 0;
      let valB: string | number = 0;

      switch (sortField) {
        case "name":
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case "status":
          valA = a.status;
          valB = b.status;
          break;
        case "members":
          valA = a.memberCount;
          valB = b.memberCount;
          break;
        case "online":
          valA = a.onlineNow;
          valB = b.onlineNow;
          break;
        case "rooms":
          valA = a.roomsCount;
          valB = b.roomsCount;
          break;
        case "meetings":
          valA = a.meetingsCount;
          valB = b.meetingsCount;
          break;
        case "lastActivity":
          valA = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
          valB = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
          break;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return list.slice(0, 5); // top 5
  }, [workspaces, search, statusFilter, sortField, sortOrder]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs animate-pulse space-y-4">
        <div className="flex justify-between items-center">
          <div className="w-48 h-5 rounded bg-gray-100" />
          <div className="w-24 h-5 rounded bg-gray-100" />
        </div>
        <div className="h-64 bg-gray-50/70 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between">
      {/* Top Header: Title, Status Chips, Search & "View All" */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">Workspace Health & Activity</h2>
            <span className="text-xs text-gray-400 font-mono">({workspaces.length} total)</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time status, member presence, and interaction metrics across workspaces
          </p>
        </div>

        {/* Compact Status Chips (replaces old tiles) */}
        {chips && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                statusFilter === "active"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{chips.active} Active</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === "suspended" ? "all" : "suspended")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                statusFilter === "suspended"
                  ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                  : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{chips.suspended} Suspended</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === "archived" ? "all" : "archived")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                statusFilter === "archived"
                  ? "bg-gray-700 text-white border-gray-700 shadow-xs"
                  : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{chips.archived} Archived</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-3 py-3">
        <div className="relative w-full max-w-xs">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workspace name..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>

        <Link
          to={API_ROUTES.ORGANIZATION_ADMIN.NAV.WORKSPACES}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex-shrink-0"
        >
          <span>View all workspaces</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/70 select-none">
              <th
                onClick={() => handleHeaderSort("name")}
                className="py-3 px-3 cursor-pointer group hover:text-gray-900 rounded-l-xl"
              >
                Workspace Name {renderSortIndicator("name")}
              </th>
              <th
                onClick={() => handleHeaderSort("status")}
                className="py-3 px-3 cursor-pointer group hover:text-gray-900"
              >
                Status {renderSortIndicator("status")}
              </th>
              <th
                onClick={() => handleHeaderSort("members")}
                className="py-3 px-3 cursor-pointer group hover:text-gray-900 text-right"
              >
                Members {renderSortIndicator("members")}
              </th>
              <th
                onClick={() => handleHeaderSort("online")}
                className="py-3 px-3 cursor-pointer group hover:text-gray-900 text-right"
              >
                Online Now {renderSortIndicator("online")}
              </th>
              <th
                onClick={() => handleHeaderSort("rooms")}
                className="py-3 px-3 cursor-pointer group hover:text-gray-900 text-right"
              >
                Rooms {renderSortIndicator("rooms")}
              </th>
              <th
                onClick={() => handleHeaderSort("meetings")}
                className="py-3 px-3 cursor-pointer group hover:text-gray-900 text-right"
              >
                Meetings {renderSortIndicator("meetings")}
              </th>
              <th
                onClick={() => handleHeaderSort("lastActivity")}
                className="py-3 px-3 cursor-pointer group hover:text-gray-900 text-right rounded-r-xl"
              >
                Last Activity {renderSortIndicator("lastActivity")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredWorkspaces.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  No workspaces found matching the criteria
                </td>
              </tr>
            ) : (
              filteredWorkspaces.map((ws) => (
                <tr key={ws.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-3 font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="block leading-tight">{ws.name}</span>
                        <span className="text-[10px] text-gray-400 block font-mono leading-tight">/{ws.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={ws.status} />
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-gray-800">
                    {ws.memberCount}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {ws.onlineNow > 0 ? (
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {ws.onlineNow}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-mono">0</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-gray-700">
                    {ws.roomsCount}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-gray-700">
                    {ws.meetingsCount}
                  </td>
                  <td className="py-3 px-3 text-right text-gray-500">
                    {formatRelativeTime(ws.lastActivityAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
