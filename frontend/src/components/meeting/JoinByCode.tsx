import React, { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { validateMeetingCode } from "../../services/meetingServices";
import type { MeetingItem } from "../../types/meetings";

interface JoinByCodeProps {
  onJoinMeeting: (meeting: MeetingItem) => void;
}

const MEET_CODE_REGEX = /^meet-[a-zA-Z0-9]{4,16}$/i;

export const JoinByCode: React.FC<JoinByCodeProps> = ({ onJoinMeeting }) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = code.trim();
  const isValidFormat = MEET_CODE_REGEX.test(trimmed);
  const showFormatHint = trimmed.length > 0 && !isValidFormat;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidFormat || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await validateMeetingCode(trimmed.toLowerCase());
      const meetingData = res.data.data;
      if (meetingData) {
        setCode("");
        onJoinMeeting(meetingData);
      } else {
        setError("Meeting not found with this code.");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Meeting not found or you do not have permission to join.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError(null);
          }}
          placeholder="meet-xxxxxxx"
          aria-label="Enter meeting code"
          className={`px-3 py-2 bg-white border rounded-xl text-xs text-gray-900 placeholder:text-gray-400 font-mono shadow-xs focus:outline-none focus:ring-2 w-36 sm:w-44 transition-all ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20"
          }`}
        />

        <button
          type="submit"
          disabled={!isValidFormat || loading}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
          <span>Join</span>
        </button>
      </form>

      {/* Inline format helper */}
      {showFormatHint && !error && (
        <p className="absolute left-0 -bottom-4 text-[11px] text-gray-400 font-mono whitespace-nowrap">
          Format: meet-xxxxxxx
        </p>
      )}

      {/* Error text */}
      {error && (
        <div className="absolute left-0 -bottom-5 flex items-center gap-1 text-[11px] text-red-600 font-medium whitespace-nowrap">
          <AlertCircle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

