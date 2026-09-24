import { ArrowLeft, MailCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_ROUTES } from "../constants/Api_Routes";

const InvitationSent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const ownerEmail = location.state?.ownerEmail || location.state?.adminEmail || "your registered email";



  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <span className="text-sm font-bold text-white">A</span>
            </div>
            <span className="text-lg font-semibold text-brand-text">AudioHive</span>
          </div>
        </div>
      </header>
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          {/* Card */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            {/* Success / Sent Icon */}
            <div className="flex justify-center pt-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                <MailCheck size={28} className="text-green-600" strokeWidth={2} />
              </div>
            </div>
            <div className="px-8 pt-5 text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Invitation Sent
              </h1>
              
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
                We've sent an invitation email to{" "}
                <span className="font-medium text-gray-700">
                  {ownerEmail}
                </span>
                . Please check your inbox and follow the link to activate your account.
              </p>
            </div>

            <div className="px-8 py-7 text-center">
              <button
                type="button"
                onClick={() => navigate(API_ROUTES.PUBLIC.NAV.LANDING)}
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <ArrowLeft size={16} />
                Return to Home
              </button>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-gray-400">
            Didn't receive the email? Contact our support team.
          </p>
        </div>
      </main>
    </div>
  );
};

export default InvitationSent;