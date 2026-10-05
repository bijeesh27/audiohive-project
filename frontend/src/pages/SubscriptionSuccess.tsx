import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import axiosInstance from "../config/axios";

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const navigate = useNavigate();
  const hasVerified = useRef(false);

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!sessionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error");
      setErrorMessage("No session ID found.");
      return;
    }

    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifySession = async () => {
      try {
        // Verify the Stripe payment session. The response includes all org data
        // that was stored in the session metadata at checkout creation time.
        const response = await axiosInstance.post("/api/subscription/verify-session", {
          sessionId,
        });
        console.log(response.data)

        if (response.data.data.status === "paid") {
          const { ownerEmail, companyName, slug, ownerName, planId } = response.data.data;

          // Payment confirmed: create the organization in the database (with the
          // correct paid planId) and send the invitation email to the owner.
          await axiosInstance.post("/api/organization/send-invitation", {
            ownerEmail,
            companyName,
            slug,
            ownerName,
            planId,
          });

          setStatus("success");
          setTimeout(() => {
            navigate("/invitation-sent", { state: { ownerEmail, companyName, slug, ownerName } });
          }, 2000);
        } else {
          setStatus("error");
          setErrorMessage("Payment was not completed successfully.");
        }
      } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } }; message?: string };
        // eslint-disable-next-line no-console
        console.error("Verification/Invitation Error:", error);
        setStatus("error");
        setErrorMessage(
          error.response?.data?.message ||
          "Failed to verify subscription session or create organization."
        );
      }
    };

    verifySession();
  }, [sessionId, navigate]);

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
              Your organization has been created. Redirecting you...
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

