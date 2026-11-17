import React, { useState } from "react";
import {
  Calendar,
  RefreshCw,
  Building2,
} from "lucide-react";

export type DateRangeOption = "today" | "7d" | "30d" | "custom";

interface DashboardHeaderProps {
  workspaceName: string;
  adminName: string;
  selectedRange: DateRangeOption;
  onRangeChange: (range: DateRangeOption, startDate?: string, endDate?: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  lastUpdated?: string;
  customStartDate?: string;
  customEndDate?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  workspaceName,
  adminName,
  selectedRange,
  onRangeChange,
  onRefresh,
  isRefreshing = false,
  lastUpdated,
  customStartDate,
  customEndDate,
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [tempStart, setTempStart] = useState(customStartDate || "");
  const [tempEnd, setTempEnd] = useState(customEndDate || "");

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempStart && tempEnd) {
      onRangeChange("custom", tempStart, tempEnd);
      setShowCustomModal(false);
    }
  };

  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Just now";

  const ranges: { id: DateRangeOption; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "7d", label: "7 Days" },
    { id: "30d", label: "30 Days" },
    { id: "custom", label: "Custom" },
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
      {/* Left: Title, Workspace Badge, Greeting */}
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <Building2 className="w-3 h-3 text-indigo-600" />
            {workspaceName || "Workspace"}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, <span className="font-semibold text-gray-800">{adminName || "Admin"}</span>. Here is what is happening across your workspace.
        </p>
      </div>

      {/* Right: Date-range Segmented Control & Refresh */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Segmented Control */}
        <div className="inline-flex p-1 bg-white border border-gray-200/90 rounded-xl shadow-xs" role="group" aria-label="Date range selector">
          {ranges.map((r) => {
            const isSelected = selectedRange === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  if (r.id === "custom") {
                    setShowCustomModal(true);
                  } else {
                    onRangeChange(r.id);
                  }
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
                aria-pressed={isSelected}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Refresh Button with Timestamp */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh dashboard data"
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200/90 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
          <span className="hidden sm:inline text-gray-500 text-[11px]">
            Updated <span className="text-gray-700 font-medium">{formattedLastUpdated}</span>
          </span>
        </button>
      </div>

      {/* Custom Date Range Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-sm w-full p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-gray-900">Select Custom Date Range</h3>
            </div>
            <form onSubmit={handleApplyCustom} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-xs"
                >
                  Apply Filter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
