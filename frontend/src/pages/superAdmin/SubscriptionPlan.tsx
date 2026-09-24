import React, { useEffect, useState } from 'react'
import { subscriptionService } from '../../services/subscriptionServices'
import ActionButton from "../../components/common/ActionButton";
import { Plus, Pencil, ShieldBan, ShieldCheck, Trash2 } from "lucide-react";

interface ISubscription {
  _id: string;
  subscriptionName: string;
  price: number;
  maxWorkspaces: number;
  features: string[];
  isActive: boolean;
}

type PlanForm = Omit<ISubscription, "_id">;

const emptyForm: PlanForm = {
  subscriptionName: "",
  price: 0,
  description: "",
  maxWorkspaces: 0,
  features: [],
  isActive: true,
};

const SubscriptionPlan = () => {
  const [plans, setPlans] = useState<ISubscription[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [featureInput, setFeatureInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [confirmTogglePlan, setConfirmTogglePlan] = useState<ISubscription | null>(null);
  const [toggling, setToggling] = useState(false);

  const [confirmDeletePlan, setConfirmDeletePlan] = useState<ISubscription | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPlans = () => {
    setLoading(true);
    subscriptionService.getAllSubscriptions()
      .then(res => setPlans(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFeatureInput("");
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (plan: ISubscription) => {
    setEditingId(plan._id);
    setForm({
      subscriptionName: plan.subscriptionName,
      price: plan.price,
      description: plan.description,
      maxWorkspaces: plan.maxWorkspaces,
      features: [...plan.features],
      isActive: plan.isActive,
    });
    setFeatureInput("");
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
  };

  const addFeature = () => {
    const val = featureInput.trim();
    if (!val) return;
    setForm(f => ({ ...f, features: [...f.features, val] }));
    setFeatureInput("");
  };

  const removeFeature = (idx: number) => {
    setForm(f => ({ ...f, features: f.features.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subscriptionName.trim()) {
      setFormError("Plan name is required");
      return;
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      setFormError("Description must be at least 10 characters");
      return;
    }
    if (form.price < 0) {
      setFormError("Price cannot be negative");
      return;
    }
    if (form.maxWorkspaces < 1) {
      setFormError("Max workspaces must be at least 1");
      return;
    }
    if (!form.features || form.features.length === 0) {
      setFormError("Add at least one feature");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        await subscriptionService.updateSubscription(editingId, form);
      } else {
        await subscriptionService.createSubscription(form);
      }
      setShowModal(false);
      fetchPlans();
    } catch (err: any) {
  const apiErrors = err?.response?.data?.errors;
  const message = Array.isArray(apiErrors)
    ? apiErrors.map((e: { field: string; message: string }) => e.message).join(", ")
    : err?.response?.data?.message || "Save failed";
  setFormError(message);
} finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmTogglePlan) return;
    setToggling(true);
    try {
      const updatedPlan = {
        subscriptionName: confirmTogglePlan.subscriptionName,
        price: confirmTogglePlan.price,
        description: confirmTogglePlan.description,
        maxWorkspaces: confirmTogglePlan.maxWorkspaces,
        features: confirmTogglePlan.features,
        isActive: !confirmTogglePlan.isActive,
      };
      await subscriptionService.updateSubscription(confirmTogglePlan._id, updatedPlan);
      setConfirmTogglePlan(null);
      fetchPlans();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update status");
    } finally {
      setToggling(false);
    }
  };

  const handleDeleteSubscription = async () => {
    if (!confirmDeletePlan) return;
    setDeleting(true);
    try {
      await subscriptionService.deleteSubscription(confirmDeletePlan._id);
      setConfirmDeletePlan(null);
      fetchPlans();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete plan");
    } finally {
      setDeleting(false);
    }
  };
  

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Subscription Plans</h2>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Plan
        </button>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center text-sm text-gray-500">
          Loading plans...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {plan.subscriptionName}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 leading-5">
                    {plan.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ActionButton
                    icon={Pencil}
                    label="Edit"
                    onClick={() => openEdit(plan)}
                    colorClasses="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  />
                  <ActionButton
                    icon={plan.isActive ? ShieldBan : ShieldCheck}
                    label={plan.isActive ? "Block" : "Unblock"}
                    onClick={() => setConfirmTogglePlan(plan)}
                    colorClasses={
                      plan.isActive
                        ? "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                        : "border border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                    }
                  />
                  <ActionButton
                    icon={Trash2}
                    label="Delete"
                    onClick={() => setConfirmDeletePlan(plan)}
                    colorClasses="border border-gray-300 bg-white text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    ₹{plan.price}
                  </span>
                  <span className="text-sm text-gray-500 mb-1">/month</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 mb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Maximum Workspaces</span>
                  <span className="text-sm font-semibold text-gray-900">{plan.maxWorkspaces}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Features</h4>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-50 text-green-600">
                        ✓
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    plan.isActive
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {plan.isActive ? "Active" : "Blocked"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-base font-semibold text-gray-900">
              {editingId ? "Edit Plan" : "Add Plan"}
            </h2>

            <form noValidate onSubmit={handleSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-md  bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                <input
                  type="text"
                  value={form.subscriptionName}
                  onChange={(e) => setForm(f => ({ ...f, subscriptionName: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Workspaces</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxWorkspaces}
                    onChange={(e) => setForm(f => ({ ...f, maxWorkspaces: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Features</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                    placeholder="Add feature and press Enter"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Add
                  </button>
                </div>
                {form.features.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {form.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 rounded-md px-3 py-1.5">
                        <span>{feature}</span>
                        <button
                          type="button"
                          onClick={() => removeFeature(idx)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmTogglePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">
              {confirmTogglePlan.isActive ? "Block Plan" : "Unblock Plan"}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to {confirmTogglePlan.isActive ? "block" : "unblock"} the plan "{confirmTogglePlan.subscriptionName}"?
              {confirmTogglePlan.isActive && " New users won't be able to subscribe to it."}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmTogglePlan(null)}
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
                  confirmTogglePlan.isActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {toggling ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeletePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Delete Plan</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete the plan "{confirmDeletePlan.subscriptionName}"? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeletePlan(null)}
                disabled={deleting}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubscription}
                disabled={deleting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlan;