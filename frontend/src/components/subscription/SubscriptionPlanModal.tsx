import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";

export interface ISubscriptionForm {
  subscriptionName: string;
  description: string;
  price: number;
  maxUsers: number;
  maxRooms: number;
  features: string[];
  isActive: boolean;
}

interface SubscriptionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ISubscriptionForm) => void;
  initialData?: ISubscriptionForm | null;
  loading?: boolean;
}

const initialForm: ISubscriptionForm = {
  subscriptionName: "",
  description: "",
  price: 0,
  maxUsers: 1,
  maxRooms: 1,
  features: [],
  isActive: true,
};

export default function SubscriptionPlanModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: SubscriptionPlanModalProps) {
  const [formData, setFormData] =
    useState<ISubscriptionForm>(initialForm);

  const [featureInput, setFeatureInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData(initialForm);
      }

      setFeatureInput("");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "price" ||
        name === "maxUsers" ||
        name === "maxRooms"
          ? Number(value)
          : value,
    }));
  };

  const addFeature = () => {
    const feature = featureInput.trim();

    if (!feature) return;

    if (formData.features.includes(feature)) {
      setFeatureInput("");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, feature],
    }));

    setFeatureInput("");
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const handleSubmit = () => {
    if (!formData.subscriptionName.trim()) {
      alert("Subscription name is required");
      return;
    }

    if (!formData.description.trim()) {
      alert("Description is required");
      return;
    }

    if (formData.features.length === 0) {
      alert("Add at least one feature");
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">

        {/* Header */}

        <div className="flex items-center justify-between border-b px-6 py-5">

          <div>
            <h2 className="text-2xl font-bold">
              {initialData
                ? "Edit Subscription Plan"
                : "Create Subscription Plan"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Configure your subscription plan.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X size={22} />
          </button>

        </div>

        {/* Body */}

        <div className="space-y-6 p-6">

          <div>

            <label className="mb-2 block text-sm font-medium">
              Subscription Name
            </label>

            <input
              type="text"
              name="subscriptionName"
              value={formData.subscriptionName}
              onChange={handleChange}
              placeholder="Professional"
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            />

          </div>

          <div>

            <label className="mb-2 block text-sm font-medium">
              Description
            </label>

            <textarea
              rows={4}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Subscription description..."
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            />

          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            <div>

              <label className="mb-2 block text-sm font-medium">
                Price (₹)
              </label>

              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full rounded-lg border px-4 py-3"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-medium">
                Max Users
              </label>

              <input
                type="number"
                name="maxUsers"
                value={formData.maxUsers}
                onChange={handleChange}
                className="w-full rounded-lg border px-4 py-3"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-medium">
                Max Rooms
              </label>

              <input
                type="number"
                name="maxRooms"
                value={formData.maxRooms}
                onChange={handleChange}
                className="w-full rounded-lg border px-4 py-3"
              />

            </div>

          </div>

          {/* Features */}

          <div>

            <label className="mb-2 block text-sm font-medium">
              Features
            </label>

            <div className="flex gap-2">

              <input
                value={featureInput}
                onChange={(e) =>
                  setFeatureInput(e.target.value)
                }
                placeholder="Add feature..."
                className="flex-1 rounded-lg border px-4 py-3"
              />

              <button
                type="button"
                onClick={addFeature}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
              >
                <Plus size={18} />
                Add
              </button>

            </div>

            <div className="mt-4 flex flex-wrap gap-2">

              {formData.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2"
                >
                  <span className="text-sm">
                    {feature}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      removeFeature(index)
                    }
                  >
                    <Trash2
                      size={15}
                      className="text-red-500"
                    />
                  </button>

                </div>
              ))}

            </div>

          </div>

          {/* Status */}

          <div>

            <label className="flex items-center gap-3">

              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
              />

              <span className="font-medium">
                Active Subscription
              </span>

            </label>

          </div>

        </div>

        {/* Footer */}

        <div className="flex justify-end gap-3 border-t px-6 py-5">

          <button
            onClick={onClose}
            className="rounded-lg border px-6 py-2 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={handleSubmit}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : initialData
              ? "Update Plan"
              : "Create Plan"}
          </button>

        </div>

      </div>

    </div>
  );
}