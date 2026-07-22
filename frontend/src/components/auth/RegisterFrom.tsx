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
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transition-all">
      <form onSubmit={handleSubmit}>
        <Input
          placeHolder="username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <br />
        <Input
          placeHolder="email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <Input
          type="password"
          placeHolder="password..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <Button label="Register" buttonType="submit" />
      </form>
    </div>
  );
};

export default RegisterFrom;
