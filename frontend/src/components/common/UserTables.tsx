interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  status: boolean;
}

interface UserTableProps {
  users: User[];
}

const UserTable = ({ users }: UserTableProps) => {
  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white py-12">
        <p className="text-sm text-gray-500">No users found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
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
              className="border-b border-gray-200 last:border-b-0"
            >
              {/* Username */}
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

              {/* Email */}
              <td className="px-5 py-4">
                <span className="text-sm text-gray-700">
                  {user.email}
                </span>
              </td>

              {/* Role */}
              <td className="px-5 py-4">
                <span className="text-sm font-medium text-gray-900">
                  {user.role}
                </span>
              </td>

              {/* Status */}
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

              {/* Actions */}
              <td className="px-5 py-4">
                <button
                  type="button"
                  className="text-xl text-gray-500 hover:text-gray-900"
                >
                  ⋮
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;