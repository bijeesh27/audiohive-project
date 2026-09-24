import { useEffect, useState, useCallback } from "react";
import { organizationOwnerGetUsers, updateUser } from "../../services/authServices";
import ConfirmModal from "../../components/common/ConfirmModal";
import Table from "../../components/common/Table";
import type { Column } from "../../components/common/Table";
import ActionButton from "../../components/common/ActionButton";
import { ShieldBan, ShieldCheck } from "lucide-react";

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  status: boolean;
  workspaceId?: {
    _id: string;
    workspaceName: string;
  };
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
  const limit = 10;

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
    } catch (err: any) {
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
      render: (user) => (
        <span className="text-sm font-medium text-indigo-600">
          {user.workspaceId?.workspaceName || "Unknown"}
        </span>
      ),
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
