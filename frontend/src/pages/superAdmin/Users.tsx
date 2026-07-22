import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getUsers } from "../../services/authServices";

const Users = () => {
  const { accessToken } = useAuth();

  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!accessToken) return;

    getUsers(accessToken).then((res) => {
      setUsers(res.data);
    });
  }, [accessToken]);

  return (
    <div>
      {users.map((user) => (
        <div key={user._id}>
          {user.username}
        </div>
      ))}
    </div>
  );
};

export default Users;