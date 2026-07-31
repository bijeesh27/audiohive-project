import { useState } from "react";
import Button from "../common/Button";
import Input from "../common/Input";
import { register } from "../../services/authServices";
import { useNavigate } from "react-router-dom";

const RegisterFrom = () => {
    const navigate=useNavigate()
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
 const handleSubmit=async(e:any)=>{
    e.preventDefault()
    await register(username,email,password)
    .then(res=>{
        if(res.success){
            const purpose='register'
            navigate('/otp',{state:purpose})
        }
    })
 }
 return (
    <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transition-all">
      <h2 className="text-2xl font-bold text-slate-900">Create Workspace</h2>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        Sign up to get started with AudioHive.
      </p>
 
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
 
        <div className="mt-6">
          <Button label="Register" buttonType="submit" />
        </div>
      </form>
 
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <a href="/login" className="font-medium text-indigo-600 hover:underline">
          Sign In
        </a>
      </p>
    </div>
  );
};

export default RegisterFrom;
