import { useNavigate } from "react-router-dom";
import { logout } from "../../services/authServices";
import { useAuth } from "../../context/AuthContext";
import { setToken } from "../../config/axios";

const Logout = () => {
  const navigate = useNavigate();
  const {setAccessToken,setUserRole} =useAuth()
  const handleLogout = async () => {
    await logout();
    setToken(null);
    setAccessToken(null);
    setUserRole(null);

    navigate("/login");
  };
  return (
    <div>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Logout;
