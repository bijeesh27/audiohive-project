import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../common/Button";
import Input from "../common/Input";
import { getInvitationDetails, register, registerOwner, registerWorkspaceAdmin } from "../../services/authServices";
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
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  useEffect(() => {
    if (token) {
      getInvitationDetails(token)
        .then((res) => {
          if (res.success) {
            console.log(res)
            setUsername(res.data.ownerName)
            setEmail(res.data.ownerEmail);
          }
        })
        .catch(() => setError("This invitation link is invalid or has expired."));
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setIsLoading(true);
    setError(null);
    setFieldErrors([])
    try {
      if (token) {
        const res = await registerOwner(username, password, token);
        if (res.success) navigate(API_ROUTES.PUBLIC.NAV.LOGIN);
      } else {
        const res = await register(username, email, password);
        if (res.success) navigate(API_ROUTES.PUBLIC.NAV.OTP, { state: { purpose: "register", email } });
      }
    } catch (err: unknown) {
      if (isAxiosError(err)) {
    const data = err?.response?.data;
    const raw = data?.errors;
  const fields: {field:string; message:string}[] = Array.isArray(raw) ? raw : [];
    if (fields.length > 0) {
      setFieldErrors(fields.map(e => e.message));
      setError(null);
    } else {
      setError(data?.message || "Login failed");
      setFieldErrors([]);
    }
  }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transition-all">
      <h2 className="text-2xl font-bold text-slate-900">Create Organization</h2>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        Sign up to get started with AudioHive.
      </p>

     {error && (
    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
      {error}
    </div>
  )}
  {fieldErrors.length > 0 && (
    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
      <ul className="list-disc list-inside space-y-1">
        {fieldErrors.map((msg, i) => <li key={i}>{msg}</li>)}
      </ul>
    </div>
  )}
 
      <form onSubmit={handleSubmit}>
        <label className="text-sm font-medium text-slate-900 block mb-1.5">
          Username
        </label>
        <Input
          placeHolder="username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          readOnly={!!token}
        />
 
        <label className="text-sm font-medium text-slate-900 block mt-4 mb-1.5">
          Email Address
        </label>
        <Input
          placeHolder="email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          readOnly={!!token}
        />
 
        <label className="text-sm font-medium text-slate-900 block mt-4 mb-1.5">
          Password
        </label>
        <Input
          type="password"
          placeHolder="password..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="text-sm font-medium text-slate-900 block mt-4 mb-1.5">
          Confirm Password
        </label>
        <Input
          type="password"
          placeHolder="confirm password..."
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
 
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
