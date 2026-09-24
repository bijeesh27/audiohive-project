import { useEffect, useState } from "react";
import { worspaceAdminGetUsers, updateWorkspaceUser } from "../../services/authServices";
import InviteUserModal from "../../components/workspaceAdmin/InviteUserModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import Table from "../../components/common/Table";
import type { Column } from "../../components/common/Table";
import {ShieldBan , ShieldCheck, UserMinus} from "lucide-react"
import ActionButton from "../../components/common/ActionButton";

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  status: boolean;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    userId: string;
    username: string;
    action: "status" | "remove";
    newStatus?: boolean;
  }>({ isOpen: false, userId: "", username: "", action: "status" });
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  
  const limit = 5;

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      worspaceAdminGetUsers(page, limit, search)
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
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [page, search]);

  

  useEffect(() => {
  
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search]);

  const handleConfirmAction = async () => {
    setUpdatingUserId(confirmModal.userId);
    try {
      if (confirmModal.action === "status") {
        await updateWorkspaceUser(confirmModal.userId, { status: confirmModal.newStatus });
        setUsers((prev) =>
          prev.map((u) => (u._id === confirmModal.userId ? { ...u, status: confirmModal.newStatus! } : u))
        );
      } else if (confirmModal.action === "remove") {
        await updateWorkspaceUser(confirmModal.userId, { workspaceId: null });
        setUsers((prev) => prev.filter((u) => u._id !== confirmModal.userId));
        
        if (users.length === 1 && page > 1) {
          setPage((p) => Math.max(1, p - 1));
        }
      }
      setConfirmModal({ isOpen: false, userId: "", username: "", action: "status" });
    } catch (err: any) {
      setError(err?.response?.data?.message || `Failed to ${confirmModal.action === "remove" ? "remove" : "update"} user`);
      setConfirmModal({ isOpen: false, userId: "", username: "", action: "status" });
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
      header: "User Role",
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
              icon={user.status === true ? ShieldBan : ShieldCheck}
              label={user.status === true ? "Block User" : "Unblock User"}
              onClick={() =>
            setConfirmModal({
              isOpen: true,
              userId: user._id,
              username: user.username,
              action: "status",
              newStatus: !user.status,
            })
          }
              colorClasses={
                user.status === true
                  ? "bg-amber-50 text-amber-700 hover:bg-amber-100 focus:ring-amber-300"
                  : "bg-green-50 text-green-700 hover:bg-green-100 focus:ring-green-300"
              }
              
            />
            <ActionButton
              icon={UserMinus}
              label="Remove User"
              onClick={() =>
                setConfirmModal({
                  isOpen: true,
                  userId: user._id,
                  username: user.username,
                  action: "remove",
                })
              }
              colorClasses="bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-300"
            />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Users</h1>
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
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            Assign User
          </button>
        </div>
      </div>

      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => {
          setPage(1);
          setSearch('');
        }}
      />

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
        title={
          confirmModal.action === "remove"
            ? "Remove user?"
            : confirmModal.newStatus
            ? "Unblock user?"
            : "Block user?"
        }
        message={
          confirmModal.action === "remove"
            ? `${confirmModal.username} will be removed from the workspace completely.`
            : confirmModal.newStatus
            ? `${confirmModal.username} will regain access to the workspace.`
            : `${confirmModal.username} loses access immediately.`
        }
        confirmLabel={
          confirmModal.action === "remove"
            ? "Remove"
            : confirmModal.newStatus
            ? "Unblock"
            : "Block"
        }
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal({ isOpen: false, userId: "", username: "", action: "status" })}
        isLoading={updatingUserId === confirmModal.userId}
        isDanger={confirmModal.action === "remove" || !confirmModal.newStatus}
      />
    </div>
  );
};

export default Users;
