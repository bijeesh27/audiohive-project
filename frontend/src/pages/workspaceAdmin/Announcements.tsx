import { useState } from "react";
import { useAnnouncements } from "../../hooks/useAnnouncements";
import type { Announcement } from "../../hooks/useAnnouncements";
import ActionButton from "../../components/common/ActionButton";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  pinAnnouncement,
} from "../../services/announcementServices";
import {
  Megaphone,
  Plus,
  Pin,
  PinOff,
  Trash2,
  Pencil,
  X,
  AlertTriangle,
  Info,
  Zap,
  CalendarDays,
  Users,
} from "lucide-react";

const TYPE_CONFIG = {
  info: { label: "Info", icon: Info, color: "bg-blue-50 text-blue-700", border: "border-l-blue-500" },
  warning: { label: "Warning", icon: AlertTriangle, color: "bg-amber-50 text-amber-700", border: "border-l-amber-500" },
  critical: { label: "Critical", icon: Zap, color: "bg-red-50 text-red-700", border: "border-l-red-500" },
  event: { label: "Event", icon: CalendarDays, color: "bg-green-50 text-green-700", border: "border-l-green-500" },
};

const EMPTY_FORM = {
  title: "",
  content: "",
  type: "info" as Announcement["type"],
  targetAudience: "all" as "all" | "room-specific",
  status: "published" as "draft" | "published",
};

const TABS = ["all", "published", "draft", "archived", "pinned"] as const;

export default function AdminAnnouncements() {
  const { announcements, loading, refetch } = useAnnouncements();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("all");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = announcements.filter((a) => {
    if (activeTab === "all") return true;
    if (activeTab === "pinned") return a.isPinned;
    return a.status === activeTab;
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (a: Announcement) => {
    setEditTarget(a);
    setForm({
      title: a.title,
      content: a.content,
      type: a.type,
      targetAudience: a.targetAudience,
      status: a.status === "archived" ? "published" : (a.status as "draft" | "published"),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await updateAnnouncement(editTarget._id, form);
      } else {
        await createAnnouncement(form);
      }
      setShowModal(false);
      refetch();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handlePin = async (id: string, current: boolean) => {
    await pinAnnouncement(id, !current);
    refetch();
  };

  const handleDelete = async (id: string) => {
    await deleteAnnouncement(id);
    setDeleteConfirm(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Megaphone className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Announcements</h1>
            <p className="text-sm text-gray-500">Broadcast messages to your workspace members</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Megaphone className="w-12 h-12 mb-3 text-gray-300" />
          <p className="text-base font-medium text-gray-500">No announcements yet</p>
          <p className="text-sm mt-1">Click "New Announcement" to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const cfg = TYPE_CONFIG[a.type];
            const Icon = cfg.icon;
            return (
              <div
                key={a._id}
                className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm border-l-4 ${cfg.border}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-1.5 rounded-lg mt-0.5 ${cfg.color.split(" ")[0]}`}>
                      <Icon className={`w-4 h-4 ${cfg.color.split(" ")[1]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-900">{a.title}</h3>
                        {a.isPinned && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            <Pin className="w-3 h-3" /> Pinned
                          </span>
                        )}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          a.status === "published" ? "bg-green-50 text-green-700" :
                          a.status === "draft" ? "bg-gray-100 text-gray-600" :
                          "bg-red-50 text-red-600"
                        }`}>
                          {a.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {a.readBy?.length ?? 0} read
                        </span>
                        <span>{new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <ActionButton
                      icon={Pencil}
                      label="Edit"
                      onClick={() => openEdit(a)}
                      colorClasses="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                    />
                    <ActionButton
                      icon={a.isPinned ? PinOff : Pin}
                      label={a.isPinned ? "Unpin" : "Pin"}
                      onClick={() => handlePin(a._id, a.isPinned)}
                      colorClasses="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                    />
                    <ActionButton
                      icon={Trash2}
                      label="Delete"
                      onClick={() => setDeleteConfirm(a._id)}
                      colorClasses="text-gray-400 hover:text-red-600 hover:bg-red-50"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editTarget ? "Edit Announcement" : "New Announcement"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Announcement title..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  rows={4}
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Write your announcement..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Announcement["type"] }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.entries(TYPE_CONFIG).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "draft" | "published" }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="published">Publish Now</option>
                    <option value="draft">Save as Draft</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim() || !form.content.trim()}
                className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : editTarget ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Delete Announcement</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently delete the announcement and notify all connected members to remove it from their view.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
