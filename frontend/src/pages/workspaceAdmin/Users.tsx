import { useEffect, useState } from "react";
import { worspaceAdminGetUsers } from "../../services/authServices";

import UserTable from "../../components/common/UserTables"

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
  const [search,setSearch]=useState('')
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

  return (
    
    <div className="mx-auto max-w-4xl px-6 py-8">
      
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
          <UserTable users={users} />
          
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
    </div>
  );
};

export default Users;