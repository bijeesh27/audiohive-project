import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../common/Button";
import Input from "../common/Input";
import { getInvitationDetails, register, registerOwner, registerWorkspaceAdmin, registerWorkspaceUser } from "../../services/authServices";
import { isAxiosError } from "axios";
import { API_ROUTES } from "../../constants/Api_Routes";

const RegisterFrom = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [invitationType, setInvitationType] = useState<"workspace" | "organization" | "workspace-user" | null>(null);

  useEffect(() => {
    if (token) {
      getInvitationDetails(token)
        .then((res) => {
          if (res.success) {
            if (res.data.type === "workspace") {
              setInvitationType("workspace");
              setUsername(res.data.workspaceAdminName);
              setEmail(res.data.email);
            } else if (res.data.type === "workspace-user") {
              setInvitationType("workspace-user");
              setUsername(res.data.invitedName);
              setEmail(res.data.email);
            } else {
              setInvitationType("organization");
              setUsername(res.data.ownerName);
              setEmail(res.data.ownerEmail);
            }
          }
        })
        .catch(() => setError("This invitation link is invalid or has expired."));
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const newErrors: Record<string, string> = {};

    if (!username.trim()) {
      newErrors.username = "Username is required";
    }
    // Only validate email client-side when there is no invitation token
    if (!token) {
      if (!email.trim()) {
        newErrors.email = "Email address is required";
      } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
        newErrors.email = "Please enter a valid email address";
      }
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      if (token) {
        if (invitationType === "workspace") {
          const res = await registerWorkspaceAdmin(username, password, token);
          if (res.success) navigate(API_ROUTES.PUBLIC.NAV.LOGIN);
        } else if (invitationType === "workspace-user") {
          const res = await registerWorkspaceUser(username, password, token);
          if (res.success) navigate(API_ROUTES.PUBLIC.NAV.LOGIN);
        } else {
          const res = await registerOwner(username, password, token);
          if (res.success) navigate(API_ROUTES.PUBLIC.NAV.LOGIN);
        }
      } else {
        const res = await register(username, email, password);
        if (res.success) navigate(API_ROUTES.PUBLIC.NAV.OTP, { state: { purpose: "register", email } });
      }
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const data = err?.response?.data;
        setError(data?.message || "Registration failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transition-all">
      <h2 className="text-2xl font-bold text-slate-900">
        {invitationType === "workspace"
          ? "Create Workspace Admin"
          : invitationType === "workspace-user"
          ? "Create Workspace User"
          : "Create Organization"}
      </h2>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        Sign up to get started with AudioHive.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form noValidate onSubmit={handleSubmit}>
        <label className="text-sm font-medium text-slate-900 block mb-1.5">
          Username
        </label>
        <Input
          placeHolder="username..."
          value={username}
          readOnly={!!token}
          hasError={!!errors.username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (errors.username) setErrors((prev) => ({ ...prev, username: "" }));
          }}
        />
        {errors.username && (
          <p className="mt-1 text-xs text-red-500">{errors.username}</p>
        )}

        <label className="text-sm font-medium text-slate-900 block mt-4 mb-1.5">
          Email Address
        </label>
        <Input
          placeHolder="email..."
          value={email}
          readOnly={!!token}
          hasError={!!errors.email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
          }}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-500">{errors.email}</p>
        )}

        <label className="text-sm font-medium text-slate-900 block mt-4 mb-1.5">
          Password
        </label>
        <Input
          type="password"
          placeHolder="password..."
          value={password}
          hasError={!!errors.password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
          }}
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-500">{errors.password}</p>
        )}

        <label className="text-sm font-medium text-slate-900 block mt-4 mb-1.5">
          Confirm Password
        </label>
        <Input
          type="password"
          placeHolder="confirm password..."
          value={confirmPassword}
          hasError={!!errors.confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
          }}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
        )}

        <div className="mt-6">
          <Button label="Register" buttonType="submit" loading={isLoading} disabled={isLoading} />
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link to={API_ROUTES.PUBLIC.NAV.LOGIN} className="font-medium text-indigo-600 hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default RegisterFrom;
