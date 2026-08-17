import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserRoles } from "../constants/userRole";
import { API_ROUTES } from "../constants/Api_Routes";

const PublicRoute = () => {
  const { isAuthenticated, userRole } = useAuth();

  if (isAuthenticated) {
    if (userRole === UserRoles.SUPER_ADMIN)
      return <Navigate to={API_ROUTES.SUPER_ADMIN.NAV.DASHBOARD} replace />;
    if (userRole === UserRoles.WORKSPACE_ADMIN)
      return <Navigate to={API_ROUTES.WORKSPACE_ADMIN.NAV.DASHBOARD} replace />;
    if (userRole === UserRoles.MODERATOR)
      return <Navigate to={API_ROUTES.MODERATOR.NAV.DASHBOARD} replace />;
    if (userRole === UserRoles.ORGANIZATION_OWNER)
      return <Navigate to={API_ROUTES.ORGANIZATION_ADMIN.NAV.DASHBOARD} replace />;

    return <Navigate to={API_ROUTES.MEMBER.NAV.DASHBOARD} replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
