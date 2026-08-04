import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../common/Button";
import Input from "../common/Input";
import { register } from "../../services/authServices";
import { isAxiosError } from "axios";

const RegisterFrom = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await register(username, email, password);
      if (res.success) {
        navigate("/otp", { state: { purpose: "register", email } });
      }
    } catch (err: unknown) {
      if(isAxiosError(err)){
        setError(err?.response?.data?.message || "Registration failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transition-all">
      <h2 className="text-2xl font-bold text-slate-900">Create Workspace</h2>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        Sign up to get started with AudioHive.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
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
        />
 
        <label className="text-sm font-medium text-slate-900 block mt-4 mb-1.5">
          Email Address
        </label>
        <Input
          placeHolder="email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default RegisterFrom;
