import { BrowserRouter, Route, Routes } from "react-router-dom";
import SuperAdminRoutes from "./routes/SuperAdminRoutes";
import WorkspaceAdminRoutes from "./routes/WorkspaceAdminRoutes";
import ModeratorRoutes from "./routes/ModeratorRoutes";
import MemberRoutes from "./routes/MemberRoutes";
import AuthRoutes from "./routes/AuthRoutes";
import { API_ROUTES } from "./constants/Api_Routes";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path={API_ROUTES.PUBLIC.LANDING} element={<AuthRoutes />} />
          <Route
            path={API_ROUTES.SUPER_ADMIN.ROOT}
            element={<SuperAdminRoutes />}
          />
          <Route
            path={API_ROUTES.WORKSPACE_ADMIN.ROOT}
            element={<WorkspaceAdminRoutes />}
          />
          <Route
            path={API_ROUTES.MODERATOR.ROOT}
            element={<ModeratorRoutes />}
          />
          <Route path={API_ROUTES.MEMBER.ROOT} element={<MemberRoutes />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
