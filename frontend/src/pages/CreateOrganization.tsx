import { useState } from "react";
import { ArrowLeft, ArrowRight, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createOrganization } from "../services/organizationServices";
import { isAxiosError } from "axios";
import { API_ROUTES } from "../constants/Api_Routes";


interface IFormData {
  companyName: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
}

const CreateOrganization = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<IFormData>({
    companyName: "",
    slug: "",
    ownerName: "",
    ownerEmail: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  const handleContinue = async () => {
    setFieldErrors([]);
    setError(null);
    setFormErrors({});

    const errors: Record<string, string> = {};
    if (!formData.companyName.trim()) {
      errors.companyName = "Company name is required";
    }
    if (!formData.slug.trim()) {
      errors.slug = "Organization slug is required";
    }
    if (!formData.ownerName.trim()) {
      errors.ownerName = "Owner name is required";
    }
    if (!formData.ownerEmail.trim()) {
      errors.ownerEmail = "Owner email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.ownerEmail.trim())) {
      errors.ownerEmail = "Please enter a valid email address";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);

    const organizationData = {
      companyName: formData.companyName.trim(),
      slug: formData.slug.trim().toLowerCase(),
      ownerName: formData.ownerName.trim(),
      ownerEmail: formData.ownerEmail.trim(),
    };

    try {
      await createOrganization(organizationData);

      navigate("/invitation-sent", {
        state: organizationData,
      });
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const data = err?.response?.data;
        const raw = data?.errors;
        const fields: { field: string; message: string }[] = Array.isArray(raw) ? raw : [];
        if (fields.length > 0) {
          setFieldErrors(fields.map((e) => e.message));
        } else {
          setError(data?.message || "Failed to create organization");
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
            Create Your Organization
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
            <div className="mt-4 mx-6 rounded-lg bg-red-50  px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {fieldErrors.length > 0 && (
            <div className="mt-4 mx-6 rounded-lg bg-red-50  px-4 py-3 text-sm text-red-600">
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
                className={`h-10 w-full rounded-md border px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-1 ${formErrors.companyName ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'}`}
              />
              {formErrors.companyName && (
                <p className="mt-1 text-xs text-red-500">{formErrors.companyName}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-900">
                Organization Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="e.g. acme-corp"
                className={`h-10 w-full rounded-md border px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-1 ${formErrors.slug ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'}`}
              />
              {formErrors.slug ? (
                <p className="mt-1 text-xs text-red-500">{formErrors.slug}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-400">
                  Lowercase letters, numbers, hyphens only.
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-900">
                Owner Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                placeholder="e.g. Jane Doe"
                className={`h-10 w-full rounded-md border px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-1 ${formErrors.ownerName ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'}`}
              />
              {formErrors.ownerName && (
                <p className="mt-1 text-xs text-red-500">{formErrors.ownerName}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-900">
                Owner Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="ownerEmail"
                value={formData.ownerEmail}
                onChange={handleChange}
                placeholder="admin@acmecorp.com"
                className={`h-10 w-full rounded-md border px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-1 ${formErrors.ownerEmail ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'}`}
              />
              {formErrors.ownerEmail && (
                <p className="mt-1 text-xs text-red-500">{formErrors.ownerEmail}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-200 px-6 py-5">
            <button
              type="button"
              onClick={handleContinue}
              disabled={isLoading}
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

export default CreateOrganization;
