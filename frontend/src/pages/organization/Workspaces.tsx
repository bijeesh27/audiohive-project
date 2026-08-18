import { useEffect, useState } from "react";
import { getMyWorkspaces, inviteWorkspaceAdmin } from "../../services/workspaceServices";
import Button from "../../components/common/Button";

interface IWorkspace {
  _id: string;
  workspaceName: string;
  slug: string;
  status: "active" | "suspended" | "archived";
  workspaceAdminEmail?: string;
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

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [assigningWorkspace, setAssigningWorkspace] = useState<IWorkspace | null>(null);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const fetchWorkspaces = () => {
    setLoading(true);
    getMyWorkspaces(page, limit, search)
      .then((res) => {
        setWorkspaces(res.data.workspaces);
        setTotalPages(Math.ceil(res.data.total / limit));
      })
      .catch((err) => console.error("Failed to fetch workspaces:", err))
      .finally(() => setLoading(false));
  };

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

  const openInviteModal = (workspace: IWorkspace) => {
    setAssigningWorkspace(workspace);
    setAdminName("");
    setAdminEmail(workspace.workspaceAdminEmail || "");
    setInviteError(null);
    setShowModal(true);
  };

  const closeInviteModal = () => {
    if (inviting) return;
    setShowModal(false);
    setAssigningWorkspace(null);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningWorkspace) return;

    if (!adminName.trim() || !adminEmail.trim()) {
      setInviteError("Name and Email are required");
      return;
    }

    setInviting(true);
    setInviteError(null);
    try {
      await inviteWorkspaceAdmin(assigningWorkspace._id, {
        email: adminEmail,
        workspaceAdminName: adminName,
      });
      setShowModal(false);
      setAssigningWorkspace(null);
      // Optional: show a success toast here
      fetchWorkspaces();
    } catch (err: any) {
      setInviteError(err?.response?.data?.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

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
                  Admin
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Created
                </th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
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

                  {/* Admin Email */}
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {workspace.workspaceAdminEmail ? (
                      <span className="text-gray-900">{workspace.workspaceAdminEmail}</span>
                    ) : (
                      <span className="text-gray-400 italic">Unassigned</span>
                    )}
                  </td>

                  {/* Created At */}
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {new Date(workspace.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => openInviteModal(workspace)}
                      className="inline-flex items-center justify-center rounded-md border border-indigo-300 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                    >
                      {workspace.workspaceAdminEmail ? "Reassign" : "Assign"}
                    </button>
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

      {/* Invite Modal */}
      {showModal && assigningWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">
              Assign Workspace Admin
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Send an invitation to manage <strong>{assigningWorkspace.workspaceName}</strong>.
            </p>

            <form onSubmit={handleInviteSubmit} className="mt-5 space-y-4">
              {inviteError && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                  {inviteError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Name
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeInviteModal}
                  disabled={inviting}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {inviting ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workspaces;