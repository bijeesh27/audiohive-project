import { useState } from "react";
import OtpInput from "../common/OtpInput";
import Button from "../common/Button";
import { verifyOtp } from "../../services/authServices";
import { useLocation, useNavigate } from "react-router-dom";

const OtpFrom = () => {
    const location=useLocation()
    const navigate=useNavigate()
    const purpose=location.state
  const [otp, setOtp] = useState("");
  const handleSubmit=async(e:any)=>{
    e.preventDefault()
    await verifyOtp(otp,purpose)
    .then(res=>{
        if(res.success&&purpose=='register'){
            navigate('/login')
        }
    })
    
  }
  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transition-all">
        <form onSubmit={handleSubmit}>
            
      <OtpInput
        placeHolder="enter otp.."
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />
      <Button label="Verify Otp" buttonType="submit" />
        </form>
    </div>
  );
};

export default OtpFrom;
