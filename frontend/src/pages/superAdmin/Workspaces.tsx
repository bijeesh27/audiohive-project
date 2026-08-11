import React, { useEffect, useState } from "react";
import {
  approveWorkspaceApi,
  getAllWorkspaces,
  updateWorkspace,
} from "../../services/workspaceServices";

interface ISubscription {
  _id: string;
  subscriptionName: string;
  price: number;
}

interface IWorkspace {
  _id: string;
  companyName: string;
  workspaceAdminName: string;
  workspaceAdminEmail: string;
  planId: ISubscription | string;
  status: "pending" | "active" | "suspended" | "reject";
  workspaceSlug: string;
  paymentStatus: "pending" | "paid" | "failed";
  amountPaid: number;
}

const Workspaces = () => {
  const [workspaces, setWorkspaces] = useState<IWorkspace[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await getAllWorkspaces();
        setWorkspaces(res.data);
      } catch (error) {
        console.error("Failed to fetch workspaces:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, []);

  const handleApprove = async (workspace: IWorkspace) => {
    try {
      setUpdatingId(workspace._id);
      // Call the NEW backend endpoint instead of updateWorkspace
      await approveWorkspaceApi({
        workspaceId: workspace._id,
        adminEmail: workspace.workspaceAdminEmail,
        workspaceName: workspace.companyName,
      });
      setWorkspaces((prev) =>
        prev.map((w) =>
          w._id === workspace._id ? { ...w, status: "active" } : w,
        ),
      );
    } catch (error) {
      console.error("Failed to approve workspace:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async (workspaceId: string) => {
    try {
      setUpdatingId(workspaceId);

      await updateWorkspace(workspaceId, {
        status: "reject",
      });

      setWorkspaces((prev) =>
        prev.map((workspace) =>
          workspace._id === workspaceId
            ? {
                ...workspace,
                status: "reject",
              }
            : workspace,
        ),
      );
    } catch (error) {
      console.error("Failed to reject workspace:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const getPlanName = (planId: ISubscription | string) => {
    if (typeof planId === "object") {
      return planId.subscriptionName;
    }

    return planId;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Workspaces</h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage workspace requests and subscriptions.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Workspace
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Workspace Admin
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Subscription Plan
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Payment Status
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Amount Paid
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {workspaces.map((workspace) => (
                <tr
                  key={workspace._id}
                  className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                >
                  {/* Workspace */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700">
                        {workspace.companyName?.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {workspace.companyName}
                        </p>

                        <p className="text-xs text-gray-500">
                          {workspace.workspaceSlug}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Workspace Admin */}
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {workspace.workspaceAdminName}
                      </p>

                      <p className="text-xs text-gray-500">
                        {workspace.workspaceAdminEmail}
                      </p>
                    </div>
                  </td>

                  {/* Subscription Plan */}
                  <td className="px-5 py-4 text-sm text-gray-700">
                    {getPlanName(workspace.planId)}
                  </td>

                  {/* Payment Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        workspace.paymentStatus === "paid"
                          ? "bg-green-50 text-green-600"
                          : workspace.paymentStatus === "pending"
                            ? "bg-yellow-50 text-yellow-600"
                            : "bg-red-50 text-red-600"
                      }`}
                    >
                      {workspace.paymentStatus}
                    </span>
                  </td>

                  {/* Amount Paid */}
                  <td className="px-5 py-4 text-sm font-medium text-gray-900">
                    ₹{workspace.amountPaid?.toLocaleString("en-IN") ?? "0"}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        workspace.status === "active"
                          ? "bg-green-50 text-green-600"
                          : workspace.status === "pending"
                            ? "bg-yellow-50 text-yellow-600"
                            : "bg-red-50 text-red-600"
                      }`}
                    >
                      {workspace.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {workspace.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(workspace)} // Changed from workspace._id
                            disabled={updatingId === workspace._id}
                            type="button"
                            className="rounded-md bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingId === workspace._id
                              ? "Updating..."
                              : "Approve"}
                          </button>

                          <button
                            onClick={() => handleReject(workspace._id)}
                            disabled={updatingId === workspace._id}
                            type="button"
                            className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingId === workspace._id
                              ? "Updating..."
                              : "Reject"}
                          </button>
                        </>
                      )}

                      {workspace.status === "active" && (
                        <span className="text-xs font-medium text-green-600">
                          Approved
                        </span>
                      )}

                      {workspace.status === "reject" && (
                        <span className="text-xs font-medium text-red-600">
                          Rejected
                        </span>
                      )}

                      {workspace.status === "suspended" && (
                        <span className="text-xs font-medium text-red-600">
                          Suspended
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">Loading workspaces...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && workspaces.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-gray-900">
              No workspaces found
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Workspace requests will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Workspaces;
