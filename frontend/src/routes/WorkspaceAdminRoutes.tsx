import { Route, Routes } from "react-router-dom";
import Dashboard from "../pages/workspaceAdmin/Dashboard";
import { API_ROUTES } from "../constants/Api_Routes";
import Users from "../pages/workspaceAdmin/Users";
import Rooms from "../pages/workspaceAdmin/Rooms";
import AdminRoomDetail from "../pages/workspaceAdmin/AdminRoomDetail";
import Announcements from "../pages/workspaceAdmin/Announcements";
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
          <Route
            path={API_ROUTES.WORKSPACE_ADMIN.ROOMS}
            element={<Rooms />}
          />
          <Route
            path={API_ROUTES.WORKSPACE_ADMIN.ROOM_DETAIL}
            element={<AdminRoomDetail />}
          />
          <Route
            path={API_ROUTES.WORKSPACE_ADMIN.ANNOUNCEMENTS}
            element={<Announcements />}
          />
        </Route>
      </Routes>
    </div>
  );
};

export default WorkspaceAdminRoutes;
