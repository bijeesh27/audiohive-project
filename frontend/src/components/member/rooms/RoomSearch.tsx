import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

interface RoomSearchProps {
  initialValue: string;
  onSearchChange: (query: string) => void;
  debounceMs?: number;
}

export const RoomSearch: React.FC<RoomSearchProps> = ({
  initialValue,
  onSearchChange,
  debounceMs = 300,
}) => {
  const [value, setValue] = useState(initialValue);

  // Sync internal state when external initialValue changes (e.g., URL change, back/forward)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Debounce the change notification
  useEffect(() => {
    const handler = setTimeout(() => {
      if (value !== initialValue) {
        onSearchChange(value);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [value, debounceMs, onSearchChange, initialValue]);

  const handleClear = () => {
    setValue("");
    onSearchChange("");
  };

  return (
    <div className="relative w-full sm:w-72">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
        <Search className="h-4 w-4" aria-hidden="true" />
      </div>

      <input
        type="text"
        role="searchbox"
        aria-label="Search rooms"
        placeholder="Search rooms..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 shadow-xs transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      />

      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search query"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

