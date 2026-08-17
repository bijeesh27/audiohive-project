import { BrowserRouter, Route, Routes } from "react-router-dom";
import SuperAdminRoutes from "./routes/SuperAdminRoutes";
import WorkspaceAdminRoutes from "./routes/WorkspaceAdminRoutes";
import ModeratorRoutes from "./routes/ModeratorRoutes";
import MemberRoutes from "./routes/MemberRoutes";
import AuthRoutes from "./routes/AuthRoutes";
import RoleGuard from "./routes/RoleGuard";
import { API_ROUTES } from "./constants/Api_Routes";
import { UserRoles } from "./constants/userRole";
import OrganizationRoutes from "./routes/OrganizationRoutes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={API_ROUTES.PUBLIC.LANDING} element={<AuthRoutes />} />
        

        <Route element={<RoleGuard allowedRoles={[UserRoles.SUPER_ADMIN]} />}>
          <Route path={API_ROUTES.SUPER_ADMIN.ROOT} element={<SuperAdminRoutes />} />
        </Route>

        <Route element={<RoleGuard allowedRoles={[UserRoles.ORGANIZATION_OWNER]} />}>
          <Route path={API_ROUTES.ORGANIZATION_ADMIN.ROOT} element={<OrganizationRoutes />} />
        </Route>
        <Route element={<RoleGuard allowedRoles={[UserRoles.WORKSPACE_ADMIN]} />}>
          <Route path={API_ROUTES.WORKSPACE_ADMIN.ROOT} element={<WorkspaceAdminRoutes />} />
        </Route>

        <Route element={<RoleGuard allowedRoles={[UserRoles.MODERATOR]} />}>
          <Route path={API_ROUTES.MODERATOR.ROOT} element={<ModeratorRoutes />} />
        </Route>

        <Route element={<RoleGuard allowedRoles={[UserRoles.MEMBER]} />}>
          <Route path={API_ROUTES.MEMBER.ROOT} element={<MemberRoutes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
