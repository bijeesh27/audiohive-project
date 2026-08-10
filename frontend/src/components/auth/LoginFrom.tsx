import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../common/Input";
import Button from "../common/Button";
import { login } from "../../services/authServices";
import { useAuth } from "../../context/AuthContext";
import { setToken } from "../../config/axios";
import { UserRoles } from "../../constants/userRole";
import { API_ROUTES } from "../../constants/Api_Routes";
import { isAxiosError } from "axios";

const LoginFrom = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAccessToken, setUserRole } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await login(email, password);
      if (res.success) {
        setToken(res.data.accessToken);
        setAccessToken(res.data.accessToken);
        setUserRole(res.data.userRole);

        if (res.data.userRole === UserRoles.SUPER_ADMIN) {
          navigate(API_ROUTES.SUPER_ADMIN.NAV.DASHBOARD);
        } else if (res.data.userRole === UserRoles.WORKSPACE_ADMIN) {
          navigate(API_ROUTES.WORKSPACE_ADMIN.NAV.DASHBOARD);
        } else if (res.data.userRole === UserRoles.MODERATOR) {
          navigate(API_ROUTES.MODERATOR.NAV.DASHBOARD);
        } else if (res.data.userRole === UserRoles.MEMBER) {
          navigate(API_ROUTES.MEMBER.NAV.DASHBOARD);
        }
      }
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err?.response?.data?.message || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transition-all">
      <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        Enter your credentials to access your account.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label className="text-sm font-medium text-slate-900 block mb-1.5">
          Email Address
        </label>
        <Input
          placeHolder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="flex items-center justify-between mt-4 mb-1.5">
          <label className="text-sm font-medium text-slate-900">Password</label>
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>
        <Input
          type="password"
          placeHolder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="mt-6">
          <Button
            label="Sign In"
            buttonType="submit"
            loading={isLoading}
            disabled={isLoading}
          />
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Need a new workspace?{" "}
        <Link
          to="/createworkspace"
          className="font-medium text-indigo-600 hover:underline"
        >
          Create Workspace
        </Link>
      </p>
    </div>
  );
};

export default LoginFrom;
