import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getMyWorkspaces, inviteWorkspaceAdmin, updateWorkspace } from "../../services/workspaceServices";
import Button from "../../components/common/Button";
import Table from "../../components/common/Table";
import type { Column } from "../../components/common/Table";
import ActionButton from "../../components/common/ActionButton";
import { Eye } from "lucide-react";

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
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState<IWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const limit = 10;

  // Invite Modal State
  const [showModal, setShowModal] = useState(false);
  const [assigningWorkspace, setAssigningWorkspace] = useState<IWorkspace | null>(null);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<IWorkspace | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    getMyWorkspaces(page, limit, debouncedSearch)
      .then((res) => {
        if (!cancelled) {
          setWorkspaces(res.data.workspaces);
          setTotalPages(Math.ceil(res.data.total / limit));
        }
      })
      .catch((err) => console.error("Failed to fetch workspaces:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
      
    return () => {
      cancelled = true;
    };
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    const cleanup = fetchWorkspaces();
    return cleanup;
  }, [fetchWorkspaces]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const goToDetails = (workspaceId: string) => {
    navigate(`/organization-owner/getworkspace/${workspaceId}`);
  };

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

    if (!adminName.trim()) {
      setInviteError("Admin name is required");
      return;
    }
    if (!adminEmail.trim()) {
      setInviteError("Admin email is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(adminEmail.trim())) {
      setInviteError("Please enter a valid email address");
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
      fetchWorkspaces();
    } catch (err: any) {
      setInviteError(err?.response?.data?.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const openEditModal = (workspace: IWorkspace) => {
    setEditingWorkspace(workspace);
    setEditName(workspace.workspaceName);
    setEditSlug(workspace.slug);
    setEditError(null);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (editing) return;
    setShowEditModal(false);
    setEditingWorkspace(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkspace) return;

    if (!editName.trim() || !editSlug.trim()) {
      setEditError("Name and Slug are required");
      return;
    }

    setEditing(true);
    setEditError(null);
    try {
      await updateWorkspace(editingWorkspace._id, {
        workspaceName: editName,
        slug: editSlug,
      });
      setShowEditModal(false);
      setEditingWorkspace(null);
      fetchWorkspaces();
    } catch (err: any) {
      setEditError(err?.response?.data?.message || "Failed to update workspace");
    } finally {
      setEditing(false);
    }
  };

  const columns: Column<IWorkspace>[] = [
    {
      header: "Workspace",
      render: (ws) => (
        <button
          type="button"
          onClick={() => goToDetails(ws._id)}
          className="flex items-center gap-3 text-left hover:underline"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700">
            {ws.workspaceName?.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-900">{ws.workspaceName}</span>
        </button>
      ),
    },
    {
      header: "Slug",
      render: (ws) => (
        <span className="text-sm font-mono text-gray-500">{ws.slug}</span>
      ),
    },
    {
      header: "Status",
      render: (ws) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${
            statusStyles[ws.status] ?? "bg-gray-100 text-gray-500"
          }`}
        >
          {ws.status}
        </span>
      ),
    },
    {
      header: "Admin",
      render: (ws) =>
        ws.workspaceAdminEmail ? (
          <span className="text-sm text-gray-900">{ws.workspaceAdminEmail}</span>
        ) : (
          <span className="text-sm italic text-gray-400">Unassigned</span>
        ),
    },
    {
      header: "Created",
      render: (ws) => (
        <span className="text-sm text-gray-500">
          {new Date(ws.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (ws) => (
        <div className="flex items-center justify-end gap-2">
          <ActionButton
            icon={Eye}
            label="View"
            onClick={() => goToDetails(ws._id)}
            colorClasses="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 focus:ring-indigo-300"
          />
        </div>
      ),
    },
  ];

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

      <Table
        columns={columns}
        data={workspaces}
        keyExtractor={(ws) => ws._id}
        loading={loading}
        emptyMessage="No workspaces yet."
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Invite Modal */}
      {showModal && assigningWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">Assign Workspace Admin</h2>
            <p className="mt-1 text-sm text-gray-500">
              Send an invitation to manage <strong>{assigningWorkspace.workspaceName}</strong>.
            </p>

            <form noValidate onSubmit={handleInviteSubmit} className="mt-5 space-y-4">
              {inviteError && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{inviteError}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                <input
                  type="text"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

      {/* Edit Modal */}
      {showEditModal && editingWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">Edit Workspace</h2>
            <p className="mt-1 text-sm text-gray-500">
              Update details for <strong>{editingWorkspace.workspaceName}</strong>.
            </p>

            <form noValidate onSubmit={handleEditSubmit} className="mt-5 space-y-4">
              {editError && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{editError}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workspace Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="My Workspace"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  placeholder="my-workspace"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={editing}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {editing ? "Saving..." : "Save Changes"}
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