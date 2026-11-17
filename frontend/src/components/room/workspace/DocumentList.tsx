import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  ArrowUpDown,
  UploadCloud,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { useSocket } from "../../../context/SocketContext";
import { useAuth } from "../../../context/AuthContext";
import {
  getRoomDocuments,
  uploadRoomDocument,
  getRoomDocumentFile,
  deleteRoomDocument,
  renameRoomDocument,
} from "../../../services/documentServices";
import type { RoomDocumentItem } from "../../../types/rooms";
import { formatFileSize } from "../../common/formatters";
import { DocumentRow } from "./DocumentRow";
import { UploadZone } from "./UploadZone";
import type { UploadQueueItem } from "./UploadZone";
import { FilePreviewModal } from "./FilePreviewModal";
import { ConfirmDialog } from "../../common/ConfirmDialog";
import { Pagination } from "../../common/Pagination";
import { EmptyState } from "../../common/EmptyState";

interface DocumentListProps {
  roomId: string;
  isRoomAdminOrOwner: boolean;
  onTotalCountChange?: (count: number) => void;
}

type FilterCategory = "all" | "documents" | "images" | "audio" | "video" | "other";
type SortOption = "newest" | "oldest" | "name" | "size";

export const DocumentList: React.FC<DocumentListProps> = ({
  roomId,
  isRoomAdminOrOwner,
  onTotalCountChange,
}) => {
  const { socket } = useSocket();
  const { userId } = useAuth();
  const [documents, setDocuments] = useState<RoomDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<FilterCategory>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);

  // Modals
  const [previewDoc, setPreviewDoc] = useState<RoomDocumentItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RoomDocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [renameTarget, setRenameTarget] = useState<RoomDocumentItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // 1. Fetch documents
  const fetchDocs = () => {
    setLoading(true);
    getRoomDocuments(roomId)
      .then((res) => {
        const list = res.data.data || [];
        setDocuments(list);
        if (onTotalCountChange) onTotalCountChange(list.length);
      })
      .catch(() => setError("Failed to load documents"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDocs();
  }, [roomId]);

  // 2. Realtime socket sync
  useEffect(() => {
    if (!socket || !roomId) return;

    const onNewDoc = (newDoc: RoomDocumentItem) => {
      setDocuments((prev) => [newDoc, ...prev]);
    };
    const onDeleteDoc = (id: string) => {
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    };
    const onRenameDoc = (data: { documentId: string; originalName: string }) => {
      setDocuments((prev) =>
        prev.map((d) => (d._id === data.documentId ? { ...d, originalName: data.originalName } : d))
      );
    };

    socket.on("room:new-document", onNewDoc);
    socket.on("room:delete-document", onDeleteDoc);
    socket.on("room:rename-document", onRenameDoc);

    return () => {
      socket.off("room:new-document", onNewDoc);
      socket.off("room:delete-document", onDeleteDoc);
      socket.off("room:rename-document", onRenameDoc);
    };
  }, [socket, roomId]);

  // Upload handler with progress queue
  const handleUploadFiles = async (files: File[]) => {
    for (const file of files) {
      const queueId = Math.random().toString(36).substring(7);
      const queueItem: UploadQueueItem = {
        id: queueId,
        file,
        name: file.name,
        size: file.size,
        progress: 20,
        status: "uploading",
      };
      setUploadQueue((prev) => [queueItem, ...prev]);

      try {
        setUploadQueue((prev) => prev.map((q) => (q.id === queueId ? { ...q, progress: 65 } : q)));
        await uploadRoomDocument(roomId, file);
        setUploadQueue((prev) => prev.map((q) => (q.id === queueId ? { ...q, progress: 100, status: "completed" } : q)));
        fetchDocs();
      } catch (err: any) {
        setUploadQueue((prev) =>
          prev.map((q) =>
            q.id === queueId ? { ...q, status: "error", error: err?.response?.data?.message || "Upload failed" } : q
          )
        );
      }
    }
  };

  // Preview & Download
  const handlePreview = async (doc: RoomDocumentItem) => {
    setPreviewDoc(doc);
    setPreviewLoading(true);
    try {
      const res = await getRoomDocumentFile(roomId, doc._id);
      setPreviewUrl(res.data.data.downloadUrl);
    } catch {
      setPreviewUrl(undefined);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (doc: RoomDocumentItem) => {
    try {
      const res = await getRoomDocumentFile(roomId, doc._id);
      const link = document.createElement("a");
      link.href = res.data.data.downloadUrl;
      link.download = doc.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert("Failed to download file");
    }
  };

  // Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteRoomDocument(roomId, deleteTarget._id);
      setDocuments((prev) => prev.filter((d) => d._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete file");
    } finally {
      setIsDeleting(false);
    }
  };

  // Rename
  const handleConfirmRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    try {
      setIsRenaming(true);
      await renameRoomDocument(roomId, renameTarget._id, renameValue.trim());
      setDocuments((prev) =>
        prev.map((d) => (d._id === renameTarget._id ? { ...d, originalName: renameValue.trim() } : d))
      );
      setRenameTarget(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to rename file");
    } finally {
      setIsRenaming(false);
    }
  };

  // Filtering & Sorting
  const filteredDocuments = useMemo(() => {
    let list = [...documents];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((d) => d.originalName.toLowerCase().includes(q));
    }
    if (category !== "all") {
      list = list.filter((d) => {
        const ext = (d.originalName.split(".").pop() || "").toLowerCase();
        if (category === "documents") return ["pdf", "doc", "docx", "txt", "rtf"].includes(ext);
        if (category === "images") return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
        if (category === "audio") return ["mp3", "wav", "ogg"].includes(ext);
        if (category === "video") return ["mp4", "webm", "mov"].includes(ext);
        return true;
      });
    }

    list.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "name") return a.originalName.localeCompare(b.originalName);
      if (sortBy === "size") return b.size - a.size;
      return 0;
    });

    return list;
  }, [documents, searchQuery, category, sortBy]);

  const totalSize = useMemo(() => documents.reduce((sum, d) => sum + d.size, 0), [documents]);
  const paginatedDocuments = filteredDocuments.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredDocuments.length / pageSize);

  return (
    <div className="space-y-4">
      {/* Header Banner: Room Resources + Total Size + Upload Button */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Room Resources</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            <span className="font-semibold text-gray-800">{documents.length}</span> {documents.length === 1 ? "file" : "files"}
            {" · "}Total {formatFileSize(totalSize)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadZone(!showUploadZone)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>{showUploadZone ? "Hide Upload" : "Upload File"}</span>
        </button>
      </div>

      {/* Upload Zone (collapsible or drag over list) */}
      {showUploadZone && (
        <UploadZone
          isUploading={loading}
          onUploadFiles={handleUploadFiles}
          queue={uploadQueue}
          onCancelUpload={(id) => setUploadQueue((prev) => prev.filter((q) => q.id !== id))}
          onDismissItem={(id) => setUploadQueue((prev) => prev.filter((q) => q.id !== id))}
        />
      )}

      {/* Toolbar: Search, Category Filter Pills, Sort Dropdown */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by file name..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Pills & Sort */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Pills */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl text-xs overflow-x-auto">
            {(["all", "documents", "images", "audio", "video"] as FilterCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => { setCategory(cat); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg font-medium capitalize transition-all cursor-pointer ${
                  category === cat ? "bg-white text-indigo-700 shadow-xs font-semibold" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 border-l border-gray-200 pl-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs font-medium rounded-lg bg-gray-50 border border-gray-200 py-1 px-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name (A-Z)</option>
              <option value="size">Size (Largest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document Table / List */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden max-h-[60vh] overflow-y-auto">
        {error ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs text-rose-600 font-semibold">{error}</p>
            <button
              type="button"
              onClick={fetchDocs}
              className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <span className="text-xs font-medium">Loading documents...</span>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title={searchQuery ? "No matching files" : "No documents uploaded yet"}
            description={
              searchQuery
                ? `No files matching "${searchQuery}". Try a different search term.`
                : "Upload resources, specifications, presentations, or audio clips for this room."
            }
            actionLabel="Upload First File"
            onAction={() => setShowUploadZone(true)}
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {paginatedDocuments.map((doc) => {
              const uploaderUserId = typeof doc.uploaderId === "object" ? doc.uploaderId?._id : doc.uploaderId;
              const canManage = isRoomAdminOrOwner || uploaderUserId === userId;

              return (
                <DocumentRow
                  key={doc._id}
                  document={doc}
                  canManage={Boolean(canManage)}
                  onPreview={handlePreview}
                  onDownload={handleDownload}
                  onRename={(d) => { setRenameTarget(d); setRenameValue(d.originalName); }}
                  onDelete={(d) => setDeleteTarget(d)}
                />
              );
            })}
          </div>
        )}

        {/* Pagination if > 20 files */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={filteredDocuments.length}
          pageSize={pageSize}
        />
      </div>

      {/* Preview Modal */}
      <FilePreviewModal
        document={previewDoc}
        fileUrl={previewUrl}
        isLoading={previewLoading}
        onClose={() => setPreviewDoc(null)}
        onDownload={handleDownload}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Document"
        message={
          <div>
            <p>
              Are you sure you want to permanently delete{" "}
              <strong className="text-gray-900 font-semibold">{deleteTarget?.originalName}</strong>?
            </p>
            <p className="mt-1 text-xs text-gray-500">This action cannot be undone.</p>
          </div>
        }
        confirmLabel="Delete"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Rename Dialog */}
      {renameTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-in fade-in"
          onClick={() => setRenameTarget(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-900">Rename Document</h3>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">New File Name</label>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRename}
                disabled={isRenaming || !renameValue.trim()}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 cursor-pointer"
              >
                {isRenaming ? "Renaming..." : "Save Name"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DocumentList;

