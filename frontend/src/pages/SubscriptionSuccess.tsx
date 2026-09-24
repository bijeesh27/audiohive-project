import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import axiosInstance from "../config/axios";

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const navigate = useNavigate();
  const location = useLocation();
  const hasVerified = useRef(false);

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setErrorMessage("No session ID found.");
      return;
    }

    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifySession = async () => {
      try {
        const response = await axiosInstance.post("/api/subscription/verify-session", {
          sessionId,
        });

        if (response.data.status === "paid") {
          const ownerEmail = response.data.ownerEmail;
          if (ownerEmail) {
            await axiosInstance.post("/api/organization/send-invitation", { ownerEmail });
          }
          setStatus("success");
          setTimeout(() => {
            navigate("/invitation-sent", { state: { ownerEmail } });
          }, 2000);
        } else {
          setStatus("error");
          setErrorMessage("Payment was not completed successfully.");
        }
      } catch (error: any) {
        console.error("Verification/Invitation Error:", error);
        setStatus("error");
        setErrorMessage(error.response?.data?.message || "Failed to verify subscription session or send invitation.");
      }
    };

    verifySession();
  }, [sessionId, navigate, location.state]);

  return (
    <div className="flex justify-center items-center h-screen bg-[#F7F8FC]">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Verifying Payment...</h2>
            <p className="text-sm text-gray-500 mt-2">Please do not close this window.</p>
          </div>
        )}
        {status === "success" && (
          <div className="flex flex-col items-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
            <p className="text-sm text-gray-500 mt-2">
              Your subscription is active. We are redirecting you...
            </p>
          </div>
        )}
        {status === "error" && (
          <div className="flex flex-col items-center">
            <XCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
            <p className="text-sm text-red-500 mt-2">{errorMessage}</p>
            <button
              onClick={() => navigate("/choose-plan")}
              className="mt-6 w-full rounded-md bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              Back to Plans
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
