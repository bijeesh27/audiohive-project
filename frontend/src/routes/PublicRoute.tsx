import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";



const PublicRoute = () => {
  const { isAuthenticated, userRole } = useAuth();

  if (isAuthenticated) {
    if (userRole === "superadmin") return <Navigate to="/superadmin/dashboard" replace />;
    if (userRole === "workspaceadmin")
      return <Navigate to="/workspaceadmin/dashboard" replace />;
    if (userRole === "moderator") return <Navigate to="/moderator/dashboard" replace />;

    return <Navigate to="/member/dashboard" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
