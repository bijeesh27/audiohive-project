import React, { useEffect, useState } from "react";
import { X, CheckCircle2, Clock, Users, User, Shield, AlertCircle, Loader2 } from "lucide-react";
import { getAnnouncementReaders } from "../../services/announcementServices";
import type { AnnouncementReadersResponse, AnnouncementReaderUser } from "../../services/announcementServices";

interface AnnouncementReadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  announcementId: string | null;
  announcementTitle: string;
}

export const AnnouncementReadDrawer: React.FC<AnnouncementReadDrawerProps> = ({
  isOpen,
  onClose,
  announcementId,
  announcementTitle,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnnouncementReadersResponse | null>(null);
  const [tab, setTab] = useState<"read" | "unread">("read");

  useEffect(() => {
    if (!isOpen || !announcementId) {
      setData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getAnnouncementReaders(announcementId)
      .then((res) => {
        if (isMounted) {
          setData(res.data?.data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.response?.data?.message || "Failed to load read tracking data");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, announcementId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalMembers = data?.totalMembers ?? 0;
  const readCount = data?.readCount ?? 0;
  const unreadCount = data?.unreadCount ?? 0;
  const percent = totalMembers > 0 ? Math.round((readCount / totalMembers) * 100) : 0;

  const activeList: AnnouncementReaderUser[] =
    tab === "read" ? data?.readMembers || [] : data?.unreadMembers || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex items-start justify-between">
            <div className="min-w-0 pr-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600 shrink-0" />
                <h2 className="text-base font-semibold text-slate-900">Read Receipts</h2>
              </div>
              <p className="text-xs text-slate-500 truncate mt-1 max-w-xs" title={announcementTitle}>
                {announcementTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="p-6 border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600">Read Progress</span>
              <span className="text-xs font-bold text-slate-900">
                {readCount} of {totalMembers} members ({percent}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                type="button"
                onClick={() => setTab("read")}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  tab === "read"
                    ? "bg-emerald-50/60 border-emerald-200 ring-2 ring-emerald-500/20"
                    : "bg-slate-50/70 border-slate-200 hover:bg-slate-100/70"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-800">Read</span>
                </div>
                <span className="text-sm font-bold text-emerald-700">{readCount}</span>
              </button>

              <button
                type="button"
                onClick={() => setTab("unread")}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  tab === "unread"
                    ? "bg-amber-50/60 border-amber-200 ring-2 ring-amber-500/20"
                    : "bg-slate-50/70 border-slate-200 hover:bg-slate-100/70"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold text-slate-800">Unread</span>
                </div>
                <span className="text-sm font-bold text-amber-700">{unreadCount}</span>
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                <p className="text-xs text-slate-500">Loading readers...</p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center">
                <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-red-800">{error}</p>
              </div>
            ) : activeList.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-sm font-medium text-slate-600">
                  {tab === "read" ? "No members have read this announcement yet" : "All members have read this announcement!"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activeList.map((member) => (
                  <div key={member._id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700 shrink-0">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          member.username?.slice(0, 2).toUpperCase() || <User className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {member.username}
                          </p>
                          {member.role === "workspace-admin" || member.role === "admin" ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-sm text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Shield className="w-2.5 h-2.5" /> Admin
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{member.email}</p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {tab === "read" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Read
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
