import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import Button from "../../components/common/Button";
import { createWorkspace } from "../../services/workspaceServices";

interface IFormData {
  workspaceName: string;
  slug: string;
}

const CreateWorkspace = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<IFormData>({
    workspaceName: "",
    slug: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.workspaceName.trim() || !formData.slug.trim()) return;
    setError(null);
    setIsLoading(true);
    try {
      await createWorkspace({
        workspaceName: formData.workspaceName.trim(),
        slug: formData.slug.trim().toLowerCase(),
      });
      navigate("/organization-owner/workspace");
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to create workspace.");
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Create Workspace</h1>
        <p className="mt-1 text-sm text-gray-500">
          Set a workspace name and a unique slug.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="workspaceName"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Workspace Name
          </label>
          <input
            id="workspaceName"
            name="workspaceName"
            type="text"
            value={formData.workspaceName}
            onChange={handleChange}
            placeholder="Acme Inc"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="slug" className="mb-1 block text-sm font-medium text-gray-700">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            value={formData.slug}
            onChange={handleChange}
            placeholder="acme-inc"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            Lowercase letters, numbers, hyphens only. 3–63 characters.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/organization-owner/workspace")}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <Button
            label={isLoading ? "Creating..." : "Create Workspace"}
            buttonType="submit"
            disabled={isLoading || !formData.workspaceName.trim() || !formData.slug.trim()}
          />
        </div>
      </form>
    </div>
  );
};

export default CreateWorkspace;