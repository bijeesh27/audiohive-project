import { Route, Routes } from "react-router-dom";
import Dashboard from "../pages/workspaceAdmin/Dashboard";
import { API_ROUTES } from "../constants/Api_Routes";
import Users from "../pages/workspaceAdmin/Users";
import WorkspaceAdminLayout from "../components/workspaceAdmin/layout/WorkspaceAdminLayout";

const WorkspaceAdminRoutes = () => {
  return (
    <div>
      <Routes>
        <Route element={<WorkspaceAdminLayout />}>
          <Route
            path={API_ROUTES.WORKSPACE_ADMIN.DASHBOARD}
            element={<Dashboard />}
          />
          <Route
            path={API_ROUTES.WORKSPACE_ADMIN.GET_USERS}
            element={<Users />}
          />
        </Route>
      </Routes>
    </div>
  );
};

export default WorkspaceAdminRoutes;
