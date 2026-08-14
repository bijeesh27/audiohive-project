import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_ROUTES } from "../constants/Api_Routes";

interface RoleGuardProps {
  allowedRoles: string[];
}

const RoleGuard = ({ allowedRoles }: RoleGuardProps) => {
  const { isAuthenticated, isLoading, userRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={API_ROUTES.PUBLIC.NAV.LOGIN} replace />;
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to={API_ROUTES.PUBLIC.NAV.LOGIN} replace />;
  }

  return <Outlet />;
};

export default RoleGuard;
