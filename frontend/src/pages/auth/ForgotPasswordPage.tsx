import { useState } from "react";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { forgotPassword } from "../../services/authServices";
import { useNavigate, Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { API_ROUTES } from "../../constants/Api_Routes";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await forgotPassword(email);
      if (res.success) {
        navigate(API_ROUTES.PUBLIC.NAV.OTP, { state: { purpose: "forget", email } });
      }
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const data = err?.response?.data;
        const raw = data?.errors;
        const fields: { field: string; message: string }[] = Array.isArray(raw)
          ? raw
          : [];
        if (fields.length > 0) {
          setError(fields.map((e) => e.message).join(", "));
        } else {
          setError(data?.message || "Failed to send reset email");
        }
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
            Reset your password.
          </h1>
          <p className="mt-4 text-slate-300 text-sm leading-relaxed">
            Enter your email to get a verification code and regain access to
            your workspace.
          </p>
        </div>

        <div className="relative text-xs text-slate-500">
          © 2026 AudioHive. All rights reserved.
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transition-all">
          <h2 className="text-2xl font-bold text-slate-900">Forgot Password</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            We&apos;ll send you an OTP to reset your password.
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

            <div className="mt-6">
              <Button
                label="Send OTP"
                buttonType="submit"
                loading={isLoading}
                disabled={isLoading}
              />
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Remembered your password?{" "}
            <Link
              to={API_ROUTES.PUBLIC.NAV.LOGIN}
              className="font-medium text-indigo-600 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
