import { Route, Routes } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import OtpPage from "../pages/auth/OtpPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import PublicRoute from "./PublicRoute";
import { API_ROUTES } from "../constants/Api_Routes";
import PricingPage from "../pages/PricingPage";
import CreateWorkspace from "../pages/CreateWorkspace";
import PendingApproval from "../pages/PendingApproval";
import CreateOrganization from "../pages/CreateOrganization";
import InvitationSent from "../pages/InvitationSent";
import ChoosePlanPage from "../pages/ChoosePlanPage";
import SubscriptionSuccess from "../pages/SubscriptionSuccess";
import SubscriptionCancel from "../pages/SubscriptionCancel";

const AuthRoutes = () => {
  return (
    <div>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path={API_ROUTES.PUBLIC.HOME} element={<LandingPage />} />
          <Route path={API_ROUTES.PUBLIC.PRICING} element={<PricingPage />} />
          <Route path={API_ROUTES.PUBLIC.LOGIN} element={<LoginPage />} />
          <Route path={API_ROUTES.PUBLIC.REGISTER} element={<RegisterPage />} />
          <Route path={API_ROUTES.PUBLIC.OTP} element={<OtpPage />} />
          <Route path={API_ROUTES.PUBLIC.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
          <Route path={API_ROUTES.PUBLIC.RESET_PASSWORD} element={<ResetPasswordPage />} />
          <Route path={API_ROUTES.PUBLIC.CREATE_WORKSPACE} element={<CreateWorkspace />} />
          <Route path={API_ROUTES.PUBLIC.PENDING_APPROVAL} element={<PendingApproval />} />
          <Route path={API_ROUTES.PUBLIC.CREATE_ORGANIZATION} element={<CreateOrganization />} />
          <Route path={API_ROUTES.PUBLIC.REGISTER_ADMIN} element={<RegisterPage />} />
          <Route path={API_ROUTES.PUBLIC.INVITATION_SENT} element={<InvitationSent />} />
          <Route path={API_ROUTES.PUBLIC.CHOOSE_PLAN} element={<ChoosePlanPage />} />
          <Route path={API_ROUTES.PUBLIC.SUBSCRIPTION_SUCCESS} element={<SubscriptionSuccess />} />
          <Route path={API_ROUTES.PUBLIC.SUBSCRIPTION_CANCEL} element={<SubscriptionCancel />} />
        </Route>
      </Routes>
    </div>
  );
};

export default AuthRoutes;
