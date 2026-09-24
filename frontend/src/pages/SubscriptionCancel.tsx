import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";

const SubscriptionCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center items-center h-screen bg-[#F7F8FC]">
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
        <XCircle className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900">Payment Cancelled</h2>
        <p className="text-sm text-gray-500 mt-3 mb-8">
          You cancelled the checkout process. Your organization is created but you need a plan to proceed.
        </p>
        <button
          onClick={() => navigate("/choose-plan")}
          className="w-full rounded-md bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          Return to Plan Selection
        </button>
      </div>
    </div>
  );
};

export default SubscriptionCancel;
