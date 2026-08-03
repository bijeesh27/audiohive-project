import { useEffect, useState } from "react";
import { getUsers } from "../../services/authServices";

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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getUsers()
      .then((res) => {
        if (!cancelled) setUsers(res.data);
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
  }, []);

  return (
    
    <div className="mx-auto max-w-4xl px-6 py-8">
      
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Users
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {loading ? "Loading..." : `${users.length} total`}
          </p>
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

      {!loading && !error && <UserTable users={users} />}
    </div>
  );
};

export default Users;