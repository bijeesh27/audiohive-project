

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
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white py-16 text-sm text-gray-500">
        No users found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 ">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-500 ">
              Username
            </th>
            <th className="px-4 py-3 font-medium text-gray-500">
              email
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 ">
          {users.map((user) => (
            <tr
              key={user._id}
              className="bg-white transition-colors hover:bg-gray-50 "
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  
                  <span className="font-medium text-gray-900">
                    {user.username}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
              
                  <span className="font-medium text-gray-900 ">
                    {user.email}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;