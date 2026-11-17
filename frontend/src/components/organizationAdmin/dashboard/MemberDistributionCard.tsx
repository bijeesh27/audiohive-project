import React from "react";
import { Users } from "lucide-react";
import type { MemberDistributionItem } from "../../../services/organizationServices";

interface MemberDistributionCardProps {
  showChart?: boolean;
  items?: MemberDistributionItem[];
  loading?: boolean;
}

const BAR_COLORS = [
  "bg-indigo-600",
  "bg-purple-600",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-blue-500",
  "bg-gray-400",
];

export const MemberDistributionCard: React.FC<MemberDistributionCardProps> = ({
  showChart = false,
  items = [],
  loading = false,
}) => {
  // If only 1 workspace or empty, cleanly hide it! (No one-segment 100% donut!)
  if (!showChart || items.length < 2) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs animate-pulse space-y-3">
        <div className="w-36 h-4 rounded bg-gray-100" />
        <div className="space-y-2">
          <div className="h-6 rounded bg-gray-100" />
          <div className="h-6 rounded bg-gray-100" />
          <div className="h-6 rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">Member Distribution</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Proportion of members across workspaces (top 5 + others)
          </p>
        </div>
        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
          <Users className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item, index) => {
          const colorClass = BAR_COLORS[index % BAR_COLORS.length];
          return (
            <div key={item.workspaceId} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-800 truncate max-w-[200px] sm:max-w-[260px]">
                  {item.workspaceName}
                </span>
                <span className="font-mono text-gray-600 font-semibold text-[11px]">
                  {item.memberCount} <span className="text-gray-400">({item.percentage}%)</span>
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${colorClass}`}
                  style={{ width: `${Math.max(3, item.percentage)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
