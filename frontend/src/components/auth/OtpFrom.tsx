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
    <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transition-all">
      <h2 className="text-2xl font-bold text-slate-900">Verify OTP</h2>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        Enter the code sent to your email to continue.
      </p>
 
        <form onSubmit={handleSubmit}>
            
      <OtpInput
        placeHolder="enter otp.."
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />
 
      <div className="mt-6">
        <Button label="Verify Otp" buttonType="submit" />
      </div>
        </form>
 
      <p className="mt-6 text-center text-sm text-slate-500">
        Didn't get a code?{" "}
        <button type="button" className="font-medium text-indigo-600 hover:underline">
          Resend
        </button>
      </p>
    </div>
  );
};

export default OtpFrom;
