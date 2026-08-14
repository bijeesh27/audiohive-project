import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_ROUTES } from "../constants/Api_Routes";

const PrivateRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                Loading...
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to={API_ROUTES.PUBLIC.NAV.LOGIN} replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;