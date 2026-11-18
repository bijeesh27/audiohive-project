import React, { useState } from "react";
import { Calendar, RefreshCw, X, ShieldAlert } from "lucide-react";
import type { DashboardQueryParams } from "../../../services/superAdminServices";

export type DateRangePreset = "today" | "7d" | "30d" | "custom";

interface DashboardHeaderProps {
  adminName: string;
  selectedRange: DateRangePreset;
  onRangeChange: (params: DashboardQueryParams) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  lastUpdated?: string;
  customStartDate?: string;
  customEndDate?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
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
      onRangeChange({ range: "custom", startDate: tempStart, endDate: tempEnd });
      setShowCustomModal(false);
    }
  };

  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Just now";

  const ranges: { id: DateRangePreset; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "7d", label: "7D" },
    { id: "30d", label: "30D" },
    { id: "custom", label: "Custom" },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
      {/* Left: Title & One-line greeting */}
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldAlert className="w-3 h-3 text-indigo-600" />
            Root Control
          </span>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          {getGreeting()}, <span className="font-semibold text-gray-700">{adminName || "Super Admin"}</span>. Real-time platform metrics, organization operations, and system health.
        </p>
      </div>

      {/* Right: Date-range controls & Refresh button */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Preset Range Pills */}
        <div className="inline-flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-xs text-xs font-medium">
          {ranges.map((r) => {
            const isActive = selectedRange === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  if (r.id === "custom") {
                    setShowCustomModal(true);
                  } else {
                    onRangeChange({ range: r.id });
                  }
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white font-semibold shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Refresh button with Last Updated */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh dashboard data"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-xs disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-gray-500 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`}
          />
          <span className="hidden sm:inline text-gray-500 text-[11px]">
            {isRefreshing ? "Updating..." : `Updated ${formattedLastUpdated}`}
          </span>
        </button>
      </div>

      {/* Custom Date Range Modal */}
      {showCustomModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-range-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl border border-gray-200 p-5 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h3 id="custom-range-title" className="text-sm font-bold text-gray-900">
                  Select Custom Date Range
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close custom range dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyCustom} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
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
