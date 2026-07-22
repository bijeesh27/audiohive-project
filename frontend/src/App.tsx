import { BrowserRouter, Route, Routes } from "react-router-dom";
import SuperAdminRoutes from "./routes/SuperAdminRoutes";
import WorkspaceAdminRoutes from "./routes/WorkspaceAdminRoutes";
import ModeratorRoutes from "./routes/ModeratorRoutes";
import MemberRoutes from "./routes/MemberRoutes";
import AuthRoutes from "./routes/AuthRoutes";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<AuthRoutes />} />
          <Route path="/superadmin/*" element={<SuperAdminRoutes />} />
          <Route path="/workspaceadmin/*" element={<WorkspaceAdminRoutes />} />
          <Route path="/moderator/*" element={<ModeratorRoutes />} />
          <Route path="/member/*" element={<MemberRoutes />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
