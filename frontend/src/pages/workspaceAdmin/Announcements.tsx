import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Megaphone,
  Plus,
  Search,
  X,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  MoreVertical,
  Users,
  CheckCircle2,
  Eye,
  RotateCcw,
} from "lucide-react";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  pinAnnouncement,
} from "../../services/announcementServices";
import type {
  MemberAnnouncement,
  AnnouncementCounts,
} from "../../services/announcementServices";
import {
  getTypeConfig,
  formatRelativeTime,
  formatFullDateTime,
} from "../../components/announcements/announcementUtils";
import { TypeBadge } from "../../components/announcements/TypeBadge";
import { Pagination } from "../../components/announcements/Pagination";
import { AnnouncementSkeleton } from "../../components/announcements/AnnouncementSkeleton";
import { AnnouncementEmptyState } from "../../components/announcements/AnnouncementEmptyState";
import { AnnouncementModal } from "../../components/announcements/AnnouncementModal";
import type { AnnouncementFormData } from "../../components/announcements/AnnouncementModal";
import { AnnouncementReadDrawer } from "../../components/announcements/AnnouncementReadDrawer";
import ConfirmModal from "../../components/common/ConfirmModal";

const TABS = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
  { id: "archived", label: "Archived" },
  { id: "pinned", label: "Pinned" },
] as const;

interface ToastState {
  type: "success" | "error";
  message: string;
}

