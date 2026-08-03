import { Route, Routes } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import OtpPage from "../pages/auth/OtpPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import PublicRoute from "./PublicRoute";
import { API_ROUTES } from "../constants/Api_Routes";

const AuthRoutes = () => {
  return (
    <div>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="" element={<LandingPage />} />
          <Route path={API_ROUTES.PUBLIC.LOGIN} element={<LoginPage />} />
          <Route path={API_ROUTES.PUBLIC.REGISTER} element={<RegisterPage />} />
          <Route path="otp" element={<OtpPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>
      </Routes>
    </div>
  );
};

export default AuthRoutes;
