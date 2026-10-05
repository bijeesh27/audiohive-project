import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OtpInput from "../common/OtpInput";
import Button from "../common/Button";
import { verifyOtp, resendOtp } from "../../services/authServices";
import { isAxiosError } from "axios";
import { API_ROUTES } from "../../constants/Api_Routes";

const OtpFrom = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const purpose = location.state?.purpose;
  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState("");
  const [resendInfo, setResendInfo] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (!location.state) {
      navigate(API_ROUTES.PUBLIC.NAV.LOGIN);
      return;
    }

    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, location.state, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setOtpError("");
    setResendInfo(null);

    if (!otp || otp.length < 4) {
      setOtpError("Please enter a valid 4-digit OTP.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyOtp(email, otp, purpose);
      if (res.success) {
        if (purpose === "forget") {
          const resetToken = res.data?.resetToken;
          navigate(API_ROUTES.PUBLIC.NAV.RESET_PASSWORD, { state: { resetToken } });
        } else if (purpose === "register") {
          navigate(API_ROUTES.PUBLIC.NAV.LOGIN);
        }
      }
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const data = err?.response?.data;
        setError(data?.message || "OTP verification failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResendInfo(null);
    try {
      await resendOtp(email);
      setTimeLeft(60);
      setResendInfo("A new OTP has been sent to your email.");
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err?.response?.data?.message || "Failed to resend OTP");
      }
    }
  };

  return (
    <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transition-all">
      <h2 className="text-2xl font-bold text-slate-900">Verify OTP</h2>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        Enter the code sent to your email to continue.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {resendInfo && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
          {resendInfo}
        </div>
      )}

      <form noValidate onSubmit={handleSubmit}>
        <OtpInput
          placeHolder="enter otp..."
          value={otp}
          onChange={(e) => {
            setOtp(e.target.value);
            if (otpError) setOtpError("");
          }}
        />
        {otpError && (
          <p className="mt-1 text-xs text-red-500">{otpError}</p>
        )}

        <div className="mt-6">
          <Button label="Verify Otp" buttonType="submit" loading={isLoading} disabled={isLoading} />
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Didn&apos;t get a code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={timeLeft > 0}
          className="font-medium text-indigo-600 hover:underline disabled:text-slate-400 disabled:no-underline"
        >
          {timeLeft > 0 ? `Resend in ${timeLeft}s` : "Resend"}
        </button>
      </p>
    </div>
  );
};

export default OtpFrom;
