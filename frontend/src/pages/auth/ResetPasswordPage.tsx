import { useState, useEffect } from "react";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { resetPassword } from "../../services/authServices";
import { useNavigate, useLocation } from "react-router-dom";
import { isAxiosError } from "axios";
import { API_ROUTES } from "../../constants/Api_Routes";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const resetToken = location.state?.resetToken;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!resetToken) {
      navigate(API_ROUTES.PUBLIC.NAV.LOGIN);
    }
  }, [resetToken, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const res = await resetPassword(resetToken, password);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate(API_ROUTES.PUBLIC.NAV.LOGIN);
        }, 2000);
      }
    } catch (err: unknown) {
      if(isAxiosError(err)){
        setError(err?.response?.data?.message || "Failed to reset password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between bg-slate-950 text-white px-12 py-10 overflow-hidden">
        <div className="pointer-events-none absolute -top-20 right-0 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-purple-700/20 blur-3xl" />
 
        <div className="relative font-semibold text-lg">AudioHive</div>
 
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Create new password.
          </h1>
          <p className="mt-4 text-slate-300 text-sm leading-relaxed">
            Your new password must be different from previous used passwords.
          </p>
        </div>
 
        <div className="relative text-xs text-slate-500">
          © 2026 AudioHive. All rights reserved.
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transition-all">
          <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            Enter your new secure password below.
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-600">
              Password successfully changed! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label className="text-sm font-medium text-slate-900 block mb-1.5">
              New Password
            </label>
            <Input
              type="password"
              placeHolder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="mt-4 mb-1.5">
              <label className="text-sm font-medium text-slate-900 block">
                Confirm Password
              </label>
            </div>
            <Input
              type="password"
              placeHolder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div className="mt-6">
              <Button label="Reset Password" buttonType="submit" loading={isLoading} disabled={isLoading || success} />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
