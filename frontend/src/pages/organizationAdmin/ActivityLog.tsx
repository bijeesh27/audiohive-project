import { useEffect, useState } from "react";
import Table from "../../components/common/Table";
import type { Column } from "../../components/common/Table";
import { getOrganizationActivityLogs } from "../../services/activityServices";
import { getMyOrganization } from "../../services/organizationServices";
import type { ActivityLogItem } from "../../utils/activityLogUtils";
import { formatAction, getActorDisplay } from "../../utils/activityLogUtils";

const ROLE_COLOR_MAP: Record<string, string> = {
  workspaceadmin: "bg-blue-50 text-blue-700 border border-blue-200",
  "organization-owner": "bg-purple-50 text-purple-700 border border-purple-200",
  superadmin: "bg-red-50 text-red-700 border border-red-200",
  member: "bg-gray-100 text-gray-700 border border-gray-200",
};

export default function OrganizationActivityLog() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const limit = 10;

  useEffect(() => {
    getMyOrganization()
      .then((res) => {
        const orgId = res?.data?._id ?? res?.data?.organizationId ?? null;
        setOrganizationId(orgId);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!organizationId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      getOrganizationActivityLogs(organizationId, { page, limit, search: search.trim() || undefined })
        .then((res) => {
          if (!cancelled && res?.data) {
            setLogs(res.data.logs ?? []);
            setTotalPages(res.data.totalPages || 1);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err?.response?.data?.message || "Failed to load activity logs");
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [organizationId, page, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const columns: Column<ActivityLogItem>[] = [
    {
      header: "Action",
      render: (log) => (
        <span className="font-semibold text-gray-900 text-sm">
          {formatAction(log.action)}
        </span>
      ),
    },
    {
      header: "Actor",
      render: (log) => {
        const actor = getActorDisplay(log);
        const initial = actor.name ? actor.name.charAt(0).toUpperCase() : "S";
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700">
              {initial}
            </div>
            <div>
              <span className="text-sm font-medium text-gray-900 block">{actor.name}</span>
              {actor.email && (
                <span className="text-xs text-gray-500 block">{actor.email}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: "Role",
      render: (log) => {
        if (!log.actorRole) {
          return <span className="text-xs text-gray-400">—</span>;
        }
        const colorClasses =
          ROLE_COLOR_MAP[log.actorRole] ?? "bg-gray-100 text-gray-700 border border-gray-200";
        return (
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${colorClasses}`}>
            {log.actorRole.replace("-", " ")}
          </span>
        );
      },
    },
    {
      header: "Date & Time",
      render: (log) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {new Date(log.occurredAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Activity Logs</h1>
          <p className="mt-1 text-sm text-gray-500">
            {loading ? "Loading..." : `Page ${page} of ${totalPages || 1}`}
          </p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-4">
          <input
            type="text"
            placeholder="Search action, actor, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={logs}
        keyExtractor={(log) => log._id}
        loading={loading}
        error={error}
        emptyMessage="No activity logs found."
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
