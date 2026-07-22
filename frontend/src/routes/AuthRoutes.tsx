import { Route, Routes } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import OtpPage from "../pages/auth/OtpPage";
import PublicRoute from "./PublicRoute";

const AuthRoutes = () => {
  return (
    <div>
      <Routes>
        

        <Route element={<PublicRoute />}>
          <Route path="" element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="otp" element={<OtpPage />} />
        </Route>
      </Routes>
    </div>
  );
};

export default AuthRoutes;
