import { useState } from "react";
import { ArrowLeft, ArrowRight, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createWorkspace } from "../services/workspaceServices";
import { isAxiosError } from "axios";
import { API_ROUTES } from "../constants/Api_Routes";

interface IFormData {
  companyName: string;
  workspaceAdminName: string;
  workspaceAdminEmail: string;
  workspaceSlug: string;
}

const CreateWorkspace = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState<IFormData>({
    companyName: "",
    workspaceAdminName: "",
    workspaceAdminEmail: "",
    workspaceSlug: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContinue = async () => {
    if (
      !formData.companyName.trim() ||
      !formData.workspaceAdminName.trim() ||
      !formData.workspaceAdminEmail.trim() ||
      !formData.workspaceSlug.trim()
    ) {
      return;
    }

    setFieldErrors([]);
    setError(null);
    setIsLoading(true);

    const workspaceData = {
      companyName: formData.companyName.trim(),
      workspaceAdminName: formData.workspaceAdminName.trim(),
      workspaceAdminEmail: formData.workspaceAdminEmail.trim(),
      status: "pending",
      workspaceSlug: formData.workspaceSlug.trim().toLowerCase(),
    };

    try {
      await createWorkspace(workspaceData);

      navigate(API_ROUTES.PUBLIC.NAV.PENDING_APPROVAL, {
        state: workspaceData,
      });
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const data = err?.response?.data;
        const raw = data?.errors;
        const fields: { field: string; message: string }[] = Array.isArray(raw) ? raw : [];
        if (fields.length > 0) {
          setFieldErrors(fields.map((e) => e.message));
        } else {
          setError(data?.message || "Failed to create workspace");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <span className="text-sm font-bold text-white">A</span>
            </div>
            <span className="text-lg font-semibold text-brand-text">AudioHive</span>
          </div>

          <button
            type="button"
            onClick={() => navigate(API_ROUTES.PUBLIC.NAV.LOGIN)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Create Your Workspace
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-gray-500">
            Tell us a bit about your organization to get started.
          </p>
        </div>

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-5">
            <Building2 size={20} className="text-gray-700" />
            <h2 className="text-sm font-semibold text-gray-900">
              Organization Details
            </h2>
          </div>

          {error && (
            <div className="mt-4 mx-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {fieldErrors.length > 0 && (
            <div className="mt-4 mx-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              <ul className="list-disc list-inside space-y-1">
                {fieldErrors.map((msg, i) => <li key={i}>{msg}</li>)}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-900">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="e.g. Acme Corporation"
                className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-900">
                Workspace Admin Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="workspaceAdminName"
                value={formData.workspaceAdminName}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-900">
                Workspace Admin Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="workspaceAdminEmail"
                value={formData.workspaceAdminEmail}
                onChange={handleChange}
                placeholder="admin@acmecorp.com"
                className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-900">
                Workspace Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="workspaceSlug"
                value={formData.workspaceSlug}
                onChange={handleChange}
                placeholder="e.g. acme-corp"
                className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                This will be used as your workspace identifier.
              </p>
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-200 px-6 py-5">
            <button
              type="button"
              onClick={handleContinue}
              disabled={
                isLoading ||
                !formData.companyName.trim() ||
                !formData.workspaceAdminName.trim() ||
                !formData.workspaceAdminEmail.trim() ||
                !formData.workspaceSlug.trim()
              }
              className="flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit Request
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CreateWorkspace;