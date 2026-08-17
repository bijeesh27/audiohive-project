import { useEffect, useState } from "react";
import { getUsers, updateUser } from "../../services/authServices";

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
  const limit = 5;

  const [confirmUser, setConfirmUser] = useState<User | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      getUsers(page, limit, search)
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

  const handleToggleStatus = async (user: User) => {
    setToggling(true);
    try {
      const newStatus = !user.status;
      await updateUser(user._id, { status: newStatus });
      setUsers(users.map(u =>
        u._id === user._id ? { ...u, status: newStatus } : u
      ));
    } catch (err) {
      console.error("Failed to update user:", err);
    } finally {
      setToggling(false);
      setConfirmUser(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Users
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {loading ? "Loading..." : `Page ${page} of ${totalPages || 1}`}
          </p>
        </div>
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center text-sm text-gray-500 ">
          Loading users...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {users.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white py-12">
              <p className="text-sm text-gray-500">No users found.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Username
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Email
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        User Role
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user._id}
                        className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-sm font-medium">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {user.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-700">
                            {user.email}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-gray-900">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              user.status
                                ? "bg-green-50 text-green-600"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {user.status ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setConfirmUser(user)}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                              user.status
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-green-50 text-green-600 hover:bg-green-100"
                            }`}
                          >
                            {user.status ? "Block" : "Unblock"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </>
      )}

      {confirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-base font-semibold text-gray-900">
              {confirmUser.status ? "Block user?" : "Unblock user?"}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {confirmUser.status
                ? `${confirmUser.username} loses access immediately.`
                : `${confirmUser.username} regains access immediately.`}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmUser(null)}
                disabled={toggling}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleStatus(confirmUser)}
                disabled={toggling}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  confirmUser.status
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {toggling ? "Working..." : confirmUser.status ? "Block" : "Unblock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;