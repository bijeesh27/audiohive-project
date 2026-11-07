import React, { useEffect, useState, useCallback } from "react";
import {
  X,
  Activity,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { getUserActivityHistory } from "../../services/workspaceAdminServices";

interface UserActivityHistoryModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ActivityItem {
  _id: string;
  action: string;
  actorName: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

interface UserProfile {
  userId: string;
  username: string;
  email: string;
  role: string;
  status: boolean;
  isOnline: boolean;
}

export const UserActivityHistoryModal: React.FC<UserActivityHistoryModalProps> = ({
  userId,
  isOpen,
  onClose,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchHistory = useCallback(
    async (p = 1) => {
      try {
        setLoading(true);
        const res = await getUserActivityHistory(userId, { page: p, limit: 12 });
        if (res?.data) {
          setProfile(res.data.user);
          setItems(res.data.items || []);
          setPage(res.data.page || 1);
          setTotalPages(res.data.totalPages || 1);
          setTotal(res.data.total || 0);
        }
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    if (isOpen && userId) {
      setPage(1);
      fetchHistory(1);
    }
  }, [isOpen, userId, fetchHistory]);

  if (!isOpen) return null;

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const formatAction = (act: string) => {
    return act
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shadow-xs">
                {profile?.username ? profile.username.slice(0, 2).toUpperCase() : "U"}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white ${
                  profile?.isOnline ? "bg-emerald-500" : "bg-gray-300"
                }`}
                title={profile?.isOnline ? "Online" : "Offline"}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900">
                  {profile?.username || "User Activity History"}
                </h3>
                {profile?.role && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" />
                    {profile.role.replace("-", " ")}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">{profile?.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs text-gray-500">
            <span className="font-semibold text-gray-700 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              Recorded Activities ({total})
            </span>
            <span>Page {page} of {totalPages}</span>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <p className="text-xs">Loading activity logs...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              No activity logs recorded for this member yet.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
              {items.map((item) => (
                <div key={item._id} className="relative group">
                  {/* Timeline dot */}
                  <span className="absolute -left-[19px] top-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-white" />

                  <div className="bg-gray-50/80 hover:bg-gray-50 p-3 rounded-xl border border-gray-100 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <span className="font-semibold text-gray-900">
                        {formatAction(item.action)}
                      </span>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(item.occurredAt)}
                      </span>
                    </div>

                    {item.targetType && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        Target: <span className="font-medium text-gray-700">{item.targetType}</span>
                      </p>
                    )}

                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                      <div className="mt-2 text-[10px] bg-white p-2 rounded-lg border border-gray-100 font-mono text-gray-600 break-words">
                        {JSON.stringify(item.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Showing {items.length} of {total} activities
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchHistory(page - 1)}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-gray-700 px-1">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => fetchHistory(page + 1)}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
