import { useNavigate } from "react-router-dom";
import { logout } from "../../services/authServices";
import { useAuth } from "../../context/AuthContext";
import { setToken } from "../../config/axios";
import { API_ROUTES } from "../../constants/Api_Routes";

const Logout = () => {
  const navigate = useNavigate();
  const { setAccessToken, setUserRole } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setToken(null);
      setAccessToken(null);
      setUserRole(null);
      localStorage.setItem("logout", Date.now().toString());
      navigate(API_ROUTES.PUBLIC.NAV.LOGIN);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
    >
      Logout
    </button>
  );
};

export default Logout;
