import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getWorkspace,
  updateWorkspace,
  inviteWorkspaceAdmin,
  blockWorkspace,
  deleteWorkspace,
  getWorkspaceUsers,
  removeWorkspaceUser
} from "../../services/workspaceServices";
import Table from "../../components/common/Table";
import ActionButton from "../../components/common/ActionButton";
import { Pencil, UserCheck, UserPlus, ShieldBan, ShieldCheck, Trash2, ArrowLeft, UserMinus } from "lucide-react";

interface IWorkspace {
  _id: string;
  organizationId: string;
  workspaceName: string;
  slug: string;
  status: "active" | "suspended" | "archived";
  workspaceAdminEmail?: string;
  createdAt: string;
  updatedAt: string;
}

const statusStyles: Record<string, string> = {
  active: "bg-green-50 text-green-600",
  suspended: "bg-yellow-50 text-yellow-600",
  archived: "bg-gray-100 text-gray-500",
};

const WorkspaceDetailsPage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState<IWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Invite/Assign Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Block confirm
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Users Table
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const userLimit = 10;

  const fetchWorkspace = () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    getWorkspace(workspaceId)
      .then((res) => setWorkspace(res.data))
      .then((res)=>console.log(res))
      .catch((err) => setError(err?.response?.data?.message || "Failed to load workspace"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const fetchUsers = () => {
    if (!workspaceId) return;
    setUsersLoading(true);
    getWorkspaceUsers(workspaceId, userPage, userLimit, userSearch)
      .then((res) => {
        setUsers(res.data?.users || []);
        setUserTotalPages(Math.ceil((res.data?.total || 0) / userLimit));
      })
      .catch((err) => console.error("Failed to load users:", err))
      .finally(() => setUsersLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) fetchUsers();
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, userPage, userSearch]);

  // ---- Edit ----
  const openEditModal = () => {
    if (!workspace) return;
    setEditName(workspace.workspaceName);
    setEditSlug(workspace.slug);
    setEditError(null);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (editing) return;
    setShowEditModal(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;
    if (!editName.trim() || !editSlug.trim()) {
      setEditError("Name and Slug are required");
      return;
    }

    setEditing(true);
    setEditError(null);
    try {
      await updateWorkspace(workspace._id, {
        workspaceName: editName,
        slug: editSlug,
      });
      setShowEditModal(false);
      fetchWorkspace();
    } catch (err: any) {
      setEditError(err?.response?.data?.message || "Failed to update workspace");
    } finally {
      setEditing(false);
    }
  };

  // ---- Assign/Reassign Admin ----
  const openInviteModal = () => {
    if (!workspace) return;
    setAdminName("");
    setAdminEmail(workspace.workspaceAdminEmail || "");
    setInviteError(null);
    setShowInviteModal(true);
  };

  const closeInviteModal = () => {
    if (inviting) return;
    setShowInviteModal(false);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;
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
      await inviteWorkspaceAdmin(workspace._id, {
        email: adminEmail.trim(),
        workspaceAdminName: adminName.trim(),
      });
      setShowInviteModal(false);
      fetchWorkspace();
    } catch (err: any) {
      setInviteError(err?.response?.data?.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  // ---- Block / Unblock ----
  const isSuspended = workspace?.status === "suspended";

  const handleBlockToggle = async () => {
    if (!workspace) return;

    setBlocking(true);
    setBlockError(null);

    try {
      await blockWorkspace(workspace._id, isSuspended ? "active" : "suspended");
      setShowBlockConfirm(false);
      fetchWorkspace();
    } catch (err: any) {
      setBlockError(
        err?.response?.data?.message || "Failed to update workspace status"
      );
    } finally {
      setBlocking(false);
    }
  };

  // ---- Remove User ----
  const [showRemoveUserConfirm, setShowRemoveUserConfirm] = useState(false);
  const [userToRemove, setUserToRemove] = useState<any>(null);
  const [removingUser, setRemovingUser] = useState(false);
  const [removeUserError, setRemoveUserError] = useState<string | null>(null);

  const handleRemoveUser = async () => {
    if (!workspace || !userToRemove) return;
    setRemovingUser(true);
    setRemoveUserError(null);
    try {
      await removeWorkspaceUser(workspace._id, userToRemove._id);
      setShowRemoveUserConfirm(false);
      setUserToRemove(null);
      fetchUsers();
    } catch (err: any) {
      setRemoveUserError(err?.response?.data?.message || "Failed to remove user");
    } finally {
      setRemovingUser(false);
    }
  };

  // ---- Delete ----
  const handleDelete = async () => {
    if (!workspace) return;
    if (deleteConfirmText !== workspace.workspaceName) {
      setDeleteError("Type the workspace name exactly to confirm");
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteWorkspace(workspace._id);
      navigate("/organization-owner/workspace");
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message || "Failed to delete workspace");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-500">Loading workspace...</p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-sm text-red-600">{error || "Workspace not found"}</p>
        <button
          onClick={() => navigate("/organization-owner/workspaces")}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Back to Workspaces
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("/organization-owner/workspaces")}
            className="mb-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Workspaces
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-base font-semibold text-gray-700">
              {workspace.workspaceName.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-xl font-semibold text-gray-900">{workspace.workspaceName}</h1>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${
                statusStyles[workspace.status] ?? "bg-gray-100 text-gray-500"
              }`}
            >
              {workspace.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActionButton
            icon={Pencil}
            label="Edit"
            onClick={openEditModal}
            colorClasses="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          />
          <ActionButton
            icon={workspace.workspaceAdminEmail ? UserCheck : UserPlus}
            label={workspace.workspaceAdminEmail ? "Reassign Admin" : "Assign Admin"}
            onClick={openInviteModal}
            colorClasses="border border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50"
          />
          <ActionButton
            icon={isSuspended ? ShieldCheck : ShieldBan}
            label={isSuspended ? "Unblock" : "Block"}
            onClick={() => { setBlockError(null); setShowBlockConfirm(true); }}
            colorClasses="border border-yellow-300 bg-white text-yellow-700 hover:bg-yellow-50"
          />
          <ActionButton
            icon={Trash2}
            label="Delete"
            onClick={() => { setDeleteError(null); setDeleteConfirmText(""); setShowDeleteConfirm(true); }}
            colorClasses="border border-red-300 bg-white text-red-700 hover:bg-red-50"
          />
        </div>
      </div>

      {/* Details Card */}
      <div className="grid grid-cols-1 gap-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:grid-cols-2">
        <div>
          <p className="text-xs text-gray-400">Slug</p>
          <p className="mt-1 text-sm font-mono text-gray-800">{workspace.slug}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Admin Email</p>
          <p className="mt-1 text-sm text-gray-800">
            {workspace.workspaceAdminEmail || <span className="italic text-gray-400">Unassigned</span>}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Organization ID</p>
          <p className="mt-1 break-all text-sm text-gray-800">{workspace.organizationId}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Workspace ID</p>
          <p className="mt-1 break-all text-sm text-gray-800">{workspace._id}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Created</p>
          <p className="mt-1 text-sm text-gray-800">
            {new Date(workspace.createdAt).toLocaleString("en-IN")}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Last Updated</p>
          <p className="mt-1 text-sm text-gray-800">
            {new Date(workspace.updatedAt).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Workspace Users</h2>
          <input
            type="text"
            placeholder="Search users..."
            value={userSearch}
            onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
            className="w-52 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        
        <Table
          columns={[
            { header: "Name", render: (u) => <span className="text-sm font-medium text-gray-900">{u.username}</span> },
            { header: "Email", render: (u) => <span className="text-sm text-gray-500">{u.email}</span> },
            { header: "Role", render: (u) => <span className="text-sm text-gray-500 capitalize">{u.role}</span> },
            { header: "Status", render: (u) => (
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${u.isBlocked ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {u.isBlocked ? "Blocked" : "Active"}
                </span>
            )},
            { header: "Action", render: (u) => (
                <button
                  onClick={() => { setUserToRemove(u); setShowRemoveUserConfirm(true); setRemoveUserError(null); }}
                  className="rounded-md p-1.5 text-red-500 hover:bg-red-50 focus:outline-none"
                  title="Remove from Workspace"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
            )},
          ]}
          data={users}
          keyExtractor={(u) => u._id}
          loading={usersLoading}
          emptyMessage="No users found in this workspace."
          page={userPage}
          totalPages={userTotalPages}
          onPageChange={setUserPage}
        />
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">Edit Workspace</h2>
            <p className="mt-1 text-sm text-gray-500">
              Update details for <strong>{workspace.workspaceName}</strong>.
            </p>

            <form noValidate onSubmit={handleEditSubmit} className="mt-5 space-y-4">
              {editError && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{editError}</div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Workspace Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Slug</label>
                <input
                  type="text"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
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

      {/* Assign/Reassign Admin Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">
              {workspace.workspaceAdminEmail ? "Reassign" : "Assign"} Workspace Admin
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Send an invitation to manage <strong>{workspace.workspaceName}</strong>.
            </p>

            <form noValidate onSubmit={handleInviteSubmit} className="mt-5 space-y-4">
              {inviteError && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{inviteError}</div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Admin Name</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Admin Email</label>
                <input
                  type="text"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
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

      {/* Block/Unblock Confirm */}
      {showBlockConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">
              {isSuspended ? "Unblock Workspace" : "Block Workspace"}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {isSuspended
                ? `This will restore access for "${workspace.workspaceName}".`
                : `This will suspend access for "${workspace.workspaceName}". Users won't be able to use it until unblocked.`}
            </p>

            {blockError && (
              <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{blockError}</div>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setShowBlockConfirm(false)}
                disabled={blocking}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBlockToggle}
                disabled={blocking}
                className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
              >
                {blocking ? "Working..." : isSuspended ? "Unblock" : "Block"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-red-700">Delete Workspace</h2>
            <p className="mt-2 text-sm text-gray-500">
              This permanently deletes <strong>{workspace.workspaceName}</strong> and cannot be undone.
              Type the workspace name to confirm.
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={workspace.workspaceName}
              className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />

            {deleteError && (
              <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{deleteError}</div>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || deleteConfirmText !== workspace.workspaceName}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Workspace"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove User Confirm */}
      {showRemoveUserConfirm && userToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-red-700">Remove User</h2>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to remove <strong>{userToRemove.username}</strong> from this workspace?
            </p>

            {removeUserError && (
              <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{removeUserError}</div>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => { setShowRemoveUserConfirm(false); setUserToRemove(null); }}
                disabled={removingUser}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveUser}
                disabled={removingUser}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {removingUser ? "Removing..." : "Remove User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDetailsPage;