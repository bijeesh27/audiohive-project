import { useEffect, useState } from "react";
import { getMyWorkspaces } from "../../services/workspaceServices";
import Button from "../../components/common/Button";

interface IWorkspace {
  _id: string;
  workspaceName: string;
  slug: string;
  status: "active" | "suspended" | "archived";
  createdAt: string;
}

const statusStyles: Record<string, string> = {
  active: "bg-green-50 text-green-600",
  suspended: "bg-yellow-50 text-yellow-600",
  archived: "bg-gray-100 text-gray-500",
};

const Workspaces = () => {
  const [workspaces, setWorkspaces] = useState<IWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      getMyWorkspaces(page, limit, search)
        .then((res) => {
          if (!cancelled) {
            setWorkspaces(res.data.workspaces);
            setTotalPages(Math.ceil(res.data.total / limit));
          }
        })
        .catch((err) => console.error("Failed to fetch workspaces:", err))
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 400);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [page, search]);

  useEffect(() => { setPage(1); }, [search]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Workspaces</h1>
          <p className="mt-1 text-sm text-gray-500">All workspaces under your organization.</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search workspace..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-52 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <a href="/organization-owner/create-workspace">
            <Button label="Add Workspace" />
          </a>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Workspace
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Slug
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Created
                </th>
              </tr>
            </thead>

            <tbody>
              {!loading && workspaces.map((workspace) => (
                <tr
                  key={workspace._id}
                  className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                >
                  {/* Workspace Name */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700">
                        {workspace.workspaceName?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {workspace.workspaceName}
                      </span>
                    </div>
                  </td>

                  {/* Slug */}
                  <td className="px-5 py-4 text-sm font-mono text-gray-500">
                    {workspace.slug}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${
                        statusStyles[workspace.status] ?? "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {workspace.status}
                    </span>
                  </td>

                  {/* Created At */}
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {new Date(workspace.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Loading */}
        {loading && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">Loading workspaces...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && workspaces.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-gray-900">No workspaces yet</p>
            <p className="mt-1 text-xs text-gray-500">
              Click "Add Workspace" to create your first workspace.
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && workspaces.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Workspaces;