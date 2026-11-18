import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ArrowUpDown,
  ExternalLink,
  Layers,
  Users,
  Video,
} from "lucide-react";
import type { TopOrganizationItem } from "../../../services/superAdminServices";
import { API_ROUTES } from "../../../constants/Api_Routes";

interface TopOrganizationsCardProps {
  organizations?: TopOrganizationItem[];
  loading?: boolean;
}

type SortField = "name" | "workspacesCount" | "membersCount" | "meetingsCount";

export const TopOrganizationsCard: React.FC<TopOrganizationsCardProps> = ({
  organizations = [],
  loading = false,
}) => {
  const [sortField, setSortField] = useState<SortField>("meetingsCount");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs animate-pulse space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div className="w-48 h-4 rounded bg-gray-100" />
          <div className="w-20 h-4 rounded bg-gray-100" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const sortedOrgs = [...organizations].sort((a, b) => {
    const mult = sortAsc ? 1 : -1;
    if (sortField === "name") return mult * a.name.localeCompare(b.name);
    return mult * (a[sortField] - b[sortField]);
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">
              Top Organizations by Activity
            </h2>
          </div>
          <Link
            to={API_ROUTES.SUPER_ADMIN.NAV.ORGANIZATIONS}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
          >
            <span>View all</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-2 mb-3">
          Leading organizations ranked by conducted meetings and member engagement
        </p>

        {sortedOrgs.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No organization activity recorded for this period
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-2.5 pr-4">
                    <button
                      type="button"
                      onClick={() => handleSort("name")}
                      className="inline-flex items-center gap-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Organization</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">
                    <button
                      type="button"
                      onClick={() => handleSort("workspacesCount")}
                      className="inline-flex items-center gap-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Workspaces</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3">
                    <button
                      type="button"
                      onClick={() => handleSort("membersCount")}
                      className="inline-flex items-center gap-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Members</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3">
                    <button
                      type="button"
                      onClick={() => handleSort("meetingsCount")}
                      className="inline-flex items-center gap-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Meetings</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 pl-3 text-right">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedOrgs.map((org) => {
                  const memberRatio =
                    org.memberLimit && org.memberLimit > 0
                      ? `${org.membersCount} / ${org.memberLimit}`
                      : `${org.membersCount}`;

                  const formattedLastActivity = org.lastActivity
                    ? new Date(org.lastActivity).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "No recent logs";

                  return (
                    <tr
                      key={org.id}
                      className="hover:bg-gray-50/70 transition-colors group"
                    >
                      <td className="py-3 pr-4">
                        <Link
                          to={`${API_ROUTES.SUPER_ADMIN.NAV.ORGANIZATIONS}`}
                          className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors block truncate max-w-[180px]"
                          title={org.name}
                        >
                          {org.name}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {org.planName}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-gray-700 font-mono">
                          <Layers className="w-3.5 h-3.5 text-gray-400" />
                          <span>{org.workspacesCount}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-gray-700 font-mono">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span>{memberRatio}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-amber-700 font-mono font-semibold">
                          <Video className="w-3.5 h-3.5 text-amber-500" />
                          <span>{org.meetingsCount}</span>
                        </div>
                      </td>
                      <td className="py-3 pl-3 text-right text-gray-500 text-[11px] whitespace-nowrap">
                        {formattedLastActivity}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
