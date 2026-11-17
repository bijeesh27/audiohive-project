import React, { useState } from "react";
import {
  Calendar,
  RefreshCw,
  Building2,
  X,
} from "lucide-react";
import type { OrgAnalyticsParams } from "../../../services/organizationServices";

export type DateRangePreset = "today" | "7d" | "30d" | "custom";

interface DashboardHeaderProps {
  organizationName: string;
  ownerName: string;
  selectedRange: DateRangePreset;
  onRangeChange: (params: OrgAnalyticsParams) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  lastUpdated?: string;
  customStartDate?: string;
  customEndDate?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  organizationName,
  ownerName,
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
    { id: "7d", label: "7 Days" },
    { id: "30d", label: "30 Days" },
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
      {/* Left: Title, Organization Badge, Greeting in one line */}
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Building2 className="w-3 h-3 text-indigo-500" />
            <span className="truncate max-w-[200px]">{organizationName}</span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          {getGreeting()}, <span className="font-semibold text-gray-700">{ownerName}</span> • Welcome to your organization overview
        </p>
      </div>

      {/* Right: Date-Range Control + Refresh Button */}
      <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
        {/* Preset Pills */}
        <div className="inline-flex items-center bg-white p-1 rounded-xl border border-gray-200/90 shadow-xs">
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
                    onRangeChange({ range: r.id });
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh dashboard data"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200/90 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-xs transition-colors disabled:opacity-50"
          title={`Last updated at ${formattedLastUpdated}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-600" : "text-gray-400"}`} />
          <span className="hidden sm:inline text-[11px] text-gray-500">
            Updated {formattedLastUpdated}
          </span>
        </button>
      </div>

      {/* Custom Date Range Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">Custom Date Range</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyCustom} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                >
                  Apply Range
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
