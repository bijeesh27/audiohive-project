import React, { useState } from "react";
import { Calendar, ChevronRight } from "lucide-react";

export type DateRangePreset = "today" | "7d" | "30d" | "custom";

interface DateRangeFilterProps {
  currentRange: DateRangePreset;
  startDate?: string;
  endDate?: string;
  onRangeChange: (range: DateRangePreset, startDate?: string, endDate?: string) => void;
  className?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  currentRange,
  startDate,
  endDate,
  onRangeChange,
  className = "",
}) => {
  const [customStart, setCustomStart] = useState<string>(
    startDate ? startDate.slice(0, 10) : new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  );
  const [customEnd, setCustomEnd] = useState<string>(
    endDate ? endDate.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [showCustomInputs, setShowCustomInputs] = useState<boolean>(currentRange === "custom");

  const handlePresetClick = (preset: DateRangePreset) => {
    if (preset === "custom") {
      setShowCustomInputs(true);
      onRangeChange("custom", customStart, customEnd);
    } else {
      setShowCustomInputs(false);
      onRangeChange(preset);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      onRangeChange("custom", customStart, customEnd);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Preset Pills */}
      <div className="inline-flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-medium">
        <button
          type="button"
          onClick={() => handlePresetClick("today")}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            currentRange === "today"
              ? "bg-white text-gray-900 font-semibold shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => handlePresetClick("7d")}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            currentRange === "7d"
              ? "bg-white text-gray-900 font-semibold shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Last 7 Days
        </button>
        <button
          type="button"
          onClick={() => handlePresetClick("30d")}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            currentRange === "30d"
              ? "bg-white text-gray-900 font-semibold shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Last 30 Days
        </button>
        <button
          type="button"
          onClick={() => handlePresetClick("custom")}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
            currentRange === "custom"
              ? "bg-white text-gray-900 font-semibold shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Custom
        </button>
      </div>

      {/* Custom Date Range Popover/Inputs */}
      {showCustomInputs && (
        <form
          onSubmit={handleApplyCustom}
          className="flex flex-wrap items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-xs text-xs"
        >
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="border border-gray-200 rounded-md px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="border border-gray-200 rounded-md px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-colors"
          >
            Apply
            <ChevronRight className="w-3 h-3" />
          </button>
        </form>
      )}
    </div>
  );
};

