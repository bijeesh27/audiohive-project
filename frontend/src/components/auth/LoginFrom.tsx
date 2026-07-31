import Input from "../common/Input";
import Button from "../common/Button";
import { login } from "../../services/authServices";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
// IMPORTANT: Adjust this path to wherever your axios.ts file is located
import { setToken } from "../../config/axios"; 

const LoginFrom = () => {
  let navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPasword] = useState("");
  const { accessToken, setAccessToken, setUserRole } = useAuth();
  
  console.log("accesstokennnnn", accessToken);

  function handleSubmit(e: any) {
    e.preventDefault();
    login(email, password)
      .then((res) => {
        console.log(res);

        if (res.success) {
          setToken(res.data.accessToken);
          setAccessToken(res.data.accessToken);
          setUserRole(res.data.userRole);
          if (res.data.userRole === "superadmin") {
            navigate("/superadmin/dashboard");
          } else if (res.data.userRole === "workspaceadmin") {
            navigate("/workspaceadmin/dashboard");
          } else if (res.data.userRole === "moderator") {
            navigate("/moderator/dashboard");
          } else if (res.data.userRole === "member") {
            navigate("/member/dashboard");
          }
        }
      })
      .catch((err) => {
        console.error("Login Error:", err);
      });
  }

  return (
    <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transition-all">
      <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        Enter your credentials to access your account.
      </p>
 
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
          <label className="text-sm font-medium text-slate-900">
            Password
          </label>
          <a
            href="/forgot-password"
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            Forgot Password?
          </a>
        </div>
        <Input
          type="password"
          placeHolder="••••••••"
          value={password}
          onChange={(e) => setPasword(e.target.value)}
        />
 
        <div className="mt-6">
          <Button label={"Sign In"} buttonType="submit" />
        </div>
      </form>
 
      <p className="mt-6 text-center text-sm text-slate-500">
        Need a new workspace?{" "}
        <a
          href="/register"
          className="font-medium text-indigo-600 hover:underline"
        >
          Create Workspace
        </a>
      </p>
    </div>
  );
};

export default LoginFrom;