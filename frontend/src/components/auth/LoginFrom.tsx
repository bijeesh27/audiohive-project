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
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transition-all">
      <form onSubmit={handleSubmit}>
        <Input
          placeHolder="email.."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <Input
          type="password"
          placeHolder="password..."
          value={password}
          onChange={(e) => setPasword(e.target.value)}
        />
        <br />
        <Button label={"Login"} buttonType="submit" />
      </form>
    </div>
  );
};

export default LoginFrom;