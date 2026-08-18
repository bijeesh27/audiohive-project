import { useEffect, useState } from "react";
import { getAllOrganizations, updateOrganization } from "../../services/organizationServices";

interface IOrganization {
  _id: string;
  companyName: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  planId: string;
  status: "active" | "suspended" | "pending" | "archived";
  createdAt: string;
}

const Organization = () => {
  const [organizations, setOrganizations] = useState<IOrganization[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 5;

  const [confirmToggleOrg, setConfirmToggleOrg] = useState<IOrganization | null>(null);
  const [toggling, setToggling] = useState(false);

  const fetchOrganizations = () => {
    setLoading(true);
    getAllOrganizations(page, limit, search)
      .then((res) => {
        setOrganizations(res.data?.organizations || []);
        setTotalPages(Math.ceil((res.data?.total || 0) / limit));
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      let cancelled = false;
      getAllOrganizations(page, limit, search)
        .then((res) => {
          if (!cancelled) {
            setOrganizations(res.data?.organizations || []);
            setTotalPages(Math.ceil((res.data?.total || 0) / limit));
          }
        })
        .catch((error) => {
          console.error("Failed to fetch organizations:", error);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [page, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const statusStyles: Record<IOrganization["status"], string> = {
    active: "bg-green-50 text-green-600",
    pending: "bg-yellow-50 text-yellow-600",
    suspended: "bg-red-50 text-red-600",
    archived: "bg-gray-100 text-gray-600",
  };

  const handleToggleStatus = async () => {
    if (!confirmToggleOrg) return;
    setToggling(true);
    try {
      const newStatus = confirmToggleOrg.status === "active" ? "suspended" : "active";
      await updateOrganization(confirmToggleOrg._id, { status: newStatus });
      setConfirmToggleOrg(null);
      fetchOrganizations(); // Re-fetch the list
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update status");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Organizations
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            All registered organizations.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Organization
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Owner
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Plan
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Created
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {organizations.map((organization) => (
                <tr
                  key={organization._id}
                  className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                >
                  {/* Organization */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700">
                        {organization.companyName?.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {organization.companyName}
                        </p>

                        <p className="text-xs text-gray-500">
                          {organization.slug}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Owner */}
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {organization.ownerName}
                      </p>

                      <p className="text-xs text-gray-500">
                        {organization.ownerEmail}
                      </p>
                    </div>
                  </td>

                  {/* Plan */}
                  <td className="px-5 py-4 text-sm capitalize text-gray-700">
                    {organization.planId}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusStyles[organization.status]}`}
                    >
                      {organization.status}
                    </span>
                  </td>

                  {/* Created */}
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {new Date(organization.createdAt).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" },
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setConfirmToggleOrg(organization)}
                      className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-gray-50 ${
                        organization.status === "active" ? "border-red-300 text-red-700" : "border-green-300 text-green-700"
                      }`}
                    >
                      {organization.status === "active" ? "Block" : "Unblock"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">Loading organizations...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && organizations.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-gray-900">
              No organizations found
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Organizations will appear here.
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && organizations.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmToggleOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">
              {confirmToggleOrg.status === "active" ? "Block Organization" : "Unblock Organization"}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to {confirmToggleOrg.status === "active" ? "block" : "unblock"} the organization "{confirmToggleOrg.companyName}"?
              {confirmToggleOrg.status === "active" && " Their workspaces will be inaccessible."}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmToggleOrg(null)}
                disabled={toggling}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={toggling}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  confirmToggleOrg.status === "active" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {toggling ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Organization;