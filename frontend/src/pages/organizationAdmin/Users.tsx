import { useEffect, useState, useCallback } from "react";
import { organizationOwnerGetUsers, updateUser, updateUserWorkspaces } from "../../services/authServices";
import { getMyWorkspaces } from "../../services/workspaceServices";
import ConfirmModal from "../../components/common/ConfirmModal";
import Table from "../../components/common/Table";
import type { Column } from "../../components/common/Table";
import ActionButton from "../../components/common/ActionButton";
import { Layers, ShieldBan, ShieldCheck } from "lucide-react";

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  status: boolean;
  workspaceIds?: Array<string | {
    _id: string;
    workspaceName: string;
  }>;
  workspaceId?: string | { _id: string; workspaceName: string };
}

interface WorkspaceOption {
  _id: string;
  workspaceName: string;
  status: "active" | "suspended" | "archived";
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    userId: string;
    username: string;
    newStatus: boolean;
  }>({ isOpen: false, userId: "", username: "", newStatus: false });
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [workspaceModalUser, setWorkspaceModalUser] = useState<User | null>(null);
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>([]);
  const [savingWorkspaces, setSavingWorkspaces] = useState(false);
  const limit = 10;

  useEffect(() => {
    getMyWorkspaces(1, 1000)
      .then((res) => setWorkspaces(res.data?.workspaces ?? []))
      .catch(() => setWorkspaces([]));
  }, []);

  const openWorkspaceManager = (user: User) => {
    const currentIds = user.workspaceIds?.map((workspace) =>
      typeof workspace === "string" ? workspace : workspace._id,
    ) ?? [];
    const legacyWorkspace = user.workspaceId;
    if (currentIds.length === 0 && legacyWorkspace) {
      currentIds.push(typeof legacyWorkspace === "string" ? legacyWorkspace : legacyWorkspace._id);
    }
    setSelectedWorkspaceIds(currentIds.filter((id) =>
      workspaces.some((workspace) => workspace._id === id && workspace.status === "active"),
    ));
    setWorkspaceModalUser(user);
  };

  const saveWorkspaceAssignments = async () => {
    if (!workspaceModalUser) return;
    setSavingWorkspaces(true);
    setError(null);
    try {
      await updateUserWorkspaces(workspaceModalUser._id, selectedWorkspaceIds);
      const populated = workspaces
        .filter((workspace) => selectedWorkspaceIds.includes(workspace._id))
        .map(({ _id, workspaceName }) => ({ _id, workspaceName }));
      setUsers((previous) => previous.map((user) =>
        user._id === workspaceModalUser._id
          ? { ...user, workspaceIds: populated, workspaceId: undefined }
          : user,
      ));
      setWorkspaceModalUser(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      setError(err.response?.data?.message || err.message || "Failed to update workspace assignments");
    } finally {
      setSavingWorkspaces(false);
    }
  };

  const fetchUsers = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    organizationOwnerGetUsers(page, limit, debouncedSearch)
      .then((res) => {
        if (!cancelled) {
          setUsers(res.data.users);
          setTotalPages(Math.ceil(res.data.total / limit));
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.message || "Failed to load users");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
      
    return () => {
      cancelled = true;
    };
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    const cleanup = fetchUsers();
    return cleanup;
  }, [fetchUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleConfirmStatusChange = async () => {
    setUpdatingUserId(confirmModal.userId);
    try {
      await updateUser(confirmModal.userId, { status: confirmModal.newStatus });
      setUsers((prev) =>
        prev.map((u) => (u._id === confirmModal.userId ? { ...u, status: confirmModal.newStatus } : u))
      );
      setConfirmModal({ isOpen: false, userId: "", username: "", newStatus: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      setError(err?.response?.data?.message || "Failed to update user status");
      setConfirmModal({ isOpen: false, userId: "", username: "", newStatus: false });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const columns: Column<User>[] = [
    {
      header: "Username",
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-sm font-medium">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-900">{user.username}</span>
        </div>
      ),
    },
    {
      header: "Email",
      render: (user) => (
        <span className="text-sm text-gray-700">{user.email}</span>
      ),
    },
    {
      header: "Workspace",
      render: (user) => {
        const names = user.workspaceIds?.map((workspace) =>
          typeof workspace === "string" ? workspaces.find((item) => item._id === workspace)?.workspaceName : workspace.workspaceName,
        ).filter(Boolean);
        const legacyName = typeof user.workspaceId === "string"
          ? workspaces.find((item) => item._id === user.workspaceId)?.workspaceName
          : user.workspaceId?.workspaceName;
        return (
        <span className="text-sm font-medium text-indigo-600">
          {(names?.length ? names : legacyName ? [legacyName] : []).join(", ") || "Unassigned"}
        </span>
        );
      },
    },
    {
      header: "Role",
      render: (user) => (
        <span className="text-sm font-medium text-gray-900">{user.role}</span>
      ),
    },
    {
      header: "Status",
      render: (user) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            user.status ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          }`}
        >
          {user.status ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (user) => (
        <div className="flex items-center gap-2">
          {user.role === "member" && (
            <ActionButton
              icon={Layers}
              label="Manage workspaces"
              onClick={() => openWorkspaceManager(user)}
              colorClasses="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus:ring-indigo-300"
            />
          )}
          <ActionButton
            icon={user.status ? ShieldBan : ShieldCheck}
            label={user.status ? "Block" : "Unblock"}
            onClick={() =>
              setConfirmModal({
                isOpen: true,
                userId: user._id,
                username: user.username,
                newStatus: !user.status,
              })
            }
            colorClasses={
              user.status
                ? "bg-amber-50 text-amber-700 hover:bg-amber-100 focus:ring-amber-300"
                : "bg-green-50 text-green-700 hover:bg-green-100 focus:ring-green-300"
            }
            disabled={updatingUserId === user._id}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Organization Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            {loading ? "Loading..." : `Page ${page} of ${totalPages || 1}`}
          </p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-4">
          <input
            type="text"
            placeholder="Search username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={users}
        keyExtractor={(u) => u._id}
        loading={loading}
        error={error}
        emptyMessage="No users found."
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {workspaceModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">Manage workspaces</h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose the workspaces {workspaceModalUser.username} can access.
            </p>
            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
              {workspaces.filter((workspace) => workspace.status === "active").map((workspace) => (
                <label key={workspace._id} className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedWorkspaceIds.includes(workspace._id)}
                    onChange={(event) => setSelectedWorkspaceIds((previous) =>
                      event.target.checked
                        ? Array.from(new Set([...previous, workspace._id]))
                        : previous.filter((id) => id !== workspace._id),
                    )}
                  />
                  <span>{workspace.workspaceName}</span>
                </label>
              ))}
              {workspaces.filter((workspace) => workspace.status === "active").length === 0 && (
                <p className="text-sm text-gray-500">No active workspaces are available.</p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setWorkspaceModalUser(null)}
                disabled={savingWorkspaces || selectedWorkspaceIds.length === 0}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
              >Cancel</button>
              <button
                type="button"
                onClick={() => void saveWorkspaceAssignments()}
                disabled={savingWorkspaces}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >{savingWorkspaces ? "Saving..." : "Save assignments"}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.newStatus ? "Unblock user?" : "Block user?"}
        message={
          confirmModal.newStatus
            ? `${confirmModal.username} will regain access to their workspace.`
            : `${confirmModal.username} loses access immediately.`
        }
        confirmLabel={confirmModal.newStatus ? "Unblock" : "Block"}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setConfirmModal({ isOpen: false, userId: "", username: "", newStatus: false })}
        isLoading={updatingUserId === confirmModal.userId}
        isDanger={!confirmModal.newStatus}
      />
    </div>
  );
};

export default Users;