function HighlightText({ text, query }: { text: string; query?: string }) {
  if (!query || !query.trim() || !text) return <>{text}</>;
  const trimmed = query.trim();
  const escaped = trimmed.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark key={i} className="bg-amber-200 text-slate-900 rounded-xs px-0.5 font-medium">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function AdminAnnouncements() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state
  const activeTab = searchParams.get("tab") || "all";
  const searchQuery = searchParams.get("q") || "";
  const typeFilter = searchParams.get("type") || "all";
  const sortOption = searchParams.get("sort") || "newest";
  const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.max(10, parseInt(searchParams.get("limit") || "10", 10));

  // Local search input state (for debouncing)
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Announcement state
  const [items, setItems] = useState<MemberAnnouncement[]>([]);
  const [pinnedItems, setPinnedItems] = useState<MemberAnnouncement[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembersCount, setTotalMembersCount] = useState(0);
  const [counts, setCounts] = useState<AnnouncementCounts>({
    all: 0,
    published: 0,
    draft: 0,
    archived: 0,
    pinned: 0,
  });

  // Loading & error states
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Modals & Drawers
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MemberAnnouncement | null>(null);
  const [saving, setSaving] = useState(false);

  // Read receipts drawer
  const [readDrawerOpen, setReadDrawerOpen] = useState(false);
  const [readDrawerTarget, setReadDrawerTarget] = useState<{ id: string; title: string } | null>(null);

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState<MemberAnnouncement | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Expanded cards set (for clicking card to expand full text)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Active dropdown menu ID
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ type, message });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // Sync search input when URL changes
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Debounced search input to URL query
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== searchQuery) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          if (searchInput.trim()) {
            next.set("q", searchInput.trim());
          } else {
            next.delete("q");
          }
          next.set("page", "1");
          return next;
        });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput, searchQuery, setSearchParams]);

  // Update URL helper
  const updateQueryParam = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (!value || value === "all" || (key === "page" && value === "1") || (key === "sort" && value === "newest") || (key === "limit" && value === "10")) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
        if (key !== "page") {
          next.delete("page");
        }
        return next;
      });
    },
    [setSearchParams]
  );

  // Fetch announcements
  const fetchAnnouncements = useCallback(async () => {
    setFetching(true);
    setApiError(null);
    try {
      const res = await getAnnouncements({
        page: currentPage,
        limit: pageSize,
        tab: activeTab,
        q: searchQuery,
        type: typeFilter !== "all" ? typeFilter : undefined,
        sort: sortOption,
      });

      const data = res.data?.data || {};
      const returnedItems: MemberAnnouncement[] = data.items || data.announcements || [];
      const returnedPinned: MemberAnnouncement[] = data.pinnedItems || [];

      setItems(returnedItems);
      setPinnedItems(returnedPinned);
      setTotal(data.total ?? returnedItems.length);
      setTotalPages(data.totalPages ?? (Math.ceil((data.total ?? 1) / pageSize) || 1));
      if (data.totalMembersCount) {
        setTotalMembersCount(data.totalMembersCount);
      }
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (err: any) {
      setApiError(err?.response?.data?.message || "Failed to load announcements. Please check your connection.");
    } finally {
      setFetching(false);
      setInitialLoading(false);
    }
  }, [currentPage, pageSize, activeTab, searchQuery, typeFilter, sortOption]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-menu-container]")) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  // Card expand/collapse toggle
  const toggleCardExpand = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Create / Edit
  const handleOpenCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: MemberAnnouncement) => {
    setEditTarget(item);
    setModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSaveAnnouncement = async (formData: AnnouncementFormData) => {
    setSaving(true);
    try {
      if (editTarget) {
        await updateAnnouncement(editTarget.id || editTarget._id || "", formData);
        showToast("success", "Announcement updated successfully");
      } else {
        await createAnnouncement(formData);
        showToast("success", formData.status === "draft" ? "Draft saved successfully" : "Announcement published successfully");
      }
      setModalOpen(false);
      fetchAnnouncements();
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  // Pin / Unpin
  const handleTogglePin = async (item: MemberAnnouncement) => {
    const id = item.id || item._id || "";
    const nextPin = !item.isPinned;
    // Optimistic local update
    setItems((prev) => prev.map((a) => ((a.id || a._id) === id ? { ...a, isPinned: nextPin } : a)));
    setPinnedItems((prev) =>
      nextPin ? [...prev, { ...item, isPinned: true }] : prev.filter((a) => (a.id || a._id) !== id)
    );

    try {
      await pinAnnouncement(id, nextPin);
      showToast("success", nextPin ? "Announcement pinned to top" : "Announcement unpinned");
      fetchAnnouncements();
    } catch (err: any) {
      // Rollback
      fetchAnnouncements();
      showToast("error", err?.response?.data?.message || "Failed to update pin status");
    }
  };

  // Archive / Publish (Unarchive)
  const handleToggleArchive = async (item: MemberAnnouncement) => {
    const id = item.id || item._id || "";
    const newStatus = item.status === "archived" ? "published" : "archived";
    setActiveMenuId(null);

    // Optimistic update
    setItems((prev) => prev.map((a) => ((a.id || a._id) === id ? { ...a, status: newStatus } : a)));

    try {
      await updateAnnouncement(id, { status: newStatus });
      showToast("success", newStatus === "archived" ? "Announcement moved to archive" : "Announcement restored to published");
      fetchAnnouncements();
    } catch (err: any) {
      fetchAnnouncements();
      showToast("error", err?.response?.data?.message || "Failed to update status");
    }
  };

  // Delete with optimistic rollback
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id || deleteTarget._id || "";
    const backupItems = [...items];
    const backupPinned = [...pinnedItems];
    setDeleting(true);

    // Optimistic removal
    setItems((prev) => prev.filter((a) => (a.id || a._id) !== id));
    setPinnedItems((prev) => prev.filter((a) => (a.id || a._id) !== id));
    setDeleteTarget(null);

    try {
      await deleteAnnouncement(id);
      showToast("success", `"${deleteTarget.title}" was deleted.`);
      fetchAnnouncements();
    } catch (err: any) {
      // Rollback
      setItems(backupItems);
      setPinnedItems(backupPinned);
      showToast("error", err?.response?.data?.message || "Failed to delete announcement. Restored previous view.");
    } finally {
      setDeleting(false);
    }
  };

  // Open read receipt drawer
  const handleOpenReadDrawer = (e: React.MouseEvent, item: MemberAnnouncement) => {
    e.stopPropagation();
    setReadDrawerTarget({ id: item.id || item._id || "", title: item.title });
    setReadDrawerOpen(true);
  };

  // Clear filters helper
  const handleClearFilters = () => {
    setSearchInput("");
    setSearchParams(new URLSearchParams());
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Published
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Draft
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {status || "Unknown"}
          </span>
        );
    }
  };

  const renderAnnouncementCard = (a: MemberAnnouncement, isPinnedGroup = false) => {
    const id = a.id || a._id || "";
    const cfg = getTypeConfig(a.type);
    const Icon = cfg.icon;
    const isExpanded = expandedCards.has(id);
    const readCount = a.readCount ?? a.readBy?.length ?? 0;
    const totalMembers = a.totalMembersCount || totalMembersCount || Math.max(readCount, 1);
    const readPercent = Math.min(100, Math.round((readCount / totalMembers) * 100));

    return (
      <div
        key={id}
        onClick={() => toggleCardExpand(id)}
        className={`group bg-white rounded-2xl border transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md ${
          isPinnedGroup
            ? "border-indigo-200/80 hover:border-indigo-300 bg-linear-to-r from-indigo-50/20 via-white to-white"
            : "border-slate-200/80 hover:border-slate-300"
        } ${cfg.borderColor} border-l-4`}
      >
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            {/* Left section: Icon + Content */}
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
              {/* Type Icon */}
              <div
                className={`p-2 rounded-xl shrink-0 mt-0.5 border ${cfg.badgeColor}`}
                title={`Type: ${cfg.label}`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Title, Badges, Body */}
              <div className="flex-1 min-w-0">
                {/* Header row with Title & Badges */}
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    <HighlightText text={a.title} query={searchQuery} />
                  </h3>

                  {a.isPinned && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                      <Pin className="w-3 h-3 text-indigo-600 fill-indigo-600" /> Pinned
                    </span>
                  )}

                  <TypeBadge type={a.type} />

                  {/* Real Status Badge (fixes empty pink pill) */}
                  {getStatusBadge(a.status)}

                  {/* Audience Chip */}
                  {a.targetAudience === "room-specific" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      Room
                    </span>
                  ) : null}
                </div>

                {/* Body Content */}
                <p
                  className={`text-xs sm:text-sm text-slate-600 leading-relaxed transition-all ${
                    isExpanded ? "whitespace-pre-wrap" : "line-clamp-2"
                  }`}
                >
                  <HighlightText text={a.content} query={searchQuery} />
                </p>

                {a.content && a.content.length > 140 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCardExpand(id);
                    }}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 mt-1 inline-flex items-center gap-0.5"
                  >
                    {isExpanded ? "Show less" : "Show full announcement"}
                  </button>
                )}

                {/* Metadata Row: Author, Date, Read tracking */}
                <div className="flex items-center flex-wrap gap-y-2 gap-x-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  {/* Author */}
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                      {a.author?.name ? a.author.name.slice(0, 2) : "AD"}
                    </span>
                    <span>{a.author?.name || "Admin"}</span>
                  </span>

                  {/* Date with hover tooltip */}
                  <span
                    className="cursor-help hover:text-slate-800 transition-colors"
                    title={formatFullDateTime(a.createdAt)}
                  >
                    {formatRelativeTime(a.createdAt)}
                  </span>

                  {/* Read Tracking Bar */}
                  <button
                    type="button"
                    onClick={(e) => handleOpenReadDrawer(e, a)}
                    className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100 hover:border-slate-300 transition-all text-slate-700 cursor-pointer shadow-2xs group/track"
                    title="Click to view who has and hasn't read this announcement"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-500 group-hover/track:text-indigo-600 transition-colors" />
                    <span className="text-[11px] font-semibold">
                      <span className="text-slate-900 font-bold">{readCount}</span> of {totalMembers} read
                    </span>
                    <div className="w-16 sm:w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden shrink-0">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${readPercent}%` }}
                      />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right section: Action Buttons */}
            <div
              className="flex items-center sm:items-start gap-1.5 shrink-0 self-end sm:self-auto pt-2 sm:pt-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Edit button */}
              <button
                type="button"
                onClick={() => handleOpenEdit(a)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-2xs"
                aria-label={`Edit announcement ${a.title}`}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>

              {/* Pin / Unpin button */}
              <button
                type="button"
                onClick={() => handleTogglePin(a)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors shadow-2xs ${
                  a.isPinned
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                }`}
                aria-label={a.isPinned ? "Unpin announcement" : "Pin announcement"}
              >
                {a.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{a.isPinned ? "Unpin" : "Pin"}</span>
              </button>

              {/* More Actions Dropdown (...) */}
              <div className="relative" data-menu-container>
                <button
                  type="button"
                  onClick={() => setActiveMenuId(activeMenuId === id ? null : id)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
                  aria-label="More actions"
                  aria-expanded={activeMenuId === id}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {activeMenuId === id && (
                  <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(a)}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                    >
                      {a.status === "archived" ? (
                        <>
                          <ArchiveRestore className="w-4 h-4 text-slate-500" />
                          <span>Publish (Unarchive)</span>
                        </>
                      ) : (
                        <>
                          <Archive className="w-4 h-4 text-slate-500" />
                          <span>Archive</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenuId(null);
                        handleOpenReadDrawer({ stopPropagation: () => {} } as any, a);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                    >
                      <Eye className="w-4 h-4 text-slate-500" />
                      <span>View Read Receipts</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenuId(null);
                        setDeleteTarget(a);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold border transition-all animate-in slide-in-from-bottom-5 ${
            toast.type === "success"
              ? "bg-slate-900 text-white border-slate-800"
              : "bg-rose-600 text-white border-rose-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <X className="w-4 h-4 text-white shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shadow-2xs">
            <Megaphone className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Announcements</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Broadcast messages, alerts, and events to your workspace members
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all hover:shadow-indigo-500/20 active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Status Tabs with server-provided counts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = counts[tab.id as keyof AnnouncementCounts] ?? 0;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => updateQueryParam("tab", tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white font-semibold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search, Type Filter & Sort Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        {/* Search Input (Debounced 300ms) */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search announcements by title or content..."
            className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter & Sort Dropdowns */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2.5">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => updateQueryParam("type", e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer shadow-2xs"
            >
              <option value="all">All Types</option>
              <option value="info">Info</option>
              <option value="warning">Warning / Important</option>
              <option value="critical">Critical / Urgent</option>
              <option value="event">Event</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">Sort:</span>
            <select
              value={sortOption}
              onChange={(e) => updateQueryParam("sort", e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer shadow-2xs"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="most_read">Most read</option>
              <option value="least_read">Least read</option>
            </select>
          </div>

          {/* Reset Filters (if active) */}
          {(searchQuery || typeFilter !== "all" || sortOption !== "newest" || activeTab !== "all") && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center gap-1 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`space-y-6 relative ${fetching && !initialLoading ? "opacity-60 pointer-events-none transition-opacity" : ""}`}>
        {initialLoading ? (
          <AnnouncementSkeleton count={4} />
        ) : apiError ? (
          <AnnouncementEmptyState
            type="error"
            errorMessage={apiError}
            onRetry={fetchAnnouncements}
          />
        ) : items.length === 0 && pinnedItems.length === 0 ? (
          searchQuery || typeFilter !== "all" ? (
            <AnnouncementEmptyState
              type="no-results"
              searchQuery={searchQuery}
              onClearFilters={handleClearFilters}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-14 text-center shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mx-auto flex items-center justify-center mb-3.5 shadow-2xs">
                <Megaphone className="w-7 h-7 stroke-[1.75]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                {activeTab === "all" ? "No announcements yet" : `No ${activeTab} announcements`}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-5">
                Broadcast critical updates, upcoming events, or team news to all workspace members.
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create your first announcement</span>
              </button>
            </div>
          )
        ) : (
          <div className="space-y-6">
            {/* Pinned Announcements Group (Shown at the top of page 1 of "All" tab only) */}
            {activeTab === "all" && currentPage === 1 && pinnedItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="p-1 rounded-md bg-indigo-50 text-indigo-600">
                    <Pin className="w-3.5 h-3.5 fill-indigo-600" />
                  </div>
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Pinned Announcements ({pinnedItems.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {pinnedItems.map((a) => renderAnnouncementCard(a, true))}
                </div>
              </div>
            )}

            {/* Main List */}
            {items.length > 0 ? (
              <div className="space-y-3">
                {activeTab === "all" && currentPage === 1 && pinnedItems.length > 0 && (
                  <div className="px-1 pt-2">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      All Announcements
                    </h2>
                  </div>
                )}
                {items.map((a) => renderAnnouncementCard(a, false))}
              </div>
            ) : null}

            {/* Pagination Footer */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              pageSize={pageSize}
              onPageChange={(page) => updateQueryParam("page", String(page))}
              onPageSizeChange={(size) => updateQueryParam("limit", String(size))}
            />
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <AnnouncementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveAnnouncement}
        editTarget={editTarget}
        saving={saving}
      />

      {/* Read Receipts Drawer */}
      <AnnouncementReadDrawer
        isOpen={readDrawerOpen}
        onClose={() => {
          setReadDrawerOpen(false);
          setReadDrawerTarget(null);
        }}
        announcementId={readDrawerTarget?.id || null}
        announcementTitle={readDrawerTarget?.title || ""}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Announcement?"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? All member read receipts and references will be removed.`}
        confirmLabel={deleting ? "Deleting..." : "Delete Announcement"}
        cancelLabel="Cancel"
        isDanger={true}
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
